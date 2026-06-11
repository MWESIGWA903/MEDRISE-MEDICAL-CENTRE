import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { maternityRecordsTable } from "./maternityRecords";
import { adminsTable } from "./admins";

export const ancVisitsTable = pgTable("anc_visits", {
  id: serial("id").primaryKey(),
  maternityRecordId: integer("maternity_record_id").notNull().references(() => maternityRecordsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  visitNumber: integer("visit_number").notNull().default(1),
  visitDate: text("visit_date").notNull(),
  gestationalAge: integer("gestational_age"),
  weight: text("weight"),
  bloodPressure: text("blood_pressure"),
  temperature: text("temperature"),
  pulse: text("pulse"),
  fundalHeight: text("fundal_height"),
  presentation: text("presentation"),
  fetalHeartRate: text("fetal_heart_rate"),
  fetalMovement: text("fetal_movement"),
  edema: text("edema"),
  urineProtein: text("urine_protein"),
  urineSugar: text("urine_sugar"),
  dangerSigns: text("danger_signs"),
  ironFolicGiven: boolean("iron_folic_given").default(false),
  iptp: boolean("iptp").default(false),
  tetanusVaccine: text("tetanus_vaccine"),
  malariaTest: text("malaria_test"),
  malariaResult: text("malaria_result"),
  hivTestDone: boolean("hiv_test_done").default(false),
  hivResult: text("hiv_result"),
  ctxGiven: boolean("ctx_given").default(false),
  arvs: text("arvs"),
  birthPlan: text("birth_plan"),
  referralIndication: text("referral_indication"),
  nextVisitDate: text("next_visit_date"),
  clinicalNotes: text("clinical_notes"),
  attendedBy: integer("attended_by").references(() => adminsTable.id),
  attendedByName: text("attended_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AncVisit = typeof ancVisitsTable.$inferSelect;
export type NewAncVisit = typeof ancVisitsTable.$inferInsert;
