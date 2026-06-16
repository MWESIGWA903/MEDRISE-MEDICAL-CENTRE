import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, patientFeedbackTable } from "@workspace/db";
import { z } from "zod";
import { sendFeedbackNotificationToClinic } from "../lib/email";
import { createAndBroadcast } from "../lib/notificationHelper";

const router: IRouter = Router();

const FeedbackInputSchema = z.object({
  patientName: z.string().min(1),
  phone: z.string().optional(),
  service: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  wouldRecommend: z.enum(["yes", "no", "maybe"]).optional(),
});

router.get("/feedback", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(patientFeedbackTable)
    .orderBy(desc(patientFeedbackTable.createdAt));

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/feedback", async (req, res): Promise<void> => {
  const startTime = Date.now();
  const parsed = FeedbackInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dbStartTime = Date.now();
  const [row] = await db
    .insert(patientFeedbackTable)
    .values({
      patientName: parsed.data.patientName,
      phone: parsed.data.phone ?? null,
      service: parsed.data.service ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      wouldRecommend: parsed.data.wouldRecommend ?? null,
    })
    .returning();
  const dbEndTime = Date.now();
  console.log(`Feedback database save completed in ${dbEndTime - dbStartTime}ms`);

  // Fire-and-forget email sending - do not await
  void sendFeedbackNotificationToClinic({
    patientName: row.patientName,
    phone: row.phone,
    service: row.service,
    rating: row.rating,
    comment: row.comment,
    wouldRecommend: row.wouldRecommend,
    submittedAt: row.createdAt.toLocaleString("en-UG", { dateStyle: "full", timeStyle: "short" }),
  }).catch((err) => {
    console.error("Failed to send feedback notification:", err);
  });

  const stars = "★".repeat(row.rating) + "☆".repeat(5 - row.rating);
  void createAndBroadcast({
    type: "feedback",
    title: "New Patient Feedback",
    body: `${row.patientName} left a ${row.rating}-star review${row.service ? ` for ${row.service}` : ""}. ${stars}`,
    severity: row.rating >= 4 ? "info" : row.rating === 3 ? "warning" : "warning",
    relatedId: row.id,
  });

  const responseTime = Date.now() - startTime;
  console.log(`Feedback HTTP response returned in ${responseTime}ms`);
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
