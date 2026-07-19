import "dotenv/config";

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
      ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "admission_decision" text DEFAULT 'outpatient';
      ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "admission_id" integer;
      ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "disposition" text DEFAULT 'outpatient';
      ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "disposition_notes" text;
      ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "disposition_date" timestamp;
      CREATE INDEX IF NOT EXISTS "consultations_disposition_idx" ON "consultations"("disposition");
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "bmi" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "random_blood_sugar" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "fasting_blood_sugar" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "blood_type" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "allergies" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "pregnancy_status" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "emergency_contact_name" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" text;
      ALTER TABLE "triage" ADD COLUMN IF NOT EXISTS "emergency_contact_relationship" text;
      ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "isolation_type" text;
      ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "isolation_ward" text;
      ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "isolation_reason" text;
      ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "isolation_started_at" timestamp;
      ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "isolation_ended_at" timestamp;
      ALTER TABLE "admissions" ADD COLUMN IF NOT EXISTS "isolation_notes" text;
      CREATE INDEX IF NOT EXISTS "admissions_isolation_type_idx" ON "admissions"("isolation_type");
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "marital_status" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "occupation" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "religion" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "nationality" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "weight" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "height" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "bmi" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact_name" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact_relationship" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "pregnancy_status" text;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "last_visit_date" timestamp;
      ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "last_visit_department" text;
      CREATE INDEX IF NOT EXISTS "patients_phone_idx" ON "patients"("phone");
      CREATE INDEX IF NOT EXISTS "patients_full_name_idx" ON "patients"("full_name");
      CREATE INDEX IF NOT EXISTS "patients_date_of_birth_idx" ON "patients"("date_of_birth");
      CREATE INDEX IF NOT EXISTS "patients_gender_idx" ON "patients"("gender");
      CREATE TABLE IF NOT EXISTS "gynae_clinics" (
        "id" serial PRIMARY KEY NOT NULL,
        "patient_id" integer NOT NULL,
        "visit_date" text NOT NULL,
        "visit_type" text NOT NULL,
        "chief_complaint" text,
        "history_of_presenting_illness" text,
        "menstrual_history" text,
        "last_menstrual_period" text,
        "menstrual_cycle" text,
        "menstrual_duration" text,
        "menstrual_flow" text,
        "dysmenorrhea" text,
        "obstetric_history" text,
        "contraceptive_history" text,
        "current_contraceptive" text,
        "sexual_history" text,
        "vaginal_discharge" text,
        "vaginal_itching" text,
        "vaginal_bleeding" text,
        "abdominal_pain" text,
        "pelvic_pain" text,
        "urinary_symptoms" text,
        "examination_findings" text,
        "speculum_examination" text,
        "bimanual_examination" text,
        "investigations_ordered" text,
        "diagnosis" text,
        "treatment_plan" text,
        "prescriptions" text,
        "referral" text,
        "follow_up_date" text,
        "notes" text,
        "attended_by" integer,
        "attended_by_name" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "gynae_clinics_patient_id_idx" ON "gynae_clinics"("patient_id");
      CREATE INDEX IF NOT EXISTS "gynae_clinics_visit_date_idx" ON "gynae_clinics"("visit_date");
      CREATE INDEX IF NOT EXISTS "gynae_clinics_visit_type_idx" ON "gynae_clinics"("visit_type");
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
      CREATE TABLE IF NOT EXISTS "document_versions" (
        "id" serial PRIMARY KEY NOT NULL,
        "document_type" text NOT NULL,
        "document_id" integer NOT NULL,
        "patient_id" integer NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "content" json NOT NULL,
        "change_reason" text,
        "created_by_id" integer,
        "created_by_name" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "document_versions_document_id_idx" ON "document_versions"("document_id");
      CREATE INDEX IF NOT EXISTS "document_versions_document_type_idx" ON "document_versions"("document_type");
      CREATE INDEX IF NOT EXISTS "document_versions_patient_id_idx" ON "document_versions"("patient_id");
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
    try {
      await pruneExpiredSessions();
    } catch {}
  }, 60 * 60 * 1000);

  cron.schedule("0 8 * * *", () => {
    void sendTodayAppointmentReminders();
  });

  logger.info("Appointment reminder scheduler started (daily at 08:00)");

  const server = http.createServer(app);
  setupWebSocketServer(server);

  server.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");

    server.close(() => {
      logger.info("HTTP server closed");
    });

    setTimeout(() => {
      logger.info("Forcing shutdown after timeout");
      process.exit(0);
    }, 10000);

    server.on("close", () => {
      logger.info("Graceful shutdown complete");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.error({ err }, "Startup failed");
  process.exit(1);
});