import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const dentalRecordsTable = pgTable("dental_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  visitDate: text("visit_date").notNull(),
  chiefComplaint: text("chief_complaint"),
  examinationNotes: text("examination_notes"),
  oralHygiene: text("oral_hygiene"),
  extraoralFindings: text("extraoral_findings"),
  softTissueFindings: text("soft_tissue_findings"),
  periodontalStatus: text("periodontal_status"),
  xrayTaken: boolean("xray_taken").default(false),
  xrayFindings: text("xray_findings"),
  toothChart: text("tooth_chart"),
  treatmentPlan: text("treatment_plan"),
  notes: text("notes"),
  dentistId: integer("dentist_id").references(() => adminsTable.id),
  dentistName: text("dentist_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DentalRecord = typeof dentalRecordsTable.$inferSelect;
export type NewDentalRecord = typeof dentalRecordsTable.$inferInsert;
