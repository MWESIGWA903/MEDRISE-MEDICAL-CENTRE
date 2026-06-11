import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, growthRecordsTable, immunizationRecordsTable, patientsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

async function getPatientName(patientId: number): Promise<string> {
  const [p] = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, patientId));
  return p?.fullName ?? "Unknown";
}

// Stats
router.get("/paediatrics/stats", async (_req, res): Promise<void> => {
  const growth = await db.select().from(growthRecordsTable);
  const imm = await db.select().from(immunizationRecordsTable);
  const malnutrition = growth.filter(g => g.nutritionalStatus === "SAM" || g.nutritionalStatus === "MAM");
  const uniquePatients = new Set([...growth.map(g => g.patientId), ...imm.map(i => i.patientId)]);
  res.json({
    totalPatients: uniquePatients.size,
    totalGrowthRecords: growth.length,
    totalVaccinations: imm.length,
    malnourished: malnutrition.length,
    sam: growth.filter(g => g.nutritionalStatus === "SAM").length,
    mam: growth.filter(g => g.nutritionalStatus === "MAM").length,
  });
});

// Growth Records
router.get("/paediatrics/growth", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  let rows = await db.select().from(growthRecordsTable).orderBy(growthRecordsTable.date);
  if (patientId) rows = rows.filter(r => r.patientId === patientId);
  const enriched = await Promise.all(rows.map(async r => ({
    ...r,
    patientName: await getPatientName(r.patientId),
    createdAt: r.createdAt.toISOString(),
  })));
  res.json(enriched);
});

const GrowthSchema = z.object({
  patientId: z.number().int(),
  date: z.string(),
  ageMonths: z.number().int().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  muac: z.string().optional(),
  headCircumference: z.string().optional(),
  weightForAgeZ: z.string().optional(),
  heightForAgeZ: z.string().optional(),
  bmi: z.string().optional(),
  nutritionalStatus: z.string().optional(),
  oedema: z.string().optional(),
  feedingAssessment: z.string().optional(),
  notes: z.string().optional(),
  recordedByName: z.string().optional(),
});

router.post("/paediatrics/growth", async (req, res): Promise<void> => {
  const parsed = GrowthSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(growthRecordsTable).values({
    ...parsed.data,
    recordedByName: parsed.data.recordedByName ?? null,
  }).returning();
  logAudit(req, "record_growth", { entityType: "growth_record", entityId: row.id, details: `Patient ${parsed.data.patientId} — ${parsed.data.date}` }).catch(() => {});
  res.status(201).json({ ...row, patientName: await getPatientName(row.patientId), createdAt: row.createdAt.toISOString() });
});

router.patch("/paediatrics/growth/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = GrowthSchema.partial().omit({ patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(growthRecordsTable).set(parsed.data).where(eq(growthRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/paediatrics/growth/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(growthRecordsTable).where(eq(growthRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Immunization Records
router.get("/paediatrics/immunizations", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  let rows = await db.select().from(immunizationRecordsTable).orderBy(immunizationRecordsTable.dateGiven);
  if (patientId) rows = rows.filter(r => r.patientId === patientId);
  const enriched = await Promise.all(rows.map(async r => ({
    ...r,
    patientName: await getPatientName(r.patientId),
    createdAt: r.createdAt.toISOString(),
  })));
  res.json(enriched);
});

const ImmunizationSchema = z.object({
  patientId: z.number().int(),
  vaccine: z.string(),
  doseNumber: z.number().int().optional(),
  dateGiven: z.string(),
  batchNumber: z.string().optional(),
  site: z.string().optional(),
  route: z.string().optional(),
  nextDueDate: z.string().optional(),
  nextDueVaccine: z.string().optional(),
  adverseReaction: z.string().optional(),
  administeredByName: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/paediatrics/immunizations", async (req, res): Promise<void> => {
  const parsed = ImmunizationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(immunizationRecordsTable).values(parsed.data).returning();
  logAudit(req, "record_immunization", { entityType: "immunization", entityId: row.id, details: `${parsed.data.vaccine} — Patient ${parsed.data.patientId}` }).catch(() => {});
  res.status(201).json({ ...row, patientName: await getPatientName(row.patientId), createdAt: row.createdAt.toISOString() });
});

router.patch("/paediatrics/immunizations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = ImmunizationSchema.partial().omit({ patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(immunizationRecordsTable).set(parsed.data).where(eq(immunizationRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/paediatrics/immunizations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(immunizationRecordsTable).where(eq(immunizationRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
