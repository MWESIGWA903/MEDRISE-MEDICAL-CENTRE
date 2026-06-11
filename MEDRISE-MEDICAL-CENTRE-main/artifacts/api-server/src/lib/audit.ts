import { db, auditLogsTable } from "@workspace/db";
import { getSessionFromRequest } from "./session";
import type { Request } from "express";

export async function logAudit(
  req: Request,
  action: string,
  opts?: {
    entityType?: string;
    entityId?: number;
    details?: string;
    previousValue?: string;
    newValue?: string;
  }
) {
  const session = getSessionFromRequest(req);
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.ip ??
    null;

  await db.insert(auditLogsTable).values({
    actorId: session?.id ?? null,
    actorName: session?.name ?? null,
    actorRole: session?.role ?? null,
    action,
    entityType: opts?.entityType ?? null,
    entityId: opts?.entityId ?? null,
    details: opts?.details ?? null,
    previousValue: opts?.previousValue ?? null,
    newValue: opts?.newValue ?? null,
    ipAddress: ip,
  });
}
