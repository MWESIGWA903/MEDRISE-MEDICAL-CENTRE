import { Router, type IRouter } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db, triageTable, labOrdersTable, imagingOrdersTable, patientsTable } from '@workspace/db';
import { z } from 'zod';
import { getSessionFromRequest } from '../lib/session';
import { logAudit } from '../lib/audit';
import { createAndBroadcast } from '../lib/notificationHelper';

const router: IRouter = Router();

/* ───────────────────────── SCHEMA ───────────────────────── */

const TriageInputSchema = z.object({
  patientId: z.number().int().positive(),
  assignedNurseId: z.number().int().positive().optional(),
  assignedNurseName: z.string().optional(),
  bloodPressure: z.string().optional(),
  pulseRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  bmi: z.string().optional(),
  painScale: z.number().int().min(0).max(10).optional(),
  
  // Split blood glucose tests
  randomBloodSugar: z.string().optional(),
  fastingBloodSugar: z.string().optional(),
  
  // Demographics that sync to patient master record
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  pregnancyStatus: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  
  chiefComplaint: z.string().min(1),
  nursingAssessment: z.string().optional(),
  interventionsPerformed: z.string().optional(),
  reassessmentNotes: z.string().optional(),

  presentingComplaints: z.string().optional(),
  briefMedicalHistory: z.string().optional(),
  emergencyInvestigationsRequested: z.string().optional(),
  investigationResults: z.string().optional(),
  laboratoryResultsUpload: z.string().optional(),
  imagingResultsUpload: z.string().optional(),

  priority: z.enum(['normal', 'non-urgent', 'urgent', 'emergency', 'deceased']).default('normal'),

  status: z.enum(['active', 'completed', 'referred']).default('active'),
  isEmergency: z.boolean().default(false),
  triageTime: z.string().optional(),
});

const TriageUpdateSchema = TriageInputSchema.partial().omit({
  patientId: true,
});

/* ───────────────────────── GET ───────────────────────── */

router.get('/triage', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;

  if (!patientId || isNaN(patientId)) {
    res.status(400).json({ error: 'patientId query parameter is required' });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(triageTable)
      .where(eq(triageTable.patientId, patientId))
      .orderBy(desc(triageTable.triageTime))
      .limit(10);

    res.json(
      rows.map((r) => ({
        ...r,
        triageTime: r.triageTime.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error('GET /triage error:', err);
    res.status(500).json({
      error: 'Failed to fetch triage records',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── CREATE TRIAGE ───────────────────────── */

router.post('/triage', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = TriageInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { triageTime, emergencyInvestigationsRequested, ...rest } = parsed.data;

    const [record] = await db
      .insert(triageTable)
      .values({
        ...rest,
        assignedNurseId: rest.assignedNurseId ?? session.id,
        assignedNurseName: rest.assignedNurseName ?? session.name,
        triageTime: triageTime ? new Date(triageTime) : new Date(),
      })
      .returning();

    /* ───────────────────────── PATIENT DEMOGRAPHIC SYNCHRONIZATION ───────────────────────── */
    
    // Sync demographics to Patient Master Record
    const patientUpdates: any = {};
    if (rest.bloodType) patientUpdates.bloodType = rest.bloodType;
    if (rest.allergies) patientUpdates.allergies = rest.allergies;
    if (rest.emergencyContactName) patientUpdates.nextOfKinName = rest.emergencyContactName;
    if (rest.emergencyContactPhone) patientUpdates.nextOfKinPhone = rest.emergencyContactPhone;
    if (rest.emergencyContactRelationship) patientUpdates.nextOfKinRelationship = rest.emergencyContactRelationship;
    if (rest.weight) patientUpdates.weight = rest.weight;
    if (rest.height) patientUpdates.height = rest.height;
    if (rest.bmi) patientUpdates.bmi = rest.bmi;
    
    if (Object.keys(patientUpdates).length > 0) {
      await db
        .update(patientsTable)
        .set(patientUpdates)
        .where(eq(patientsTable.id, parsed.data.patientId));
    }

    /* ───────────────────────── LAB ORDERS + BROADCAST FIX ───────────────────────── */

    if (emergencyInvestigationsRequested) {
      const investigations = emergencyInvestigationsRequested
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const investigation of investigations) {
        const lower = investigation.toLowerCase();

        const isLab =
          lower.includes('blood') ||
          lower.includes('cbc') ||
          lower.includes('urine') ||
          lower.includes('culture') ||
          lower.includes('biochemistry') ||
          lower.includes('serology') ||
          lower.includes('hematology') ||
          lower.includes('lab');

        if (isLab) {
          // Handle split blood glucose tests
          let testName = investigation;
          if (lower.includes('rbs') || lower.includes('random blood sugar')) {
            testName = 'Random Blood Sugar';
          } else if (lower.includes('fbs') || lower.includes('fasting blood sugar')) {
            testName = 'Fasting Blood Sugar';
          }

          const [labOrder] = await db
            .insert(labOrdersTable)
            .values({
              patientId: parsed.data.patientId,
              testName,
              testCategory: 'routine',
              priority: parsed.data.isEmergency ? 'stat' : 'routine',
              status: 'pending',
              clinicalInfo: parsed.data.chiefComplaint,
              orderedBy: session.id,
            })
            .returning();

          // ✅ FIX: THIS IS WHAT WAS MISSING (LAB WAS BLIND)
          await createAndBroadcast({
            type: 'lab_order',
            title: 'New Lab Request',
            body: `${parsed.data.patientId} requested ${testName}`,
            severity: 'info',
            relatedId: labOrder.id,
          });
        }
      }
    }

    /* ───────────────────────── AUDIT ───────────────────────── */

    await logAudit(req, 'record_triage', {
      entityType: 'triage',
      entityId: record.id,
      details: `Triage recorded for patient ${parsed.data.patientId}`,
    });

    res.status(201).json({
      ...record,
      triageTime: record.triageTime.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error('TRIAGE ERROR:', err);
    res.status(500).json({
      error: 'Failed to record triage',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── UPDATE ───────────────────────── */

router.patch('/triage/:id', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const parsed = TriageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    if (parsed.data.triageTime) {
      updates.triageTime = new Date(parsed.data.triageTime);
    }

    const [updated] = await db
      .update(triageTable)
      .set(updates)
      .where(eq(triageTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Triage record not found' });
      return;
    }

    await logAudit(req, 'update_triage', {
      entityType: 'triage',
      entityId: id,
    });

    res.json({
      ...updated,
      triageTime: updated.triageTime.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error('UPDATE TRIAGE ERROR:', err);
    res.status(500).json({
      error: 'Failed to update triage',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
