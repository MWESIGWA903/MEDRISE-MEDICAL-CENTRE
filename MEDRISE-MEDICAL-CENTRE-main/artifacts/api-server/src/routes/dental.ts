import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, dentalRecordsTable, dentalProceduresTable, patientsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

async function enrichDentalRecord(r: typeof dentalRecordsTable.$inferSelect) {
  const p = await db.select({ fullName: patientsTable.fullName, phone: patientsTable.phone, age: patientsTable.age })
    .from(patientsTable).where(eq(patientsTable.id, r.patientId)).then(x => x[0]);
  const procs = await db.select({ id: dentalProceduresTable.id })
    .from(dentalProceduresTable).where(eq(dentalProceduresTable.dentalRecordId, r.id)).then(x => x.length);
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    patientName: p?.fullName ?? "Unknown",
    patientPhone: p?.phone ?? null,
    patientAge: p?.age ?? null,
    procedureCount: procs,
  };
}

// Stats
router.get("/dental/stats", async (_req, res): Promise<void> => {
  const records = await db.select().from(dentalRecordsTable);
  const procs = await db.select().from(dentalProceduresTable);
  const unique = new Set(records.map(r => r.patientId));
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    totalPatients: unique.size,
    totalVisits: records.length,
    visitToday: records.filter(r => r.visitDate === today).length,
    totalProcedures: procs.length,
    xraysTaken: records.filter(r => r.xrayTaken).length,
    extractionCount: procs.filter(p => p.procedureName.toLowerCase().includes("extract")).length,
    fillingCount: procs.filter(p => p.procedureName.toLowerCase().includes("fill") || p.procedureName.toLowerCase().includes("restoration")).length,
  });
});

// Dental Records
router.get("/dental/records", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  let rows = await db.select().from(dentalRecordsTable).orderBy(desc(dentalRecordsTable.visitDate));
  if (patientId) rows = rows.filter(r => r.patientId === patientId);
  res.json(await Promise.all(rows.map(enrichDentalRecord)));
});

const DentalRecordSchema = z.object({
  patientId: z.number().int(),
  visitDate: z.string(),
  chiefComplaint: z.string().optional(),
  examinationNotes: z.string().optional(),
  oralHygiene: z.string().optional(),
  extraoralFindings: z.string().optional(),
  softTissueFindings: z.string().optional(),
  periodontalStatus: z.string().optional(),
  xrayTaken: z.boolean().optional(),
  xrayFindings: z.string().optional(),
  toothChart: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  dentistName: z.string().optional(),
});

router.post("/dental/records", async (req, res): Promise<void> => {
  const parsed = DentalRecordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(dentalRecordsTable).values(parsed.data).returning();
  logAudit(req, "create_dental_record", { entityType: "dental_record", entityId: row.id, details: `Patient ${parsed.data.patientId}` }).catch(() => {});
  res.status(201).json(await enrichDentalRecord(row));
});

router.patch("/dental/records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = DentalRecordSchema.partial().omit({ patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(dentalRecordsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(dentalRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichDentalRecord(row));
});

router.delete("/dental/records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(dentalProceduresTable).where(eq(dentalProceduresTable.dentalRecordId, id));
  const [row] = await db.delete(dentalRecordsTable).where(eq(dentalRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Dental Procedures
router.get("/dental/procedures", async (req, res): Promise<void> => {
  const recordId = req.query.dentalRecordId ? parseInt(String(req.query.dentalRecordId), 10) : undefined;
  let rows = await db.select().from(dentalProceduresTable).orderBy(desc(dentalProceduresTable.procedureDate));
  if (recordId) rows = rows.filter(r => r.dentalRecordId === recordId);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

const ProcedureSchema = z.object({
  dentalRecordId: z.number().int(),
  patientId: z.number().int(),
  procedureDate: z.string(),
  toothNumbers: z.string().optional(),
  procedureName: z.string(),
  procedureCode: z.string().optional(),
  surface: z.string().optional(),
  materialUsed: z.string().optional(),
  anaesthesiaGiven: z.boolean().optional(),
  anaesthesiaType: z.string().optional(),
  findings: z.string().optional(),
  complications: z.string().optional(),
  nextAppointment: z.string().optional(),
  notes: z.string().optional(),
  performedByName: z.string().optional(),
});

router.post("/dental/procedures", async (req, res): Promise<void> => {
  const parsed = ProcedureSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(dentalProceduresTable).values(parsed.data).returning();
  logAudit(req, "create_dental_procedure", { entityType: "dental_procedure", entityId: row.id, details: `${parsed.data.procedureName} — teeth ${parsed.data.toothNumbers ?? "N/A"}` }).catch(() => {});
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/dental/procedures/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = ProcedureSchema.partial().omit({ dentalRecordId: true, patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(dentalProceduresTable).set(parsed.data).where(eq(dentalProceduresTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/dental/procedures/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(dentalProceduresTable).where(eq(dentalProceduresTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
