import { Router, type IRouter } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, gynaeClinicsTable, patientsTable } from '@workspace/db';
import { z } from 'zod';
import { getSessionFromRequest } from '../lib/session';
import { logAudit } from '../lib/audit';

const router: IRouter = Router();

/* ───────────────────────── SCHEMA ───────────────────────── */

const GynaeClinicInputSchema = z.object({
  patientId: z.number().int().positive(),
  visitDate: z.string().min(1),
  visitType: z.enum(['new', 'followup', 'emergency']),
  chiefComplaint: z.string().optional(),
  historyOfPresentingIllness: z.string().optional(),
  menstrualHistory: z.string().optional(),
  lastMenstrualPeriod: z.string().optional(),
  menstrualCycle: z.string().optional(),
  menstrualDuration: z.string().optional(),
  menstrualFlow: z.string().optional(),
  dysmenorrhea: z.string().optional(),
  obstetricHistory: z.string().optional(),
  contraceptiveHistory: z.string().optional(),
  currentContraceptive: z.string().optional(),
  sexualHistory: z.string().optional(),
  vaginalDischarge: z.string().optional(),
  vaginalItching: z.string().optional(),
  vaginalBleeding: z.string().optional(),
  abdominalPain: z.string().optional(),
  pelvicPain: z.string().optional(),
  urinarySymptoms: z.string().optional(),
  examinationFindings: z.string().optional(),
  speculumExamination: z.string().optional(),
  bimanualExamination: z.string().optional(),
  investigationsOrdered: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  prescriptions: z.string().optional(),
  referral: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

const GynaeClinicUpdateSchema = GynaeClinicInputSchema.partial().omit({
  patientId: true,
  visitDate: true,
  visitType: true,
});

/* ───────────────────────── HELPERS ───────────────────────── */

async function enrichClinic(c: typeof gynaeClinicsTable.$inferSelect) {
  const patient = await db
    .select({ fullName: patientsTable.fullName, phone: patientsTable.phone, age: patientsTable.age, gender: patientsTable.gender })
    .from(patientsTable)
    .where(eq(patientsTable.id, c.patientId))
    .then((r) => r[0]);

  return {
    ...c,
    patientName: patient?.fullName ?? 'Unknown',
    patientPhone: patient?.phone ?? null,
    patientAge: patient?.age ?? null,
    patientGender: patient?.gender ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/* ───────────────────────── GET ───────────────────────── */

router.get('/gynae/clinics', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
  const visitType = req.query.visitType as string | undefined;

  try {
    let query = db.select().from(gynaeClinicsTable).orderBy(desc(gynaeClinicsTable.visitDate));

    if (patientId) {
      query = query.where(eq(gynaeClinicsTable.patientId, patientId));
    }

    if (visitType) {
      query = query.where(eq(gynaeClinicsTable.visitType, visitType));
    }

    const rows = await query;
    const enriched = await Promise.all(rows.map(enrichClinic));

    res.json(enriched);
  } catch (err) {
    console.error('GET /gynae/clinics error:', err);
    res.status(500).json({
      error: 'Failed to fetch gynae clinics',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get('/gynae/clinics/:id', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid clinic ID' });
    return;
  }

  try {
    const [row] = await db.select().from(gynaeClinicsTable).where(eq(gynaeClinicsTable.id, id));

    if (!row) {
      res.status(404).json({ error: 'Gynae clinic not found' });
      return;
    }

    res.json(await enrichClinic(row));
  } catch (err) {
    console.error('GET /gynae/clinics/:id error:', err);
    res.status(500).json({
      error: 'Failed to fetch gynae clinic',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── POST ───────────────────────── */

router.post('/gynae/clinics', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = GynaeClinicInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const [record] = await db
      .insert(gynaeClinicsTable)
      .values({
        ...parsed.data,
        attendedBy: session.id,
        attendedByName: session.name,
      })
      .returning();

    await logAudit(req, 'create_gynae_clinic', {
      entityType: 'gynae_clinic',
      entityId: record.id,
      details: `Gynae clinic created for patient ${parsed.data.patientId}`,
    });

    res.status(201).json(await enrichClinic(record));
  } catch (err) {
    console.error('POST /gynae/clinics error:', err);
    res.status(500).json({
      error: 'Failed to create gynae clinic',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── PATCH ───────────────────────── */

router.patch('/gynae/clinics/:id', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid clinic ID' });
    return;
  }

  const parsed = GynaeClinicUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const [record] = await db
      .update(gynaeClinicsTable)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(gynaeClinicsTable.id, id))
      .returning();

    if (!record) {
      res.status(404).json({ error: 'Gynae clinic not found' });
      return;
    }

    await logAudit(req, 'update_gynae_clinic', {
      entityType: 'gynae_clinic',
      entityId: id,
      details: 'Gynae clinic updated',
    });

    res.json(await enrichClinic(record));
  } catch (err) {
    console.error('PATCH /gynae/clinics/:id error:', err);
    res.status(500).json({
      error: 'Failed to update gynae clinic',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── DELETE ───────────────────────── */

router.delete('/gynae/clinics/:id', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid clinic ID' });
    return;
  }

  try {
    const [record] = await db.delete(gynaeClinicsTable).where(eq(gynaeClinicsTable.id, id)).returning();

    if (!record) {
      res.status(404).json({ error: 'Gynae clinic not found' });
      return;
    }

    await logAudit(req, 'delete_gynae_clinic', {
      entityType: 'gynae_clinic',
      entityId: id,
      details: 'Gynae clinic deleted',
    });

    res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /gynae/clinics/:id error:', err);
    res.status(500).json({
      error: 'Failed to delete gynae clinic',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
