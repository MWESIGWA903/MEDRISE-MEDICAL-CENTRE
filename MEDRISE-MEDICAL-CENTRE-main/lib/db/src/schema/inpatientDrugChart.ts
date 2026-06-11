import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";
import { admissionsTable } from "./admissions";

export const inpatientDrugChartTable = pgTable("inpatient_drug_chart", {
  id: serial("id").primaryKey(),
  admissionId: integer("admission_id").notNull().references(() => admissionsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  drugName: text("drug_name").notNull(),
  dose: text("dose").notNull(),
  route: text("route").notNull().default("oral"),
  frequency: text("frequency").notNull(),
  startDate: text("start_date").notNull(),
  stopDate: text("stop_date"),
  indication: text("indication"),
  status: text("status").notNull().default("active"),
  prescribedById: integer("prescribed_by_id").references(() => adminsTable.id),
  prescribedByName: text("prescribed_by_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("inpatient_drug_chart_admission_id_idx").on(t.admissionId),
  index("inpatient_drug_chart_patient_id_idx").on(t.patientId),
  index("inpatient_drug_chart_status_idx").on(t.status),
]);

export type InpatientDrugChart = typeof inpatientDrugChartTable.$inferSelect;
export type NewInpatientDrugChart = typeof inpatientDrugChartTable.$inferInsert;
