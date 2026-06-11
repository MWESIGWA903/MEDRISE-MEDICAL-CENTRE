import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";
import { admissionsTable } from "./admissions";

export const nursingNotesTable = pgTable("nursing_notes", {
  id: serial("id").primaryKey(),
  admissionId: integer("admission_id").notNull().references(() => admissionsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  noteDate: text("note_date").notNull(),
  noteTime: text("note_time"),
  noteType: text("note_type").default("observation"),
  note: text("note").notNull(),
  bloodPressure: text("blood_pressure"),
  pulse: text("pulse"),
  temperature: text("temperature"),
  respiratoryRate: text("respiratory_rate"),
  spo2: text("spo2"),
  bloodGlucose: text("blood_glucose"),
  urineOutput: text("urine_output"),
  fluidIntake: text("fluid_intake"),
  writtenById: integer("written_by_id").references(() => adminsTable.id),
  writtenByName: text("written_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("nursing_notes_admission_id_idx").on(t.admissionId),
  index("nursing_notes_patient_id_idx").on(t.patientId),
]);

export type NursingNote = typeof nursingNotesTable.$inferSelect;
export type NewNursingNote = typeof nursingNotesTable.$inferInsert;
