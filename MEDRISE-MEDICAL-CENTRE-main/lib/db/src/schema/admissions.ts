import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const admissionsTable = pgTable("admissions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  queueEntryId: integer("queue_entry_id"),
  ward: text("ward").notNull().default("General Ward"),
  bedNumber: text("bed_number"),
  admittedBy: integer("admitted_by").references(() => adminsTable.id),
  admittedByName: text("admitted_by_name"),
  admissionType: text("admission_type").notNull().default("elective"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  dischargedAt: timestamp("discharged_at"),
  dischargeSummary: text("discharge_summary"),
  dischargedByName: text("discharged_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("admissions_patient_id_idx").on(t.patientId),
  index("admissions_status_idx").on(t.status),
  index("admissions_ward_idx").on(t.ward),
]);

export type Admission = typeof admissionsTable.$inferSelect;
export type NewAdmission = typeof admissionsTable.$inferInsert;
