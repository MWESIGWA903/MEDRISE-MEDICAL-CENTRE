import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, consultationsTable, patientsTable, adminsTable, labOrdersTable, imagingOrdersTable, pharmacyOrdersTable, triageTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const ConsultationInputSchema = z.object({
  patientId: z.number().int(),
  staffId: z.number().int().optional(),
  visitDate: z.string().min(1),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  prescriptions: z.string().optional(),
  referral: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  labInvestigations: z.string().optional(),
  imagingInvestigations: z.string().optional(),
});

async function mapConsultation(c: typeof consultationsTable.$inferSelect) {
  const patient = c.patientId
    ? await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, c.patientId)).then(r => r[0])
    : null;
  const staff = c.staffId
    ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, c.staffId)).then(r => r[0])
    : null;
  return {
    ...c,
    patientName: patient?.fullName ?? null,
    staffName: staff?.name ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/consultations", async (req, res): Promise<void> => {
  try {
    const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
    const rows = patientId
      ? await db.select().from(consultationsTable).where(eq(consultationsTable.patientId, patientId)).orderBy(desc(consultationsTable.visitDate))
      : await db.select().from(consultationsTable).orderBy(desc(consultationsTable.visitDate));
    const mapped = await Promise.all(rows.map(mapConsultation));
    res.json(mapped);
  } catch (err) {
    console.error("GET /consultations error:", err);
    res.status(500).json({ error: "Failed to fetch consultations", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/consultations", async (req, res): Promise<void> => {
  try {
    const parsed = ConsultationInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const [row] = await db.insert(consultationsTable).values({
      patientId: parsed.data.patientId,
      staffId: parsed.data.staffId ?? null,
      visitDate: parsed.data.visitDate,
      chiefComplaint: parsed.data.chiefComplaint ?? null,
      diagnosis: parsed.data.diagnosis ?? null,
      treatmentPlan: parsed.data.treatmentPlan ?? null,
      prescriptions: parsed.data.prescriptions ?? null,
      referral: parsed.data.referral ?? null,
      followUpDate: parsed.data.followUpDate ?? null,
      notes: parsed.data.notes ?? null,
    }).returning();

    if (parsed.data.labInvestigations) {
      const investigations = parsed.data.labInvestigations.split(',').map(s => s.trim()).filter(Boolean);
      for (const investigation of investigations) {
        await db.insert(labOrdersTable).values({
          patientId: parsed.data.patientId,
          consultationId: row.id,
          testName: investigation,
          testCategory: 'routine',
          priority: 'routine',
          status: 'pending',
          clinicalInfo: parsed.data.chiefComplaint || parsed.data.diagnosis,
          orderedBy: parsed.data.staffId,
        });
      }
    }

    if (parsed.data.imagingInvestigations) {
      const studies = parsed.data.imagingInvestigations.split(',').map(s => s.trim()).filter(Boolean);
      for (const study of studies) {
        const studyLower = study.toLowerCase();
        let modality = "X-Ray";
        if (studyLower.includes("ct scan") || studyLower.includes("computed tomography")) modality = "CT Scan";
        else if (studyLower.includes("mri") || studyLower.includes("magnetic resonance")) modality = "MRI";
        else if (studyLower.includes("ultrasound") || studyLower.includes("echo") || studyLower.includes("doppler")) modality = "Ultrasound";
        else if (studyLower.includes("mammogram") || studyLower.includes("mammography")) modality = "Mammography";

        await db.insert(imagingOrdersTable).values({
          patientId: parsed.data.patientId,
          consultationId: row.id,
          modality,
          bodyPart: study,
          clinicalIndication: parsed.data.chiefComplaint || parsed.data.diagnosis,
          priority: 'routine',
          status: 'requested',
        });
      }
    }

    if (parsed.data.prescriptions) {
      const prescriptionLines = parsed.data.prescriptions.split('\n').map(s => s.trim()).filter(Boolean);
      for (const prescription of prescriptionLines) {
        const parts = prescription.split('|').map(s => s.trim());
        if (parts.length >= 4) {
          await db.insert(pharmacyOrdersTable).values({
            patientId: parsed.data.patientId,
            consultationId: row.id,
            drugName: parts[0],
            dose: parts[1],
            frequency: parts[2],
            duration: parts[3],
            instructions: parts[4] || 'As directed',
            prescribedBy: parsed.data.staffId,
            status: 'pending',
            priority: 'routine',
          });
        }
      }
    }

    if (parsed.data.followUpDate) {
      await db.update(consultationsTable)
        .set({ followUpStatus: 'scheduled' })
        .where(eq(consultationsTable.id, row.id));
    }

    logAudit(req, "create_consultation", { entityType: "consultation", entityId: row.id, details: parsed.data.chiefComplaint ?? parsed.data.diagnosis ?? "" }).catch(() => {});
    res.status(201).json(await mapConsultation(row));
  } catch (err) {
    console.error("POST /consultations error:", err);
    res.status(500).json({ error: "Failed to save consultation", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/consultations/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.select().from(consultationsTable).where(eq(consultationsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const triageData = await db
      .select()
      .from(triageTable)
      .where(eq(triageTable.patientId, row.patientId))
      .orderBy(desc(triageTable.triageTime))
      .limit(1)
      .then(r => r[0] || null);

    const consultation = await mapConsultation(row);
    res.json({
      ...consultation,
      triageData: triageData ? {
        ...triageData,
        triageTime: triageData.triageTime.toISOString(),
        createdAt: triageData.createdAt.toISOString(),
        updatedAt: triageData.updatedAt.toISOString(),
      } : null,
    });
  } catch (err) {
    console.error("GET /consultations/:id error:", err);
    res.status(500).json({ error: "Failed to fetch consultation", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.patch("/consultations/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = ConsultationInputSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.update(consultationsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(consultationsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    logAudit(req, "update_consultation", { entityType: "consultation", entityId: row.id, details: parsed.data.diagnosis ?? "" }).catch(() => {});
    res.json(await mapConsultation(row));
  } catch (err) {
    console.error("PATCH /consultations/:id error:", err);
    res.status(500).json({ error: "Failed to update consultation", detail: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/consultations/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.delete(consultationsTable).where(eq(consultationsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    logAudit(req, "delete_consultation", { entityType: "consultation", entityId: row.id }).catch(() => {});
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /consultations/:id error:", err);
    res.status(500).json({ error: "Failed to delete consultation", detail: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
