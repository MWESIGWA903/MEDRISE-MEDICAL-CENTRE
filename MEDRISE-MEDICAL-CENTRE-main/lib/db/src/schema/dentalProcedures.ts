import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { dentalRecordsTable } from "./dentalRecords";
import { adminsTable } from "./admins";

export const dentalProceduresTable = pgTable("dental_procedures", {
  id: serial("id").primaryKey(),
  dentalRecordId: integer("dental_record_id").notNull().references(() => dentalRecordsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  procedureDate: text("procedure_date").notNull(),
  toothNumbers: text("tooth_numbers"),
  procedureName: text("procedure_name").notNull(),
  procedureCode: text("procedure_code"),
  surface: text("surface"),
  materialUsed: text("material_used"),
  anaesthesiaGiven: boolean("anaesthesia_given").default(false),
  anaesthesiaType: text("anaesthesia_type"),
  findings: text("findings"),
  complications: text("complications"),
  nextAppointment: text("next_appointment"),
  notes: text("notes"),
  performedById: integer("performed_by_id").references(() => adminsTable.id),
  performedByName: text("performed_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DentalProcedure = typeof dentalProceduresTable.$inferSelect;
export type NewDentalProcedure = typeof dentalProceduresTable.$inferInsert;
