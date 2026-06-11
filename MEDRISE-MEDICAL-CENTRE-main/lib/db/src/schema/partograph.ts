import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { maternityRecordsTable } from "./maternityRecords";
import { adminsTable } from "./admins";

export const partographEntriesTable = pgTable("partograph_entries", {
  id: serial("id").primaryKey(),
  maternityRecordId: integer("maternity_record_id").notNull().references(() => maternityRecordsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  entryDate: text("entry_date").notNull(),
  entryTime: text("entry_time").notNull(),
  fetalHeartRate: integer("fetal_heart_rate"),
  liquor: text("liquor"),
  moulding: text("moulding"),
  cervicalDilation: integer("cervical_dilation"),
  descent: integer("descent"),
  contractions: integer("contractions"),
  contractionDuration: integer("contraction_duration"),
  contractionStrength: text("contraction_strength"),
  bloodPressure: text("blood_pressure"),
  pulse: integer("pulse"),
  temperature: text("temperature"),
  urineOutput: text("urine_output"),
  urineProtein: text("urine_protein"),
  urineAcetone: text("urine_acetone"),
  oxytocin: text("oxytocin"),
  drugsGiven: text("drugs_given"),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => adminsTable.id),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PartographEntry = typeof partographEntriesTable.$inferSelect;
export type NewPartographEntry = typeof partographEntriesTable.$inferInsert;
