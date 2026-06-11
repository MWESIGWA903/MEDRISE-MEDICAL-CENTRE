import crypto from "crypto";
import { eq, lt } from "drizzle-orm";
import { db, sessionsTable, adminsTable } from "@workspace/db";

export interface SessionData {
  id: number;
  username: string;
  name: string;
  role: string | null;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const cache: Map<string, SessionData> = new Map();

export function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export async function createSession(
  admin: SessionData,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionsTable).values({ token, adminId: admin.id, ipAddress: ipAddress ?? null, userAgent: userAgent ?? null, expiresAt });
  cache.set(token, admin);
  return token;
}

export async function resolveSession(token: string): Promise<SessionData | null> {
  if (cache.has(token)) return cache.get(token)!;
  const [row] = await db
    .select({ token: sessionsTable.token, expiresAt: sessionsTable.expiresAt, id: adminsTable.id, username: adminsTable.username, name: adminsTable.name, role: adminsTable.role })
    .from(sessionsTable)
    .innerJoin(adminsTable, eq(sessionsTable.adminId, adminsTable.id))
    .where(eq(sessionsTable.token, token));
  if (!row) return null;
  if (row.expiresAt < new Date()) { await db.delete(sessionsTable).where(eq(sessionsTable.token, token)); return null; }
  const data: SessionData = { id: row.id, username: row.username, name: row.name, role: row.role };
  cache.set(token, data);
  return data;
}

export async function deleteSession(token: string): Promise<void> {
  cache.delete(token);
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
}

export async function deleteAllSessionsForAdmin(adminId: number): Promise<void> {
  const rows = await db.select({ token: sessionsTable.token }).from(sessionsTable).where(eq(sessionsTable.adminId, adminId));
  for (const r of rows) cache.delete(r.token);
  await db.delete(sessionsTable).where(eq(sessionsTable.adminId, adminId));
}

export async function pruneExpiredSessions(): Promise<void> {
  await db.delete(sessionsTable).where(lt(sessionsTable.expiresAt, new Date()));
}

export async function loadSessionsFromDb(): Promise<void> {
  const rows = await db
    .select({ token: sessionsTable.token, expiresAt: sessionsTable.expiresAt, id: adminsTable.id, username: adminsTable.username, name: adminsTable.name, role: adminsTable.role })
    .from(sessionsTable)
    .innerJoin(adminsTable, eq(sessionsTable.adminId, adminsTable.id));
  const now = new Date();
  for (const row of rows) {
    if (row.expiresAt > now) cache.set(row.token, { id: row.id, username: row.username, name: row.name, role: row.role });
  }
}

export function getSessionFromRequest(req: { headers: { authorization?: string }; adminSession?: SessionData }): SessionData | null {
  if (req.adminSession) return req.adminSession;
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return cache.get(auth.slice(7)) ?? null;
}

export async function getSessionFromRequestAsync(req: { headers: { authorization?: string }; adminSession?: SessionData }): Promise<SessionData | null> {
  if (req.adminSession) return req.adminSession;
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return resolveSession(auth.slice(7));
}
