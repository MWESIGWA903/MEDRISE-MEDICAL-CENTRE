import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const immunizationRecordsTable = pgTable("immunization_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  vaccine: text("vaccine").notNull(),
  doseNumber: integer("dose_number").default(1),
  dateGiven: text("date_given").notNull(),
  batchNumber: text("batch_number"),
  site: text("site"),
  route: text("route"),
  nextDueDate: text("next_due_date"),
  nextDueVaccine: text("next_due_vaccine"),
  adverseReaction: text("adverse_reaction"),
  administeredById: integer("administered_by_id").references(() => adminsTable.id),
  administeredByName: text("administered_by_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ImmunizationRecord = typeof immunizationRecordsTable.$inferSelect;
export type NewImmunizationRecord = typeof immunizationRecordsTable.$inferInsert;
