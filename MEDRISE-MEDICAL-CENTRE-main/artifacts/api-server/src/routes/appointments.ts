import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, appointmentsTable } from "@workspace/db";
import type { SessionData } from "../lib/session";
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
  sendAppointmentNotificationToClinic,
  sendAppointmentStatusUpdateToPatient,
} from "../lib/email";
import { createAndBroadcast } from "../lib/notificationHelper";

const router: IRouter = Router();

/* ───────────────────────── GET ALL APPOINTMENTS ───────────────────────── */

router.get("/appointments", async (req, res): Promise<void> => {
  const statusFilter =
    typeof req.query.status === "string" && req.query.status !== "all"
      ? req.query.status
      : null;

  const all = await db
    .select()
    .from(appointmentsTable)
    .orderBy(appointmentsTable.createdAt);

  const filtered = statusFilter
    ? all.filter((a) => a.status === statusFilter)
    : all;

  const mapped = filtered.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    checkinTime: a.checkinTime ? a.checkinTime.toISOString() : null,
  }));

  res.json(ListAppointmentsResponse.parse(mapped));
});

/* ───────────────────────── CREATE APPOINTMENT ───────────────────────── */

router.post("/appointments", async (req, res): Promise<void> => {
  const startTime = Date.now();
  const parsed = CreateAppointmentBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      patientName: parsed.data.patientName,
      phone: parsed.data.phone,
      email: parsed.data.email ?? "",
      age: (parsed.data as any).age ?? null,
      sex: (parsed.data as any).sex ?? null,
      service: parsed.data.service,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      preferredDoctor: (parsed.data as any).preferredDoctor ?? null,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .returning();

  const apptDetails = {
    patientName: appointment.patientName,
    phone: appointment.phone,
    email: appointment.email,
    service: appointment.service,
    preferredDate: appointment.preferredDate,
    preferredTime: appointment.preferredTime,
    message: appointment.message,
  };

  void Promise.all([
    sendAppointmentNotificationToClinic(apptDetails),
    createAndBroadcast({
      type: "appointment",
      title: "New Appointment Request",
      body: `${appointment.patientName} — ${appointment.service} on ${appointment.preferredDate} at ${appointment.preferredTime}`,
      severity: "info",
      relatedId: appointment.id,
    }),
  ]).catch((err) => console.error("Notification error:", err));

  res.status(201).json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
      checkinTime: null,
    })
  );
});

/* ───────────────────────── GET SINGLE APPOINTMENT ───────────────────────── */

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
      checkinTime: appointment.checkinTime
        ? appointment.checkinTime.toISOString()
        : null,
    })
  );
});

/* ───────────────────────── UPDATE (CHECK-IN FIXED HERE) ───────────────────────── */

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const params = UpdateAppointmentStatusParams.safeParse({
    id: parseInt(raw, 10),
  });

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAppointmentStatusBody.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateSet: Record<string, unknown> = {
    status: body.data.status,
  };

  if ((req.body as any).assignedStaffId !== undefined) {
    updateSet.assignedStaffId = (req.body as any).assignedStaffId || null;
  }

  if ((req.body as any).assignedDoctorName !== undefined) {
    updateSet.assignedDoctorName =
      (req.body as any).assignedDoctorName || null;
  }

  // ✅ FIX: store ISO string instead of Date object (CRITICAL FIX)
  if (body.data.status === "checked_in") {
    updateSet.checkinTime = new Date().toISOString();
  }

  const [appointment] = await db
    .update(appointmentsTable)
    .set(updateSet)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (
    (body.data.status === "confirmed" ||
      body.data.status === "cancelled") &&
    appointment.email
  ) {
    void sendAppointmentStatusUpdateToPatient({
      patientName: appointment.patientName,
      phone: appointment.phone,
      email: appointment.email,
      service: appointment.service,
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      message: appointment.message,
      status: body.data.status,
    }).catch((err) =>
      console.error("Email notification error:", err)
    );
  }

  // ✅ FIX: normalize response (no Date objects anywhere)
  res.json(
    UpdateAppointmentStatusResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
      checkinTime: appointment.checkinTime
        ? appointment.checkinTime.toISOString()
        : null,
    })
  );
});

/* ───────────────────────── DELETE ───────────────────────── */

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const params = DeleteAppointmentParams.safeParse({
    id: parseInt(raw, 10),
  });

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