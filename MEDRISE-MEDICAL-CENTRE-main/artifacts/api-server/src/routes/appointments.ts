import { Router, type IRouter } from 'express';
import { eq } from 'drizzle-orm';
import { db, appointmentsTable } from '@workspace/db';

import {
  CreateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentStatusParams,
  UpdateAppointmentStatusBody,
  DeleteAppointmentParams,
  ListAppointmentsResponse,
  GetAppointmentResponse,
  UpdateAppointmentStatusResponse,
} from '@workspace/api-zod';

import {
  sendAppointmentNotificationToClinic,
  sendAppointmentStatusUpdateToPatient,
} from '../lib/email';

import { createAndBroadcast } from '../lib/notificationHelper';

const router: IRouter = Router();

/* ───────────────────────── GET ALL ───────────────────────── */

router.get('/appointments', async (req, res): Promise<void> => {
  const statusFilter =
    typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : null;

  const all = await db.select().from(appointmentsTable).orderBy(appointmentsTable.createdAt);

  const filtered = statusFilter ? all.filter((a) => a.status === statusFilter) : all;

  res.json(
    ListAppointmentsResponse.parse(
      filtered.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        checkinTime: a.checkinTime ? a.checkinTime.toISOString() : null,
      })),
    ),
  );
});

/* ──────────────────────── STATS SUMMARY ──────────────────────── */

router.get('/appointments/stats/summary', async (_req, res): Promise<void> => {
  try {
    const appointments = await db.select().from(appointmentsTable);

    res.json({
      totalAppointments: appointments.length,
      pending: appointments.filter((a) => a.status === 'pending').length,

      checkedIn: appointments.filter((a) => a.status === 'checked_in').length,

      completed: appointments.filter((a) => a.status === 'completed').length,
    });
  } catch (err) {
    console.error('APPOINTMENT STATS ERROR:', err);

    res.status(500).json({
      error: 'Failed to load appointment stats',
    });
  }
});

/* ───────────────────────── CREATE ───────────────────────── */

router.post('/appointments', async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.message,
    });
    return;
  }

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      patientName: parsed.data.patientName,
      phone: parsed.data.phone,
      email: parsed.data.email ?? '',
      age: (parsed.data as any).age ?? null,
      sex: (parsed.data as any).sex ?? null,
      service: parsed.data.service,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      preferredDoctor: (parsed.data as any).preferredDoctor ?? null,
      message: parsed.data.message ?? null,
      status: 'pending',
    })
    .returning();

  void Promise.all([
    sendAppointmentNotificationToClinic({
      patientName: appointment.patientName,
      phone: appointment.phone,
      email: appointment.email,
      service: appointment.service,
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      message: appointment.message,
    }),

    createAndBroadcast({
      type: 'appointment',
      title: 'New Appointment',
      body: `${appointment.patientName} — ${appointment.service}`,
      severity: 'info',
      relatedId: appointment.id,
    }),
  ]).catch(console.error);

  res.status(201).json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
      checkinTime: null,
    }),
  );
});

/* ───────────────────────── GET ONE ───────────────────────── */

router.get('/appointments/:id', async (req, res): Promise<void> => {
  const raw = req.params.id;

  const params = GetAppointmentParams.safeParse({
    id: parseInt(raw, 10),
  });

  if (!params.success) {
    res.status(400).json({
      error: params.error.message,
    });

    return;
  }

  const [appointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!appointment) {
    res.status(404).json({
      error: 'Appointment not found',
    });

    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
      checkinTime: appointment.checkinTime ? appointment.checkinTime.toISOString() : null,
    }),
  );
});

/* ───────────────────────── PATCH ───────────────────────── */

router.patch('/appointments/:id', async (req, res): Promise<void> => {
  const raw = req.params.id;

  const params = UpdateAppointmentStatusParams.safeParse({
    id: parseInt(raw, 10),
  });

  if (!params.success) {
    res.status(400).json({
      error: params.error.message,
    });

    return;
  }

  const body = UpdateAppointmentStatusBody.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({
      error: body.error.message,
    });

    return;
  }

  const updateSet: Record<string, unknown> = {
    status: body.data.status,
  };

  if ((req.body as any).assignedStaffId !== undefined) {
    updateSet.assignedStaffId = (req.body as any).assignedStaffId || null;
  }

  if ((req.body as any).assignedDoctorName !== undefined) {
    updateSet.assignedDoctorName = (req.body as any).assignedDoctorName || null;
  }

  if (body.data.status === 'checked_in') {
    updateSet.checkinTime = new Date();
  }

  let appointment;

  try {
    [appointment] = await db
      .update(appointmentsTable)
      .set(updateSet)
      .where(eq(appointmentsTable.id, params.data.id))
      .returning();
  } catch (err) {
    console.error('PATCH ERROR:', err);

    res.status(500).json({
      error: 'Failed to update appointment',
    });

    return;
  }

  if (!appointment) {
    res.status(404).json({
      error: 'Appointment not found',
    });

    return;
  }

  if (body.data.status === 'checked_in') {
    try {
      await db.execute(`
        INSERT INTO patient_queue
        (appointment_id, status, created_at)
        VALUES
        (${appointment.id}, 'waiting', NOW())
      `);
    } catch (err) {
      console.error('QUEUE INSERT FAILED:', err);
    }
  }

  if ((body.data.status === 'confirmed' || body.data.status === 'cancelled') && appointment.email) {
    void sendAppointmentStatusUpdateToPatient({
      patientName: appointment.patientName,
      phone: appointment.phone,
      email: appointment.email,
      service: appointment.service,
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      message: appointment.message,
      status: body.data.status,
    }).catch(console.error);
  }

  res.json(
    UpdateAppointmentStatusResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
      checkinTime: appointment.checkinTime ? appointment.checkinTime.toISOString() : null,
    }),
  );
});

/* ───────────────────────── DELETE ───────────────────────── */

router.delete('/appointments/:id', async (req, res): Promise<void> => {
  const params = DeleteAppointmentParams.safeParse({
    id: parseInt(req.params.id, 10),
  });

  if (!params.success) {
    res.status(400).json({
      error: params.error.message,
    });

    return;
  }

  const [appointment] = await db
    .delete(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({
      error: 'Appointment not found',
    });

    return;
  }

  res.sendStatus(204);
});

export default router;
