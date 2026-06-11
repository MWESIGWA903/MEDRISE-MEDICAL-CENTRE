import { db, notificationsTable } from "@workspace/db";
import { broadcast } from "./ws";
import { logger } from "./logger";

interface CreateNotificationInput {
  type: string;
  title: string;
  body: string;
  severity?: string;
  relatedId?: number | null;
}

export async function createAndBroadcast(input: CreateNotificationInput): Promise<void> {
  try {
    const [row] = await db
      .insert(notificationsTable)
      .values({
        type: input.type,
        title: input.title,
        body: input.body,
        severity: input.severity ?? "info",
        relatedId: input.relatedId ?? null,
      })
      .returning();

    broadcast({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      severity: row.severity,
      relatedId: row.relatedId,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    logger.warn({ err }, "Failed to create/broadcast notification");
  }
}
