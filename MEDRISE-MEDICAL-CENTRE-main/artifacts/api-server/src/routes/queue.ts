import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, patientQueueTable, patientsTable, adminsTable, imagingOrdersTable } from "@workspace/db";
import { z } from "zod";
import { createAndBroadcast } from "../lib/notificationHelper";
import { sendQueueStatusUpdateToPatient } from "../lib/email";

function parseImagingStudyString(study: string): { modality: string; bodyPart: string } {
  const s = study.toLowerCase();
  let modality = "X-Ray";
  if (s.includes("ct scan") || s.includes("ct —") || s.includes("computed tomography")) modality = "CT Scan";
  else if (s.includes("mri") || s.includes("magnetic resonance")) modality = "MRI";
  else if (s.includes("ultrasound") || s.includes("echo") || s.includes("doppler")) {
    if (s.includes("echo") && !s.includes("ultrasound")) modality = "Echocardiography";
    else if (s.includes("doppler")) modality = "Doppler Ultrasound";
    else modality = "Ultrasound";
  }
  else if (s.includes("mammogram") || s.includes("mammography")) modality = "Mammography";
  else if (s.includes("dexa") || s.includes("bone density")) modality = "Bone Densitometry (DEXA)";
  else if (s.includes("fluoroscopy")) modality = "Fluoroscopy";
  else if (s.includes("pet scan")) modality = "PET Scan";
  else if (s.includes("nuclear")) modality = "Nuclear Medicine Scan";
  else if (s.includes("angiograph")) modality = "Angiography";
  return { modality, bodyPart: study };
}

const router: IRouter = Router();

const PRIORITY_VALUES = ["normal", "non-urgent", "urgent", "emergency", "deceased"] as const;

const QueueEntryInputSchema = z.object({
  patientId: z.number().int().optional(),
  patientName: z.string().min(1),
  queueDate: z.string().optional(),
  priority: z.enum(PRIORITY_VALUES).optional().default("normal"),
  staffId: z.number().int().optional(),
  notes: z.string().optional(),
  referralSource: z.enum(["home", "facility_referral", "self_referral"]).optional().default("home"),
  referralFacility: z.string().optional(),
  department: z.string().optional().default("general"),
  notificationPhone: z.string().optional(),
  vitalsSnapshot: z.string().optional(),
  labInvestigations: z.string().optional(),
  imagingInvestigations: z.string().optional(),
  managementPlan: z.string().optional(),
  diagnosis: z.string().optional(),
});

const QueueEntryUpdateSchema = z.object({
  status: z.enum(["waiting", "in-consultation", "nursing", "theatre", "done", "skipped"]).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  staffId: z.number().int().optional().nullable(),
  notes: z.string().optional(),
  department: z.string().optional(),
  transferNote: z.string().optional(),
  managementPlan: z.string().optional(),
  vitalsSnapshot: z.string().optional(),
  notificationPhone: z.string().optional(),
  diagnosis: z.string().optional(),
  labInvestigations: z.string().optional(),
  imagingInvestigations: z.string().optional(),
});

async function getNextArrivalOrder(date: string): Promise<number> {
  const existing = await db
    .select({ arrivalOrder: patientQueueTable.arrivalOrder })
    .from(patientQueueTable)
    .where(eq(patientQueueTable.queueDate, date));
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((e) => e.arrivalOrder)) + 1;
}

function mapEntry(e: typeof patientQueueTable.$inferSelect) {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

router.get("/queue", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const date = typeof req.query.date === "string" ? req.query.date : today;

  const entries = await db
    .select()
    .from(patientQueueTable)
    .where(eq(patientQueueTable.queueDate, date))
    .orderBy(patientQueueTable.arrivalOrder);

  res.json(entries.map(mapEntry));
});

router.post("/queue", async (req, res): Promise<void> => {
  const parsed = QueueEntryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const queueDate = parsed.data.queueDate ?? today;

  let patientName = parsed.data.patientName;
  let notificationPhone = parsed.data.notificationPhone ?? null;

  if (parsed.data.patientId) {
    const patient = await db
      .select({ fullName: patientsTable.fullName, phone: patientsTable.phone })
      .from(patientsTable)
      .where(eq(patientsTable.id, parsed.data.patientId))
      .then((r) => r[0]);
    if (patient) {
      patientName = patient.fullName;
      if (!notificationPhone) notificationPhone = patient.phone;
    }
  }

  let staffName: string | null = null;
  if (parsed.data.staffId) {
    const staff = await db
      .select({ name: adminsTable.name })
      .from(adminsTable)
      .where(eq(adminsTable.id, parsed.data.staffId))
      .then((r) => r[0]);
    if (staff) staffName = staff.name;
  }

  const arrivalOrder = await getNextArrivalOrder(queueDate);

  const [entry] = await db
    .insert(patientQueueTable)
    .values({
      patientId: parsed.data.patientId ?? null,
      patientName,
      queueDate,
      status: "waiting",
      arrivalOrder,
      staffId: parsed.data.staffId ?? null,
      staffName,
      priority: parsed.data.priority ?? "normal",
      notes: parsed.data.notes ?? null,
      referralSource: parsed.data.referralSource ?? "home",
      referralFacility: parsed.data.referralFacility ?? null,
      department: parsed.data.department ?? "general",
      notificationPhone,
      vitalsSnapshot: parsed.data.vitalsSnapshot ?? null,
      labInvestigations: parsed.data.labInvestigations ?? null,
      imagingInvestigations: parsed.data.imagingInvestigations ?? null,
      managementPlan: parsed.data.managementPlan ?? null,
      diagnosis: parsed.data.diagnosis ?? null,
    })
    .returning();

  const isUrgent = entry.priority === "emergency" || entry.priority === "urgent";
  void createAndBroadcast({
    type: "queue",
    title: isUrgent
      ? `${entry.priority === "emergency" ? "EMERGENCY" : "Urgent"}: ${patientName} in Queue`
      : `New Patient in Queue: ${patientName}`,
    body: `${entry.department ?? "General"} — ${entry.priority} priority. Queue #${arrivalOrder}.`,
    severity: entry.priority === "emergency" ? "urgent" : entry.priority === "urgent" ? "warning" : "info",
    relatedId: entry.id,
  });

  res.status(201).json(mapEntry(entry));
});

router.patch("/queue/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = QueueEntryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof patientQueueTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.department !== undefined) updateData.department = parsed.data.department;
  if (parsed.data.transferNote !== undefined) updateData.transferNote = parsed.data.transferNote;
  if (parsed.data.managementPlan !== undefined) updateData.managementPlan = parsed.data.managementPlan;
  if (parsed.data.vitalsSnapshot !== undefined) updateData.vitalsSnapshot = parsed.data.vitalsSnapshot;
  if (parsed.data.notificationPhone !== undefined) updateData.notificationPhone = parsed.data.notificationPhone;
  if (parsed.data.diagnosis !== undefined) updateData.diagnosis = parsed.data.diagnosis;
  if (parsed.data.labInvestigations !== undefined) updateData.labInvestigations = parsed.data.labInvestigations;
  if (parsed.data.imagingInvestigations !== undefined) updateData.imagingInvestigations = parsed.data.imagingInvestigations;

  if (parsed.data.staffId !== undefined) {
    updateData.staffId = parsed.data.staffId;
    if (parsed.data.staffId) {
      const staff = await db
        .select({ name: adminsTable.name })
        .from(adminsTable)
        .where(eq(adminsTable.id, parsed.data.staffId))
        .then((r) => r[0]);
      updateData.staffName = staff?.name ?? null;
    } else {
      updateData.staffName = null;
    }
  }

  const [entry] = await db
    .update(patientQueueTable)
    .set(updateData)
    .where(eq(patientQueueTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Queue entry not found" });
    return;
  }

  // Email patient on status change if they have a linked patient record with an email address
  if (parsed.data.status && entry.patientId) {
    void (async () => {
      const patient = await db
        .select({ email: patientsTable.email, fullName: patientsTable.fullName })
        .from(patientsTable)
        .where(eq(patientsTable.id, entry.patientId!))
        .then((r) => r[0]);
      if (patient?.email) {
        await sendQueueStatusUpdateToPatient({
          patientName: patient.fullName,
          email: patient.email,
          status: parsed.data.status!,
          department: entry.department,
          diagnosis: parsed.data.diagnosis ?? entry.diagnosis,
        });
      }
    })();
  }

  // Auto-create imaging_orders when imaging investigations are recorded for a known patient
  if (parsed.data.imagingInvestigations && entry.patientId) {
    let studies: string[] = [];
    try { studies = JSON.parse(parsed.data.imagingInvestigations); } catch { /* not JSON */ }
    if (studies.length > 0) {
      // Find existing imaging orders for this queue entry to avoid duplicates
      const existing = await db
        .select({ bodyPart: imagingOrdersTable.bodyPart })
        .from(imagingOrdersTable)
        .where(and(
          eq(imagingOrdersTable.queueEntryId, id),
          eq(imagingOrdersTable.patientId, entry.patientId),
        ));
      const alreadyOrdered = new Set(existing.map(r => r.bodyPart ?? ""));
      const toCreate = studies.filter(s => !alreadyOrdered.has(s));
      if (toCreate.length > 0) {
        const patientPriority = entry.priority === "emergency" ? "stat" : entry.priority === "urgent" ? "urgent" : "routine";
        await db.insert(imagingOrdersTable).values(
          toCreate.map(study => {
            const { modality, bodyPart } = parseImagingStudyString(study);
            return {
              patientId: entry.patientId!,
              queueEntryId: id,
              modality,
              bodyPart,
              clinicalIndication: entry.diagnosis || entry.notes || null,
              priority: patientPriority,
              status: "requested" as const,
            };
          })
        );
      }
    }
  }

  res.json(mapEntry(entry));
});

router.delete("/queue/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [entry] = await db
    .delete(patientQueueTable)
    .where(eq(patientQueueTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Queue entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
