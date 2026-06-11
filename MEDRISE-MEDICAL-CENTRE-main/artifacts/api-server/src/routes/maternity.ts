import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  maternityRecordsTable,
  ancVisitsTable,
  deliveryRecordsTable,
  partographEntriesTable,
  patientsTable,
  adminsTable,
} from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getToken(req: import("express").Request): Promise<number | null> {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const { sessionsTable } = await import("@workspace/db");
  const [session] = await db.select({ adminId: sessionsTable.adminId })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token));
  return session?.adminId ?? null;
}

async function enrichRecord(r: typeof maternityRecordsTable.$inferSelect) {
  const patient = await db.select({ fullName: patientsTable.fullName, phone: patientsTable.phone, gender: patientsTable.gender, dateOfBirth: patientsTable.dateOfBirth, age: patientsTable.age })
    .from(patientsTable).where(eq(patientsTable.id, r.patientId)).then(x => x[0]);
  const visitCount = await db.select({ id: ancVisitsTable.id })
    .from(ancVisitsTable).where(eq(ancVisitsTable.maternityRecordId, r.id)).then(x => x.length);
  const delivery = await db.select().from(deliveryRecordsTable)
    .where(eq(deliveryRecordsTable.maternityRecordId, r.id)).then(x => x[0] ?? null);
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    patientName: patient?.fullName ?? "Unknown",
    patientPhone: patient?.phone ?? null,
    patientGender: patient?.gender ?? null,
    patientDob: patient?.dateOfBirth ?? null,
    patientAge: patient?.age ?? null,
    visitCount,
    delivered: !!delivery,
    deliveryDate: delivery?.deliveryDate ?? null,
  };
}

// ── Maternity Records ──────────────────────────────────────────────────────────

router.get("/maternity/records", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  let rows = await db.select().from(maternityRecordsTable).orderBy(desc(maternityRecordsTable.createdAt));
  if (patientId) rows = rows.filter(r => r.patientId === patientId);
  if (status) rows = rows.filter(r => r.status === status);

  const enriched = await Promise.all(rows.map(enrichRecord));
  res.json(enriched);
});

router.get("/maternity/records/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(maternityRecordsTable);
  const deliveries = await db.select().from(deliveryRecordsTable);
  res.json({
    total: all.length,
    active: all.filter(r => r.status === "active").length,
    highRisk: all.filter(r => r.isHighRisk).length,
    delivered: all.filter(r => r.status === "delivered").length,
    totalDeliveries: deliveries.length,
    svd: deliveries.filter(d => d.deliveryMode === "SVD").length,
    cs: deliveries.filter(d => d.deliveryMode === "CS").length,
  });
});

router.get("/maternity/records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.select().from(maternityRecordsTable).where(eq(maternityRecordsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichRecord(row));
});

const MaternityRecordSchema = z.object({
  patientId: z.number().int(),
  gravida: z.number().int().min(0).optional(),
  para: z.number().int().min(0).optional(),
  lmp: z.string().optional(),
  edd: z.string().optional(),
  gestationalAgeAtBooking: z.number().int().optional(),
  ageAtBooking: z.number().int().optional(),
  bookingWeight: z.string().optional(),
  bookingBp: z.string().optional(),
  bloodGroup: z.string().optional(),
  rhesus: z.string().optional(),
  hivStatus: z.string().optional(),
  tbStatus: z.string().optional(),
  syphilisStatus: z.string().optional(),
  hepatitisBStatus: z.string().optional(),
  riskFactors: z.string().optional(),
  isHighRisk: z.boolean().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  attendedByName: z.string().optional(),
});

router.post("/maternity/records", async (req, res): Promise<void> => {
  const parsed = MaternityRecordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const adminId = await getToken(req);
  const [row] = await db.insert(maternityRecordsTable).values({
    ...parsed.data,
    attendedBy: adminId ?? undefined,
    attendedByName: parsed.data.attendedByName ?? null,
  }).returning();
  logAudit(req, "create_maternity_record", { entityType: "maternity_record", entityId: row.id, details: `Patient ID ${row.patientId}` }).catch(() => {});
  res.status(201).json(await enrichRecord(row));
});

router.patch("/maternity/records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = MaternityRecordSchema.partial().omit({ patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(maternityRecordsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(maternityRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "update_maternity_record", { entityType: "maternity_record", entityId: id, details: JSON.stringify(parsed.data) }).catch(() => {});
  res.json(await enrichRecord(row));
});

router.delete("/maternity/records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(partographEntriesTable).where(eq(partographEntriesTable.maternityRecordId, id));
  await db.delete(ancVisitsTable).where(eq(ancVisitsTable.maternityRecordId, id));
  await db.delete(deliveryRecordsTable).where(eq(deliveryRecordsTable.maternityRecordId, id));
  const [row] = await db.delete(maternityRecordsTable).where(eq(maternityRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// ── ANC Visits ─────────────────────────────────────────────────────────────────

router.get("/maternity/anc-visits", async (req, res): Promise<void> => {
  const recordId = req.query.maternityRecordId ? parseInt(String(req.query.maternityRecordId), 10) : undefined;
  let rows = await db.select().from(ancVisitsTable).orderBy(ancVisitsTable.visitNumber);
  if (recordId) rows = rows.filter(r => r.maternityRecordId === recordId);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

const AncVisitSchema = z.object({
  maternityRecordId: z.number().int(),
  patientId: z.number().int(),
  visitDate: z.string(),
  gestationalAge: z.number().int().optional(),
  weight: z.string().optional(),
  bloodPressure: z.string().optional(),
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  fundalHeight: z.string().optional(),
  presentation: z.string().optional(),
  fetalHeartRate: z.string().optional(),
  fetalMovement: z.string().optional(),
  edema: z.string().optional(),
  urineProtein: z.string().optional(),
  urineSugar: z.string().optional(),
  dangerSigns: z.string().optional(),
  ironFolicGiven: z.boolean().optional(),
  iptp: z.boolean().optional(),
  tetanusVaccine: z.string().optional(),
  malariaTest: z.string().optional(),
  malariaResult: z.string().optional(),
  hivTestDone: z.boolean().optional(),
  hivResult: z.string().optional(),
  ctxGiven: z.boolean().optional(),
  arvs: z.string().optional(),
  birthPlan: z.string().optional(),
  referralIndication: z.string().optional(),
  nextVisitDate: z.string().optional(),
  clinicalNotes: z.string().optional(),
  attendedByName: z.string().optional(),
});

router.post("/maternity/anc-visits", async (req, res): Promise<void> => {
  const parsed = AncVisitSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const existing = await db.select({ id: ancVisitsTable.id })
    .from(ancVisitsTable)
    .where(eq(ancVisitsTable.maternityRecordId, parsed.data.maternityRecordId));
  const visitNumber = existing.length + 1;

  const adminId = await getToken(req);
  const adminName = parsed.data.attendedByName ?? (adminId
    ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, adminId)).then(r => r[0]?.name ?? null)
    : null);

  const [row] = await db.insert(ancVisitsTable).values({
    ...parsed.data,
    visitNumber,
    attendedBy: adminId ?? undefined,
    attendedByName: adminName,
  }).returning();

  logAudit(req, "create_anc_visit", { entityType: "anc_visit", entityId: row.id, details: `Visit #${visitNumber} for maternity record ${parsed.data.maternityRecordId}` }).catch(() => {});
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/maternity/anc-visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = AncVisitSchema.partial().omit({ maternityRecordId: true, patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(ancVisitsTable).set(parsed.data).where(eq(ancVisitsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/maternity/anc-visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(ancVisitsTable).where(eq(ancVisitsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// ── Delivery Records ───────────────────────────────────────────────────────────

router.get("/maternity/deliveries", async (req, res): Promise<void> => {
  const recordId = req.query.maternityRecordId ? parseInt(String(req.query.maternityRecordId), 10) : undefined;
  let rows = await db.select().from(deliveryRecordsTable).orderBy(desc(deliveryRecordsTable.createdAt));
  if (recordId) rows = rows.filter(r => r.maternityRecordId === recordId);

  const enriched = await Promise.all(rows.map(async r => {
    const patient = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, r.patientId)).then(x => x[0]);
    return { ...r, patientName: patient?.fullName ?? "Unknown", createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  }));
  res.json(enriched);
});

const DeliverySchema = z.object({
  maternityRecordId: z.number().int(),
  patientId: z.number().int(),
  deliveryDate: z.string(),
  deliveryTime: z.string().optional(),
  gestationalAge: z.number().int().optional(),
  deliveryMode: z.string().optional(),
  deliveryWard: z.string().optional(),
  babySex: z.string().optional(),
  birthWeight: z.string().optional(),
  apgar1: z.number().int().min(0).max(10).optional(),
  apgar5: z.number().int().min(0).max(10).optional(),
  apgar10: z.number().int().min(0).max(10).optional(),
  neonatalOutcome: z.string().optional(),
  neonatalResuscitation: z.boolean().optional(),
  thirdStageManagement: z.string().optional(),
  placentaComplete: z.string().optional(),
  bloodLoss: z.string().optional(),
  perinealTears: z.string().optional(),
  maternalOutcome: z.string().optional(),
  complications: z.string().optional(),
  breastfeedingInitiated: z.string().optional(),
  vitaminKGiven: z.boolean().optional(),
  eyeProphylaxis: z.boolean().optional(),
  attendantName: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/maternity/deliveries", async (req, res): Promise<void> => {
  const parsed = DeliverySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const adminId = await getToken(req);
  const [row] = await db.insert(deliveryRecordsTable).values({
    ...parsed.data,
    attendantId: adminId ?? undefined,
  }).returning();
  await db.update(maternityRecordsTable).set({ status: "delivered", updatedAt: new Date() }).where(eq(maternityRecordsTable.id, parsed.data.maternityRecordId));
  logAudit(req, "create_delivery_record", { entityType: "delivery_record", entityId: row.id, details: `Delivery for maternity record ${parsed.data.maternityRecordId}` }).catch(() => {});
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.patch("/maternity/deliveries/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = DeliverySchema.partial().omit({ maternityRecordId: true, patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(deliveryRecordsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(deliveryRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

// ── Partograph ─────────────────────────────────────────────────────────────────

router.get("/maternity/partograph", async (req, res): Promise<void> => {
  const recordId = req.query.maternityRecordId ? parseInt(String(req.query.maternityRecordId), 10) : undefined;
  let rows = await db.select().from(partographEntriesTable).orderBy(partographEntriesTable.entryDate, partographEntriesTable.entryTime);
  if (recordId) rows = rows.filter(r => r.maternityRecordId === recordId);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

const PartographSchema = z.object({
  maternityRecordId: z.number().int(),
  patientId: z.number().int(),
  entryDate: z.string(),
  entryTime: z.string(),
  fetalHeartRate: z.number().int().optional(),
  liquor: z.string().optional(),
  moulding: z.string().optional(),
  cervicalDilation: z.number().int().min(0).max(10).optional(),
  descent: z.number().int().min(0).max(5).optional(),
  contractions: z.number().int().optional(),
  contractionDuration: z.number().int().optional(),
  contractionStrength: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulse: z.number().int().optional(),
  temperature: z.string().optional(),
  urineOutput: z.string().optional(),
  urineProtein: z.string().optional(),
  urineAcetone: z.string().optional(),
  oxytocin: z.string().optional(),
  drugsGiven: z.string().optional(),
  notes: z.string().optional(),
  recordedByName: z.string().optional(),
});

router.post("/maternity/partograph", async (req, res): Promise<void> => {
  const parsed = PartographSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const adminId = await getToken(req);
  const adminName = parsed.data.recordedByName ?? (adminId
    ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, adminId)).then(r => r[0]?.name ?? null)
    : null);
  const [row] = await db.insert(partographEntriesTable).values({
    ...parsed.data,
    recordedBy: adminId ?? undefined,
    recordedByName: adminName,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/maternity/partograph/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = PartographSchema.partial().omit({ maternityRecordId: true, patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(partographEntriesTable).set(parsed.data).where(eq(partographEntriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/maternity/partograph/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(partographEntriesTable).where(eq(partographEntriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
