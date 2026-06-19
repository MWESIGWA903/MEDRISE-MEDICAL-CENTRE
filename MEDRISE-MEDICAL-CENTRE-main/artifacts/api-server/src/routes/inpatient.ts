import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db, wardRoundNotesTable, inpatientDrugChartTable, nursingNotesTable,
  admissionsTable, patientsTable,
} from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

async function getAdmissionContext(admissionId: number) {
  const [adm] = await db.select({
    id: admissionsTable.id,
    patientId: admissionsTable.patientId,
    ward: admissionsTable.ward,
    bedNumber: admissionsTable.bedNumber,
    diagnosis: admissionsTable.diagnosis,
    admissionType: admissionsTable.admissionType,
    status: admissionsTable.status,
    createdAt: admissionsTable.createdAt,
  }).from(admissionsTable).where(eq(admissionsTable.id, admissionId));

  if (!adm) return null;
  const [patient] = await db.select({
    fullName: patientsTable.fullName, age: patientsTable.age,
    gender: patientsTable.gender, phone: patientsTable.phone,
    bloodType: patientsTable.bloodType, allergies: patientsTable.allergies,
  }).from(patientsTable).where(eq(patientsTable.id, adm.patientId));

  return { ...adm, patient: patient ?? null };
}

router.get("/inpatient/summary/:admissionId", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.admissionId, 10);
    const ctx = await getAdmissionContext(id);
    if (!ctx) { res.status(404).json({ error: "Admission not found" }); return; }

    const [rounds, drugs, nurseNotes] = await Promise.all([
      db.select().from(wardRoundNotesTable).where(eq(wardRoundNotesTable.admissionId, id)).orderBy(desc(wardRoundNotesTable.roundDate)),
      db.select().from(inpatientDrugChartTable).where(eq(inpatientDrugChartTable.admissionId, id)).orderBy(inpatientDrugChartTable.startDate),
      db.select().from(nursingNotesTable).where(eq(nursingNotesTable.admissionId, id)).orderBy(desc(nursingNotesTable.noteDate), desc(nursingNotesTable.noteTime)),
    ]);

    res.json({
      admission: { ...ctx, createdAt: ctx.createdAt.toISOString() },
      wardRounds: rounds.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
      drugChart: drugs.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })),
      nursingNotes: nurseNotes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
    });
  } catch (err) {
    console.error("GET /inpatient/summary/:id error:", err);
    res.status(500).json({ error: "Failed to fetch inpatient summary", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/inpatient/ward-rounds", async (req, res): Promise<void> => {
  try {
    const admissionId = req.query.admissionId ? parseInt(String(req.query.admissionId), 10) : undefined;
    let rows = await db.select().from(wardRoundNotesTable).orderBy(desc(wardRoundNotesTable.roundDate));
    if (admissionId) rows = rows.filter(r => r.admissionId === admissionId);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (err) {
    console.error("GET /inpatient/ward-rounds error:", err);
    res.status(500).json({ error: "Failed to fetch ward rounds", detail: err instanceof Error ? err.message : String(err) });
  }
});

const WardRoundSchema = z.object({
  admissionId: z.number().int(),
  patientId: z.number().int(),
  roundDate: z.string(),
  roundTime: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulse: z.string().optional(),
  temperature: z.string().optional(),
  respiratoryRate: z.string().optional(),
  spo2: z.string().optional(),
  bloodGlucose: z.string().optional(),
  weight: z.string().optional(),
  writtenByName: z.string().optional(),
  writtenByRole: z.string().optional(),
});

router.post("/inpatient/ward-rounds", async (req, res): Promise<void> => {
  try {
    const parsed = WardRoundSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.insert(wardRoundNotesTable).values(parsed.data).returning();
    logAudit(req, "ward_round_note", { entityType: "ward_round", entityId: row.id }).catch(() => {});
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    console.error("POST /inpatient/ward-rounds error:", err);
    res.status(500).json({ error: "Failed to save ward round note", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.patch("/inpatient/ward-rounds/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = WardRoundSchema.partial().omit({ admissionId: true, patientId: true }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.update(wardRoundNotesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(wardRoundNotesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    console.error("PATCH /inpatient/ward-rounds/:id error:", err);
    res.status(500).json({ error: "Failed to update ward round note", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/inpatient/ward-rounds/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(wardRoundNotesTable).where(eq(wardRoundNotesTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /inpatient/ward-rounds/:id error:", err);
    res.status(500).json({ error: "Failed to delete ward round note", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/inpatient/drug-chart", async (req, res): Promise<void> => {
  try {
    const admissionId = req.query.admissionId ? parseInt(String(req.query.admissionId), 10) : undefined;
    let rows = await db.select().from(inpatientDrugChartTable).orderBy(inpatientDrugChartTable.startDate);
    if (admissionId) rows = rows.filter(r => r.admissionId === admissionId);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
  } catch (err) {
    console.error("GET /inpatient/drug-chart error:", err);
    res.status(500).json({ error: "Failed to fetch drug chart", detail: err instanceof Error ? err.message : String(err) });
  }
});

const DrugSchema = z.object({
  admissionId: z.number().int(),
  patientId: z.number().int(),
  drugName: z.string(),
  dose: z.string(),
  route: z.string().optional(),
  frequency: z.string(),
  startDate: z.string(),
  stopDate: z.string().optional(),
  indication: z.string().optional(),
  status: z.string().optional(),
  prescribedByName: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/inpatient/drug-chart", async (req, res): Promise<void> => {
  try {
    const parsed = DrugSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.insert(inpatientDrugChartTable).values(parsed.data).returning();
    logAudit(req, "prescribe_drug", { entityType: "drug_chart", entityId: row.id, details: `${parsed.data.drugName} ${parsed.data.dose}` }).catch(() => {});
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    console.error("POST /inpatient/drug-chart error:", err);
    res.status(500).json({ error: "Failed to prescribe drug", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.patch("/inpatient/drug-chart/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = DrugSchema.partial().omit({ admissionId: true, patientId: true }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.update(inpatientDrugChartTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(inpatientDrugChartTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    console.error("PATCH /inpatient/drug-chart/:id error:", err);
    res.status(500).json({ error: "Failed to update drug chart", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/inpatient/drug-chart/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(inpatientDrugChartTable).where(eq(inpatientDrugChartTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /inpatient/drug-chart/:id error:", err);
    res.status(500).json({ error: "Failed to delete drug from chart", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/inpatient/nursing-notes", async (req, res): Promise<void> => {
  try {
    const admissionId = req.query.admissionId ? parseInt(String(req.query.admissionId), 10) : undefined;
    let rows = await db.select().from(nursingNotesTable).orderBy(desc(nursingNotesTable.noteDate), desc(nursingNotesTable.noteTime));
    if (admissionId) rows = rows.filter(r => r.admissionId === admissionId);
    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    console.error("GET /inpatient/nursing-notes error:", err);
    res.status(500).json({ error: "Failed to fetch nursing notes", detail: err instanceof Error ? err.message : String(err) });
  }
});

const NursingNoteSchema = z.object({
  admissionId: z.number().int(),
  patientId: z.number().int(),
  noteDate: z.string(),
  noteTime: z.string().optional(),
  noteType: z.string().optional(),
  note: z.string(),
  bloodPressure: z.string().optional(),
  pulse: z.string().optional(),
  temperature: z.string().optional(),
  respiratoryRate: z.string().optional(),
  spo2: z.string().optional(),
  bloodGlucose: z.string().optional(),
  urineOutput: z.string().optional(),
  fluidIntake: z.string().optional(),
  writtenByName: z.string().optional(),
});

router.post("/inpatient/nursing-notes", async (req, res): Promise<void> => {
  try {
    const parsed = NursingNoteSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.insert(nursingNotesTable).values(parsed.data).returning();
    logAudit(req, "nursing_note", { entityType: "nursing_note", entityId: row.id }).catch(() => {});
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    console.error("POST /inpatient/nursing-notes error:", err);
    res.status(500).json({ error: "Failed to save nursing note", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.patch("/inpatient/nursing-notes/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = NursingNoteSchema.partial().omit({ admissionId: true, patientId: true }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.update(nursingNotesTable).set(parsed.data).where(eq(nursingNotesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    console.error("PATCH /inpatient/nursing-notes/:id error:", err);
    res.status(500).json({ error: "Failed to update nursing note", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/inpatient/nursing-notes/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(nursingNotesTable).where(eq(nursingNotesTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /inpatient/nursing-notes/:id error:", err);
    res.status(500).json({ error: "Failed to delete nursing note", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/inpatient/ward-patients", async (req, res): Promise<void> => {
  try {
    const ward = typeof req.query.ward === "string" ? req.query.ward : undefined;
    let rows = await db.select({
      id: admissionsTable.id,
      patientId: admissionsTable.patientId,
      ward: admissionsTable.ward,
      bedNumber: admissionsTable.bedNumber,
      diagnosis: admissionsTable.diagnosis,
      admissionType: admissionsTable.admissionType,
      admittedByName: admissionsTable.admittedByName,
      createdAt: admissionsTable.createdAt,
    }).from(admissionsTable).where(eq(admissionsTable.status, "active"));

    if (ward) rows = rows.filter(r => r.ward === ward);

    const enriched = await Promise.all(rows.map(async r => {
      const [p] = await db.select({ fullName: patientsTable.fullName, age: patientsTable.age, gender: patientsTable.gender, bloodType: patientsTable.bloodType, allergies: patientsTable.allergies }).from(patientsTable).where(eq(patientsTable.id, r.patientId));
      const [lastRound] = await db.select({ roundDate: wardRoundNotesTable.roundDate, writtenByName: wardRoundNotesTable.writtenByName }).from(wardRoundNotesTable).where(eq(wardRoundNotesTable.admissionId, r.id)).orderBy(desc(wardRoundNotesTable.roundDate)).limit(1);
      const drugCount = await db.select({ id: inpatientDrugChartTable.id }).from(inpatientDrugChartTable).where(and(eq(inpatientDrugChartTable.admissionId, r.id), eq(inpatientDrugChartTable.status, "active"))).then(x => x.length);
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        patientName: p?.fullName ?? "Unknown",
        patientAge: p?.age ?? null,
        patientGender: p?.gender ?? null,
        bloodType: p?.bloodType ?? null,
        allergies: p?.allergies ?? null,
        lastRoundDate: lastRound?.roundDate ?? null,
        lastRoundBy: lastRound?.writtenByName ?? null,
        activeDrugs: drugCount,
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error("GET /inpatient/ward-patients error:", err);
    res.status(500).json({ error: "Failed to fetch ward patients", detail: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
