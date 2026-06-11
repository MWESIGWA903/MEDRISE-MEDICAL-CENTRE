import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, loginHistoryTable } from "@workspace/db";
import { getSessionFromRequest } from "../lib/session";

const router: IRouter = Router();

router.get("/admin/login-history", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }

  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
  const rows = await db
    .select()
    .from(loginHistoryTable)
    .where(eq(loginHistoryTable.adminId, session.id))
    .orderBy(desc(loginHistoryTable.createdAt))
    .limit(limit);

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
