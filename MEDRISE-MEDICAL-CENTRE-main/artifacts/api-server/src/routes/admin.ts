import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, adminsTable, loginHistoryTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminMeResponse,
  ChangePasswordBody,
} from "@workspace/api-zod";
import { createSession, deleteSession, getSessionFromRequest, type SessionData } from "../lib/session";

const router: IRouter = Router();

const MAX_FAILED = 5;
const LOCKOUT_MINUTES = 15;

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

async function recordLoginHistory(
  adminId: number | null,
  username: string,
  success: boolean,
  ipAddress: string,
  userAgent: string,
  failureReason?: string,
): Promise<void> {
  await db.insert(loginHistoryTable).values({ adminId, username, success, ipAddress, userAgent: userAgent.slice(0, 512), failureReason: failureReason ?? null });
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { username, password } = parsed.data;
  const ip = getClientIp(req);
  const ua = String(req.headers["user-agent"] ?? "");

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));

  if (!admin) {
    await recordLoginHistory(null, username, false, ip, ua, "Account not found");
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  if (admin.isActive === false) {
    await recordLoginHistory(admin.id, username, false, ip, ua, "Account inactive");
    res.status(403).json({ error: "Account is inactive. Contact your administrator." });
    return;
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const mins = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    await recordLoginHistory(admin.id, username, false, ip, ua, "Account locked");
    res.status(423).json({ error: `Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.` });
    return;
  }

  const passwordValid = await bcrypt.compare(password, admin.password);

  if (!passwordValid) {
    const newAttempts = (admin.failedLoginAttempts ?? 0) + 1;
    const shouldLock = newAttempts >= MAX_FAILED;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
    await db.update(adminsTable).set({ failedLoginAttempts: newAttempts, lockedUntil }).where(eq(adminsTable.id, admin.id));
    await recordLoginHistory(admin.id, username, false, ip, ua, "Wrong password");
    const remaining = MAX_FAILED - newAttempts;
    res.status(401).json({
      error: shouldLock
        ? `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
        : `Invalid username or password.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before lockout.` : ""}`,
    });
    return;
  }

  await db.update(adminsTable).set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(adminsTable.id, admin.id));
  await recordLoginHistory(admin.id, username, true, ip, ua);

  const sessionData = { id: admin.id, username: admin.username, name: admin.name, role: admin.role };
  const token = await createSession(sessionData, ip, ua);

  const body = AdminLoginResponse.parse({ success: true, admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } });
  res.json({ ...body, token, mustChangePassword: admin.mustChangePassword });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) await deleteSession(auth.slice(7));
  res.json({ success: true });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  const session = (req as Request & { adminSession?: SessionData }).adminSession ?? getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }
  res.json(GetAdminMeResponse.parse(session));
});

router.post("/admin/change-password", async (req, res): Promise<void> => {
  const session = (req as Request & { adminSession?: SessionData }).adminSession ?? getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, session.id));
  if (!admin) { res.status(404).json({ error: "Account not found" }); return; }

  const currentValid = await bcrypt.compare(parsed.data.currentPassword, admin.password);
  if (!currentValid) { res.status(400).json({ error: "Current password is incorrect" }); return; }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(adminsTable).set({ password: hashed, mustChangePassword: false }).where(eq(adminsTable.id, session.id));
  res.json({ success: true });
});

export default router;
