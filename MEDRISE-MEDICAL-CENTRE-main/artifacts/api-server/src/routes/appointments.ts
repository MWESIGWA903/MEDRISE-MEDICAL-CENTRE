import { Router, type IRouter } from "express";
import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import { db, appointmentsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentStatusParams,
  UpdateAppointmentStatusBody,
  DeleteAppointmentParams,
  ListAppointmentsResponse,
  GetAppointmentResponse,
  UpdateAppointmentStatusResponse,
  GetAppointmentStatsResponse,
} from "@workspace/api-zod";
import {
  sendAppointmentConfirmationToPatient,
  sendAppointmentNotificationToClinic,
  sendAppointmentStatusUpdateToPatient,
} from "../lib/email";
import { createAndBroadcast } from "../lib/notificationHelper";

const router: IRouter = Router();

router.get("/appointments", async (req, res): Promise<void> => {
  const { search, status, sort } = req.query;
  
  let query = db.select().from(appointmentsTable);
  
  // Search by patient name, phone, email, or service (department)
  if (search && typeof search === "string") {
    const searchTerm = `%${search}%`;
    query = query.where(
      or(
        like(appointmentsTable.patientName, searchTerm),
        like(appointmentsTable.phone, searchTerm),
        like(appointmentsTable.email, searchTerm),
        like(appointmentsTable.service, searchTerm)
      )
    );
  }
  
  // Filter by status
  if (status && typeof status === "string") {
    query = query.where(eq(appointmentsTable.status, status));
  }
  
  // Sort options
  if (sort === "newest") {
    query = query.orderBy(desc(appointmentsTable.createdAt));
  } else if (sort === "oldest") {
    query = query.orderBy(asc(appointmentsTable.createdAt));
  } else if (sort === "date") {
    query = query.orderBy(asc(appointmentsTable.preferredDate));
  } else {
    // Default: newest first
    query = query.orderBy(desc(appointmentsTable.createdAt));
  }

  const appointments = await query;

  const mapped = appointments.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  res.json(ListAppointmentsResponse.parse(mapped));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const startTime = Date.now();
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dbStartTime = Date.now();
  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      patientName: parsed.data.patientName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      age: (parsed.data as { age?: number }).age ?? null,
      sex: (parsed.data as { sex?: string }).sex ?? null,
      service: parsed.data.service,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      preferredDoctor: (parsed.data as { preferredDoctor?: string }).preferredDoctor ?? null,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .returning();
  const dbEndTime = Date.now();
  console.log(`Appointment database save completed in ${dbEndTime - dbStartTime}ms`);

  const apptDetails = {
    patientName: appointment.patientName,
    phone: appointment.phone,
    email: appointment.email,
    service: appointment.service,
    preferredDate: appointment.preferredDate,
    preferredTime: appointment.preferredTime,
    message: appointment.message,
  };

  // Fire-and-forget email sending - do not await
  // Temporary: Only send clinic notification, not patient confirmation
  void Promise.all([
    sendAppointmentNotificationToClinic(apptDetails),
    createAndBroadcast({
      type: "appointment",
      title: "New Appointment Request",
      body: `${appointment.patientName} — ${appointment.service} on ${appointment.preferredDate} at ${appointment.preferredTime}`,
      severity: "info",
      relatedId: appointment.id,
    }),
  ]).catch((err) => {
    console.error("Failed to send appointment notifications:", err);
  });

  const responseTime = Date.now() - startTime;
  console.log(`Appointment HTTP response returned in ${responseTime}ms`);
  res.status(201).json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.get("/appointments/stats/summary", async (req, res): Promise<void> => {
  const rows = await db.select().from(appointmentsTable);
  const total = rows.length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const assigned = rows.filter((r) => r.status === "assigned").length;
  const rescheduled = rows.filter((r) => r.status === "rescheduled").length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  const completed = rows.filter((r) => r.status === "completed").length;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const todayCount = rows.filter((r) => r.preferredDate === todayStr).length;
  const thisWeekCount = rows.filter((r) => r.preferredDate >= weekStartStr).length;

  res.json(
    GetAppointmentStatsResponse.parse({
      total,
      pending,
      confirmed,
      assigned,
      rescheduled,
      cancelled,
      completed,
      todayCount,
      thisWeekCount,
    })
  );
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [appointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAppointmentStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [appointment] = await db
    .update(appointmentsTable)
    .set({ status: body.data.status })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  // Send patient email notification when confirmed or cancelled
  if ((body.data.status === "confirmed" || body.data.status === "cancelled") && appointment.email) {
    // Fire-and-forget email sending - do not await
    void sendAppointmentStatusUpdateToPatient({
      patientName: appointment.patientName,
      phone: appointment.phone,
      email: appointment.email,
      service: appointment.service,
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      message: appointment.message,
      status: body.data.status,
    }).catch((err) => {
      console.error("Failed to send appointment status update notification:", err);
    });
  }

  res.json(
    UpdateAppointmentStatusResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.patch("/appointments/:id/assign", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { staffId } = req.body;
  if (!staffId || typeof staffId !== "number") {
    res.status(400).json({ error: "staffId is required and must be a number" });
    return;
  }

  const [appointment] = await db
    .update(appointmentsTable)
    .set({ 
      assignedStaffId: staffId,
      assignedAt: new Date(),
      status: "assigned"
    })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.patch("/appointments/:id/reschedule", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { preferredDate, preferredTime, reason } = req.body;
  if (!preferredDate || !preferredTime) {
    res.status(400).json({ error: "preferredDate and preferredTime are required" });
    return;
  }

  // Get current appointment to save original date/time
  const [currentAppointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!currentAppointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  // Save original date/time as JSON
  const rescheduledFrom = JSON.stringify({
    preferredDate: currentAppointment.preferredDate,
    preferredTime: currentAppointment.preferredTime,
  });

  // Update status history
  let statusHistory = [];
  if (currentAppointment.statusHistory) {
    try {
      statusHistory = JSON.parse(currentAppointment.statusHistory);
    } catch {
      statusHistory = [];
    }
  }
  statusHistory.push({
    from: currentAppointment.status,
    to: "rescheduled",
    at: new Date().toISOString(),
    reason: reason || "Rescheduled by administrator",
  });

  const [appointment] = await db
    .update(appointmentsTable)
    .set({ 
      preferredDate,
      preferredTime,
      rescheduledFrom,
      rescheduledAt: new Date(),
      rescheduleReason: reason || null,
      status: "rescheduled",
      statusHistory: JSON.stringify(statusHistory),
    })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.patch("/appointments/:id/complete", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Get current appointment to update status history
  const [currentAppointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!currentAppointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  // Update status history
  let statusHistory = [];
  if (currentAppointment.statusHistory) {
    try {
      statusHistory = JSON.parse(currentAppointment.statusHistory);
    } catch {
      statusHistory = [];
    }
  }
  statusHistory.push({
    from: currentAppointment.status,
    to: "completed",
    at: new Date().toISOString(),
    reason: "Marked as completed",
  });

  const [appointment] = await db
    .update(appointmentsTable)
    .set({ 
      status: "completed",
      completedAt: new Date(),
      statusHistory: JSON.stringify(statusHistory),
    })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.patch("/appointments/:id/notes", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { note } = req.body;
  if (!note || typeof note !== "string") {
    res.status(400).json({ error: "note is required and must be a string" });
    return;
  }

  // Get current appointment to update notes history
  const [currentAppointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!currentAppointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  // Update notes history
  let notesHistory = [];
  if (currentAppointment.notesHistory) {
    try {
      notesHistory = JSON.parse(currentAppointment.notesHistory);
    } catch {
      notesHistory = [];
    }
  }
  notesHistory.push({
    note,
    at: new Date().toISOString(),
  });

  const [appointment] = await db
    .update(appointmentsTable)
    .set({ 
      message: note,
      notesHistory: JSON.stringify(notesHistory),
    })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [appointment] = await db
    .delete(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
