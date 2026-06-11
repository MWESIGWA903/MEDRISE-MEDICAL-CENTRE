import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { loadSessionsFromDb, pruneExpiredSessions } from "./lib/session";
import { setupWebSocketServer } from "./lib/ws";
import cron from "node-cron";
import { db, appointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendAppointmentReminderToPatient } from "./lib/email";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

async function sendTodayAppointmentReminders() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const appointments = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.status, "confirmed"));

    const todayAppts = appointments.filter((a) => a.preferredDate === today && a.email);
    logger.info({ count: todayAppts.length, date: today }, "Sending appointment reminders");

    for (const appt of todayAppts) {
      await sendAppointmentReminderToPatient({
        patientName: appt.patientName,
        phone: appt.phone,
        email: appt.email,
        service: appt.service,
        preferredDate: appt.preferredDate,
        preferredTime: appt.preferredTime,
        message: appt.message,
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to send appointment reminders");
  }
}

async function start() {
  try {
    await loadSessionsFromDb();
    logger.info("Sessions restored from database");
  } catch (e) {
    logger.warn({ e }, "Could not load sessions from DB — starting fresh");
  }

  setInterval(async () => {
    try { await pruneExpiredSessions(); } catch {}
  }, 60 * 60 * 1000);

  // Daily appointment reminder — runs at 8:00 AM every day
  cron.schedule("0 8 * * *", () => {
    void sendTodayAppointmentReminders();
  });
  logger.info("Appointment reminder scheduler started (daily at 08:00)");

  const server = http.createServer(app);
  setupWebSocketServer(server);

  server.listen(port, (err?: Error) => {
    if (err) { logger.error({ err }, "Error listening on port"); process.exit(1); }
    logger.info({ port }, "Server listening");
  });
}

start().catch((err) => { logger.error({ err }, "Startup failed"); process.exit(1); });
