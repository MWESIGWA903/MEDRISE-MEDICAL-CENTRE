import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const vitalSignsTable = pgTable("vital_signs", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  consultationId: integer("consultation_id"),
  bloodPressure: text("blood_pressure"),
  temperature: text("temperature"),
  pulse: text("pulse"),
  weight: text("weight"),
  height: text("height"),
  oxygenSaturation: text("oxygen_saturation"),
  respiratoryRate: text("respiratory_rate"),
  recordedBy: integer("recorded_by"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (t) => [
  index("vital_signs_patient_id_idx").on(t.patientId),
  index("vital_signs_consultation_id_idx").on(t.consultationId),
]);

export type VitalSigns = typeof vitalSignsTable.$inferSelect;
