import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, notificationsTable, notificationDismissalsTable } from "@workspace/db";
import { getSessionFromRequest } from "../lib/session";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const notifications = await db
    .select()
    .from(notificationsTable)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);

  if (notifications.length === 0) {
    res.json([]);
    return;
  }

  const dismissals = await db
    .select({ notificationId: notificationDismissalsTable.notificationId })
    .from(notificationDismissalsTable)
    .where(eq(notificationDismissalsTable.adminId, session.id));

  const dismissedIds = new Set(dismissals.map((d) => d.notificationId));

  const result = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    dismissed: dismissedIds.has(n.id),
  }));

  res.json(result);
});

router.post("/notifications/:id/dismiss", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [notification] = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.id, id));

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  const existing = await db
    .select()
    .from(notificationDismissalsTable)
    .where(
      and(
        eq(notificationDismissalsTable.notificationId, id),
        eq(notificationDismissalsTable.adminId, session.id),
      ),
    );

  if (existing.length === 0) {
    await db.insert(notificationDismissalsTable).values({
      notificationId: id,
      adminId: session.id,
    });
  }

  res.json({ ok: true });
});

export default router;
