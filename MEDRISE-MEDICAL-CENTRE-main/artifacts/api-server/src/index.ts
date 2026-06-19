import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { loadSessionsFromDb, pruneExpiredSessions } from "./lib/session";
import { setupWebSocketServer } from "./lib/ws";
import cron from "node-cron";
import { db, pool, appointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendAppointmentReminderToPatient } from "./lib/email";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

async function runMigrations() {
  const client = await pool.connect();
  try {
    logger.info("Running schema migrations...");
    await client.query(`
      ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "assigned_staff_id" integer;
      ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "assigned_doctor_name" text;
      ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "checkin_time" timestamp;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "age_weeks" integer;
      ALTER TABLE "patient_queue" ADD COLUMN IF NOT EXISTS "triage_nursing_notes" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "presenting_complaints" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "brief_medical_history" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "emergency_investigations_requested" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "investigation_results" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "laboratory_results_upload" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "imaging_results_upload" text;
      ALTER TABLE "growth_records" ADD COLUMN IF NOT EXISTS "age_weeks" integer;
      CREATE TABLE IF NOT EXISTS "pharmacy_orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "consultation_id" integer,
        "drug_name" text NOT NULL,
        "dose" text NOT NULL,
        "frequency" text NOT NULL,
        "duration" text NOT NULL,
        "instructions" text NOT NULL,
        "prescribed_by" integer,
        "status" text DEFAULT 'pending' NOT NULL,
        "priority" text DEFAULT 'routine' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    logger.info("Schema migrations complete");
  } catch (err) {
    logger.error({ err }, "Migration error — continuing startup");
  } finally {
    client.release();
  }
}

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
  await runMigrations();

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

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    
    // Stop accepting new connections
    server.close(() => {
      logger.info("HTTP server closed");
    });

    // Give existing connections time to close gracefully
    setTimeout(() => {
      logger.info("Forcing shutdown after timeout");
      process.exit(0);
    }, 10000);

    // Exit gracefully after server closes
    server.on('close', () => {
      logger.info("Graceful shutdown complete");
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => { logger.error({ err }, "Startup failed"); process.exit(1); });
