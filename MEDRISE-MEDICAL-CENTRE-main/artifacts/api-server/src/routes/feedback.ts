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
  const parsed = FeedbackInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

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

  sendFeedbackNotificationToClinic({
    patientName: row.patientName,
    phone: row.phone,
    service: row.service,
    rating: row.rating,
    comment: row.comment,
    wouldRecommend: row.wouldRecommend,
    submittedAt: row.createdAt.toLocaleString("en-UG", { dateStyle: "full", timeStyle: "short" }),
  });

  const stars = "★".repeat(row.rating) + "☆".repeat(5 - row.rating);
  void createAndBroadcast({
    type: "feedback",
    title: "New Patient Feedback",
    body: `${row.patientName} left a ${row.rating}-star review${row.service ? ` for ${row.service}` : ""}. ${stars}`,
    severity: row.rating >= 4 ? "info" : row.rating === 3 ? "warning" : "warning",
    relatedId: row.id,
  });

  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
