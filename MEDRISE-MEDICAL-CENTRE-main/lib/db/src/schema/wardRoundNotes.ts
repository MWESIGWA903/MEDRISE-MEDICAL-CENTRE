import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";
import { admissionsTable } from "./admissions";

export const wardRoundNotesTable = pgTable("ward_round_notes", {
  id: serial("id").primaryKey(),
  admissionId: integer("admission_id").notNull().references(() => admissionsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  roundDate: text("round_date").notNull(),
  roundTime: text("round_time"),
  subjective: text("subjective"),
  objective: text("objective"),
  assessment: text("assessment"),
  plan: text("plan"),
  bloodPressure: text("blood_pressure"),
  pulse: text("pulse"),
  temperature: text("temperature"),
  respiratoryRate: text("respiratory_rate"),
  spo2: text("spo2"),
  bloodGlucose: text("blood_glucose"),
  weight: text("weight"),
  writtenById: integer("written_by_id").references(() => adminsTable.id),
  writtenByName: text("written_by_name"),
  writtenByRole: text("written_by_role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("ward_round_notes_admission_id_idx").on(t.admissionId),
  index("ward_round_notes_patient_id_idx").on(t.patientId),
]);

export type WardRoundNote = typeof wardRoundNotesTable.$inferSelect;
export type NewWardRoundNote = typeof wardRoundNotesTable.$inferInsert;
