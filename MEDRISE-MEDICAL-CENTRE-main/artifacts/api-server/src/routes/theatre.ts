import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, theatreBookingsTable, operativeRecordsTable, patientsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();
const TOKEN = () => "";

async function enrichBooking(b: typeof theatreBookingsTable.$inferSelect) {
  const patient = await db.select({ fullName: patientsTable.fullName, phone: patientsTable.phone, age: patientsTable.age, gender: patientsTable.gender })
    .from(patientsTable).where(eq(patientsTable.id, b.patientId)).then(x => x[0]);
  const opRecord = await db.select({ id: operativeRecordsTable.id })
    .from(operativeRecordsTable).where(eq(operativeRecordsTable.bookingId, b.id)).then(x => x[0] ?? null);
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    patientName: patient?.fullName ?? "Unknown",
    patientPhone: patient?.phone ?? null,
    patientAge: patient?.age ?? null,
    patientGender: patient?.gender ?? null,
    hasOperativeRecord: !!opRecord,
    operativeRecordId: opRecord?.id ?? null,
  };
}

// Stats
router.get("/theatre/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(theatreBookingsTable);
  const ops = await db.select().from(operativeRecordsTable);
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    total: all.length,
    scheduledToday: all.filter(b => b.bookedDate === today && b.status === "scheduled").length,
    inProgress: all.filter(b => b.status === "in_progress").length,
    completedTotal: all.filter(b => b.status === "completed").length,
    cancelled: all.filter(b => b.status === "cancelled").length,
    emergency: all.filter(b => b.priority === "emergency").length,
    elective: all.filter(b => b.priority === "elective").length,
    totalOperativeNotes: ops.length,
  });
});

// List bookings
router.get("/theatre/bookings", async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  let rows = await db.select().from(theatreBookingsTable).orderBy(theatreBookingsTable.bookedDate, theatreBookingsTable.bookedTime);
  if (status && status !== "all") rows = rows.filter(r => r.status === status);
  if (date) rows = rows.filter(r => r.bookedDate === date);
  const enriched = await Promise.all(rows.map(enrichBooking));
  res.json(enriched);
});

router.get("/theatre/bookings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.select().from(theatreBookingsTable).where(eq(theatreBookingsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichBooking(row));
});

const BookingSchema = z.object({
  patientId: z.number().int(),
  surgeryType: z.string(),
  surgeonName: z.string().optional(),
  anaesthetistName: z.string().optional(),
  scrubNurseName: z.string().optional(),
  circulatingNurseName: z.string().optional(),
  bookedDate: z.string(),
  bookedTime: z.string().optional(),
  estimatedDuration: z.number().int().optional(),
  theatreRoom: z.string().optional(),
  priority: z.enum(["elective", "urgent", "emergency"]).optional(),
  status: z.string().optional(),
  diagnosis: z.string().optional(),
  preOpNotes: z.string().optional(),
  consentObtained: z.boolean().optional(),
  npoStatus: z.boolean().optional(),
  bloodAvailable: z.string().optional(),
  createdByName: z.string().optional(),
});

router.post("/theatre/bookings", async (req, res): Promise<void> => {
  const parsed = BookingSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(theatreBookingsTable).values(parsed.data).returning();
  logAudit(req, "create_theatre_booking", { entityType: "theatre_booking", entityId: row.id, details: `${parsed.data.surgeryType} — ${parsed.data.bookedDate}` }).catch(() => {});
  res.status(201).json(await enrichBooking(row));
});

router.patch("/theatre/bookings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = BookingSchema.partial().omit({ patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(theatreBookingsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(theatreBookingsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "update_theatre_booking", { entityType: "theatre_booking", entityId: id, details: JSON.stringify(parsed.data) }).catch(() => {});
  res.json(await enrichBooking(row));
});

router.delete("/theatre/bookings/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(operativeRecordsTable).where(eq(operativeRecordsTable.bookingId, id));
  const [row] = await db.delete(theatreBookingsTable).where(eq(theatreBookingsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Operative Records
router.get("/theatre/operative-records", async (req, res): Promise<void> => {
  const bookingId = req.query.bookingId ? parseInt(String(req.query.bookingId), 10) : undefined;
  let rows = await db.select().from(operativeRecordsTable).orderBy(desc(operativeRecordsTable.createdAt));
  if (bookingId) rows = rows.filter(r => r.bookingId === bookingId);
  const enriched = await Promise.all(rows.map(async r => {
    const p = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, r.patientId)).then(x => x[0]);
    return { ...r, patientName: p?.fullName ?? "Unknown", createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  }));
  res.json(enriched);
});

router.get("/theatre/operative-records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.select().from(operativeRecordsTable).where(eq(operativeRecordsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const p = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, row.patientId)).then(x => x[0]);
  res.json({ ...row, patientName: p?.fullName ?? "Unknown", createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

const OperativeSchema = z.object({
  bookingId: z.number().int(),
  patientId: z.number().int(),
  operationPerformed: z.string(),
  preOpDiagnosis: z.string().optional(),
  postOpDiagnosis: z.string().optional(),
  procedureNotes: z.string().optional(),
  findings: z.string().optional(),
  complications: z.string().optional(),
  anaesthesiaType: z.string().optional(),
  anaesthesiaAgents: z.string().optional(),
  bloodLossMl: z.string().optional(),
  bloodTransfusion: z.boolean().optional(),
  specimensSent: z.string().optional(),
  drainsInserted: z.string().optional(),
  closureMethod: z.string().optional(),
  actualStartTime: z.string().optional(),
  actualEndTime: z.string().optional(),
  surgeonName: z.string().optional(),
  assistantName: z.string().optional(),
  anaesthetistName: z.string().optional(),
  swabCountCorrect: z.boolean().optional(),
  instrumentCountCorrect: z.boolean().optional(),
  postOpInstructions: z.string().optional(),
  postOpWard: z.string().optional(),
  condition: z.string().optional(),
});

router.post("/theatre/operative-records", async (req, res): Promise<void> => {
  const parsed = OperativeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(operativeRecordsTable).values(parsed.data).returning();
  await db.update(theatreBookingsTable).set({ status: "completed", updatedAt: new Date() }).where(eq(theatreBookingsTable.id, parsed.data.bookingId));
  logAudit(req, "create_operative_record", { entityType: "operative_record", entityId: row.id, details: parsed.data.operationPerformed }).catch(() => {});
  const p = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, row.patientId)).then(x => x[0]);
  res.status(201).json({ ...row, patientName: p?.fullName ?? "Unknown", createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.patch("/theatre/operative-records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = OperativeSchema.partial().omit({ bookingId: true, patientId: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(operativeRecordsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(operativeRecordsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

export default router;
