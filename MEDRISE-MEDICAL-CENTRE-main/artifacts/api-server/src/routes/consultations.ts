import { Router, type IRouter } from 'express';
import { eq, desc } from 'drizzle-orm';
import {
  db,
  consultationsTable,
  patientsTable,
  adminsTable,
  labOrdersTable,
  imagingOrdersTable,
  pharmacyOrdersTable,
  triageTable,
} from '@workspace/db';
import { z } from 'zod';
import { logAudit } from '../lib/audit';
import { createAndBroadcast } from '../lib/notificationHelper';

const router: IRouter = Router();

/* ───────────────────────── SCHEMA ───────────────────────── */

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

/* ───────────────────────── MAPPER ───────────────────────── */

async function mapConsultation(c: typeof consultationsTable.$inferSelect) {
  const patient = c.patientId
    ? await db
        .select({ fullName: patientsTable.fullName })
        .from(patientsTable)
        .where(eq(patientsTable.id, c.patientId))
        .then((r) => r[0])
    : null;

  const staff = c.staffId
    ? await db
        .select({ name: adminsTable.name })
        .from(adminsTable)
        .where(eq(adminsTable.id, c.staffId))
        .then((r) => r[0])
    : null;

  return {
    ...c,
    patientName: patient?.fullName ?? null,
    staffName: staff?.name ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/* ───────────────────────── CONSULTATION CREATE ───────────────────────── */

router.post('/consultations', async (req, res): Promise<void> => {
  try {
    const parsed = ConsultationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [row] = await db
      .insert(consultationsTable)
      .values({
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
      })
      .returning();

    const patientId = parsed.data.patientId;
    const staffId = parsed.data.staffId ?? null;

    /* ───────────────────────── LAB ORDERS (FIXED) ───────────────────────── */

    if (parsed.data.labInvestigations) {
      const tests = parsed.data.labInvestigations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const testName of tests) {
        const [labOrder] = await db
          .insert(labOrdersTable)
          .values({
            patientId,
            consultationId: row.id,
            testName,
            testCategory: 'routine',
            priority: 'routine',
            status: 'pending', // ✅ CRITICAL FIX
            source: 'consultation', // ✅ CRITICAL FIX
            clinicalInfo: parsed.data.chiefComplaint || parsed.data.diagnosis || '',
            orderedBy: staffId,
          })
          .returning();

        await createAndBroadcast({
          type: 'lab_order',
          title: 'New Lab Request',
          body: `${testName} requested for patient ${patientId}`,
          severity: 'info',
          relatedId: labOrder.id,
        });
      }
    }

    /* ───────────────────────── IMAGING ORDERS (FIXED) ───────────────────────── */

    if (parsed.data.imagingInvestigations) {
      const studies = parsed.data.imagingInvestigations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const study of studies) {
        const lower = study.toLowerCase();

        let modality = 'X-Ray';
        if (lower.includes('ct')) modality = 'CT Scan';
        else if (lower.includes('mri')) modality = 'MRI';
        else if (lower.includes('ultrasound') || lower.includes('doppler')) modality = 'Ultrasound';
        else if (lower.includes('mammogram')) modality = 'Mammography';

        const [imagingOrder] = await db
          .insert(imagingOrdersTable)
          .values({
            patientId,
            consultationId: row.id,
            modality,
            bodyPart: study,
            clinicalIndication: parsed.data.chiefComplaint || parsed.data.diagnosis || '',
            priority: 'routine',
            status: 'pending', // ✅ CRITICAL FIX
            source: 'consultation', // ✅ CRITICAL FIX
          })
          .returning();

        await createAndBroadcast({
          type: 'imaging_order',
          title: 'New Imaging Request',
          body: `${study} requested for patient ${patientId}`,
          severity: 'info',
          relatedId: imagingOrder.id,
        });
      }
    }

    /* ───────────────────────── PHARMACY ───────────────────────── */

    if (parsed.data.prescriptions) {
      const lines = parsed.data.prescriptions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const line of lines) {
        const parts = line.split('|').map((s) => s.trim());
        if (parts.length >= 4) {
          await db.insert(pharmacyOrdersTable).values({
            patientId,
            consultationId: row.id,
            drugName: parts[0],
            dose: parts[1],
            frequency: parts[2],
            duration: parts[3],
            instructions: parts[4] || 'As directed',
            prescribedBy: staffId,
            status: 'pending',
            priority: 'routine',
          });
        }
      }
    }

    /* ───────────────────────── AUDIT ───────────────────────── */

    await logAudit(req, 'create_consultation', {
      entityType: 'consultation',
      entityId: row.id,
      details: parsed.data.chiefComplaint || parsed.data.diagnosis || '',
    }).catch(() => {});

    res.status(201).json(await mapConsultation(row));
  } catch (err) {
    console.error('POST /consultations error:', err);
    res.status(500).json({
      error: 'Failed to save consultation',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── GET CONSULTATIONS ───────────────────────── */

router.get('/consultations', async (req, res) => {
  try {
    const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;

    const rows = patientId
      ? await db
          .select()
          .from(consultationsTable)
          .where(eq(consultationsTable.patientId, patientId))
          .orderBy(desc(consultationsTable.visitDate))
      : await db.select().from(consultationsTable).orderBy(desc(consultationsTable.visitDate));

    res.json(await Promise.all(rows.map(mapConsultation)));
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch consultations',
      detail: String(err),
    });
  }
});

export default router;
