import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, adminsTable, passwordResetTokensTable } from "@workspace/db";
import { deleteAllSessionsForAdmin } from "../lib/session";

const router: IRouter = Router();

router.post("/admin/password-reset/request", async (req, res): Promise<void> => {
  const { username, email } = req.body as { username?: string; email?: string };
  if (!username && !email) { res.status(400).json({ error: "Provide username or email" }); return; }

  const [admin] = await db.select().from(adminsTable).where(
    username ? eq(adminsTable.username, username) : eq(adminsTable.email, email!),
  );

  if (!admin || !admin.isActive) {
    res.json({ success: true, message: "If the account exists, a reset code has been issued." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({ adminId: admin.id, token, expiresAt });

  res.json({ success: true, message: "Reset token issued.", debug_token: process.env.NODE_ENV !== "production" ? token : undefined });
});

router.post("/admin/password-reset/confirm", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "Valid token and new password (min 8 chars) required" });
    return;
  }

  const now = new Date();
  const [resetRow] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(and(eq(passwordResetTokensTable.token, token), gt(passwordResetTokensTable.expiresAt, now)));

  if (!resetRow || resetRow.usedAt) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.update(adminsTable).set({ password: hashed, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null }).where(eq(adminsTable.id, resetRow.adminId));
  await db.update(passwordResetTokensTable).set({ usedAt: now }).where(eq(passwordResetTokensTable.id, resetRow.id));
  await deleteAllSessionsForAdmin(resetRow.adminId);

  res.json({ success: true, message: "Password reset successfully. Please log in." });
});

export default router;
