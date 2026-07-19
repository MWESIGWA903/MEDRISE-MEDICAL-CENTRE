import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";
import { admissionsTable } from "./admissions";

export const consultationsTable = pgTable("consultations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  staffId: integer("staff_id").references(() => adminsTable.id),
  visitDate: text("visit_date").notNull(),
  chiefComplaint: text("chief_complaint"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  prescriptions: text("prescriptions"),
  referral: text("referral"),
  followUpDate: text("follow_up_date"),
  followUpStatus: text("follow_up_status").default("pending"),
  notes: text("notes"),
  admissionDecision: text("admission_decision").notNull().default("outpatient"), // 'outpatient' or 'inpatient'
  admissionId: integer("admission_id").references(() => admissionsTable.id),
  disposition: text("disposition").notNull().default("outpatient"), // 'outpatient', 'admit', 'refer', 'transfer', 'discharge', 'death'
  dispositionNotes: text("disposition_notes"),
  dispositionDate: timestamp("disposition_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("consultations_patient_id_idx").on(t.patientId),
  index("consultations_staff_id_idx").on(t.staffId),
  index("consultations_created_at_idx").on(t.createdAt),
  index("consultations_disposition_idx").on(t.disposition),
]);

export type Consultation = typeof consultationsTable.$inferSelect;
