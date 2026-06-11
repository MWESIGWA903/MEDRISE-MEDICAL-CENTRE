import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, imagingOrdersTable, patientsTable, adminsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const ImagingOrderInputSchema = z.object({
  patientId: z.number().int(),
  consultationId: z.number().int().optional(),
  requestedBy: z.number().int().optional(),
  modality: z.string().min(1),
  bodyPart: z.string().optional(),
  clinicalIndication: z.string().optional(),
  priority: z.enum(["routine", "urgent", "stat"]).optional(),
  notes: z.string().optional(),
});

const ImagingOrderUpdateSchema = z.object({
  status: z.enum(["requested", "in-progress", "completed", "cancelled"]).optional(),
  findings: z.string().optional(),
  impression: z.string().optional(),
  reportedBy: z.number().int().optional(),
  notes: z.string().optional(),
});

async function mapOrder(o: typeof imagingOrdersTable.$inferSelect) {
  const patient = await db.select({ fullName: patientsTable.fullName, dateOfBirth: patientsTable.dateOfBirth }).from(patientsTable).where(eq(patientsTable.id, o.patientId)).then(r => r[0]);
  const requester = o.requestedBy ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, o.requestedBy)).then(r => r[0]) : null;
  const reporter = o.reportedBy ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, o.reportedBy)).then(r => r[0]) : null;
  return {
    ...o,
    patientName: patient?.fullName ?? null,
    patientDob: patient?.dateOfBirth ?? null,
    requestedByName: requester?.name ?? null,
    reportedByName: reporter?.name ?? null,
    requestedAt: o.requestedAt.toISOString(),
    completedAt: o.completedAt?.toISOString() ?? null,
  };
}

router.get("/imaging/orders", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const modality = typeof req.query.modality === "string" ? req.query.modality : undefined;
  let rows = patientId
    ? await db.select().from(imagingOrdersTable).where(eq(imagingOrdersTable.patientId, patientId)).orderBy(desc(imagingOrdersTable.requestedAt))
    : await db.select().from(imagingOrdersTable).orderBy(desc(imagingOrdersTable.requestedAt));
  if (status) rows = rows.filter(r => r.status === status);
  if (modality) rows = rows.filter(r => r.modality === modality);
  const mapped = await Promise.all(rows.map(mapOrder));
  res.json(mapped);
});

router.post("/imaging/orders", async (req, res): Promise<void> => {
  const parsed = ImagingOrderInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(imagingOrdersTable).values({
    patientId: parsed.data.patientId,
    consultationId: parsed.data.consultationId ?? null,
    requestedBy: parsed.data.requestedBy ?? null,
    modality: parsed.data.modality,
    bodyPart: parsed.data.bodyPart ?? null,
    clinicalIndication: parsed.data.clinicalIndication ?? null,
    priority: parsed.data.priority ?? "routine",
    notes: parsed.data.notes ?? null,
  }).returning();
  logAudit(req, "create_imaging_order", { entityType: "imaging_order", entityId: row.id, details: `${parsed.data.modality}${parsed.data.bodyPart ? " — " + parsed.data.bodyPart : ""}` }).catch(() => {});
  res.status(201).json(await mapOrder(row));
});

router.patch("/imaging/orders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = ImagingOrderUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "completed") updateData.completedAt = new Date();
  }
  if (parsed.data.findings !== undefined) updateData.findings = parsed.data.findings;
  if (parsed.data.impression !== undefined) updateData.impression = parsed.data.impression;
  if (parsed.data.reportedBy !== undefined) updateData.reportedBy = parsed.data.reportedBy;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  const [row] = await db.update(imagingOrdersTable).set(updateData).where(eq(imagingOrdersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (parsed.data.status) {
    logAudit(req, "update_imaging_order_status", { entityType: "imaging_order", entityId: row.id, details: `${row.modality} → ${parsed.data.status}` }).catch(() => {});
  }
  res.json(await mapOrder(row));
});

router.delete("/imaging/orders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(imagingOrdersTable).where(eq(imagingOrdersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "delete_imaging_order", { entityType: "imaging_order", entityId: row.id, details: `${row.modality}${row.bodyPart ? " — " + row.bodyPart : ""}` }).catch(() => {});
  res.sendStatus(204);
});

export default router;
