import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, triageTable } from "@workspace/db";
import { z } from "zod";
import { getSessionFromRequest } from "../lib/session";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const TriageInputSchema = z.object({
  patientId: z.number().int().positive(),
  assignedNurseId: z.number().int().positive().optional(),
  assignedNurseName: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulseRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  painScale: z.number().int().min(0).max(10).optional(),
  chiefComplaint: z.string().min(1),
  nursingAssessment: z.string().optional(),
  interventionsPerformed: z.string().optional(),
  reassessmentNotes: z.string().optional(),
  priority: z.enum(["normal", "non-urgent", "urgent", "emergency", "deceased"]).default("normal"),
  status: z.enum(["active", "completed", "referred"]).default("active"),
  isEmergency: z.boolean().default(false),
  triageTime: z.string().optional(),
});

const TriageUpdateSchema = TriageInputSchema.partial().omit({ patientId: true });

router.get("/triage", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  if (!patientId || isNaN(patientId)) {
    res.status(400).json({ error: "patientId query parameter is required" });
    return;
  }
  const rows = await db
    .select()
    .from(triageTable)
    .where(eq(triageTable.patientId, patientId))
    .orderBy(desc(triageTable.triageTime))
    .limit(5);

  res.json(rows.map(r => ({
    ...r,
    triageTime: r.triageTime.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.post("/triage", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = TriageInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const { triageTime, ...rest } = parsed.data;
    const [record] = await db
      .insert(triageTable)
      .values({
        ...rest,
        assignedNurseId: rest.assignedNurseId ?? session.id,
        assignedNurseName: rest.assignedNurseName ?? session.name,
        triageTime: triageTime ? new Date(triageTime) : new Date(),
      })
      .returning();

    await logAudit(req, "record_triage", {
      entityType: "triage",
      entityId: record.id,
      details: `Triage recorded for patient ID ${parsed.data.patientId} — ${parsed.data.priority} priority`,
    });

    res.status(201).json({
      ...record,
      triageTime: record.triageTime.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record triage" });
  }
});

router.patch("/triage/:id", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = TriageUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.triageTime) {
      updates.triageTime = new Date(parsed.data.triageTime as string);
      delete updates.triageTime;
    }

    const [updated] = await db
      .update(triageTable)
      .set(updates)
      .where(eq(triageTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Triage record not found" }); return; }

    await logAudit(req, "update_triage", { entityType: "triage", entityId: id });

    res.json({
      ...updated,
      triageTime: updated.triageTime.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update triage" });
  }
});

export default router;
