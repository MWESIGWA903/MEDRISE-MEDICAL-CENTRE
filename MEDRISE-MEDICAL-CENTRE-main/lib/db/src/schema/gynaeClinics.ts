import { pgTable, serial, integer, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const gynaeClinicsTable = pgTable("gynae_clinics", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  visitDate: text("visit_date").notNull(),
  visitType: text("visit_type").notNull(), // 'new', 'followup', 'emergency'
  chiefComplaint: text("chief_complaint"),
  historyOfPresentingIllness: text("history_of_presenting_illness"),
  menstrualHistory: text("menstrual_history"),
  lastMenstrualPeriod: text("last_menstrual_period"),
  menstrualCycle: text("menstrual_cycle"),
  menstrualDuration: text("menstrual_duration"),
  menstrualFlow: text("menstrual_flow"),
  dysmenorrhea: text("dysmenorrhea"),
  obstetricHistory: text("obstetric_history"),
  contraceptiveHistory: text("contraceptive_history"),
  currentContraceptive: text("current_contraceptive"),
  sexualHistory: text("sexual_history"),
  vaginalDischarge: text("vaginal_discharge"),
  vaginalItching: text("vaginal_itching"),
  vaginalBleeding: text("vaginal_bleeding"),
  abdominalPain: text("abdominal_pain"),
  pelvicPain: text("pelvic_pain"),
  urinarySymptoms: text("urinary_symptoms"),
  examinationFindings: text("examination_findings"),
  speculumExamination: text("speculum_examination"),
  bimanualExamination: text("bimanual_examination"),
  investigationsOrdered: text("investigations_ordered"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  prescriptions: text("prescriptions"),
  referral: text("referral"),
  followUpDate: text("follow_up_date"),
  notes: text("notes"),
  attendedBy: integer("attended_by").references(() => adminsTable.id),
  attendedByName: text("attended_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("gynae_clinics_patient_id_idx").on(t.patientId),
  index("gynae_clinics_visit_date_idx").on(t.visitDate),
  index("gynae_clinics_visit_type_idx").on(t.visitType),
]);

export type GynaeClinic = typeof gynaeClinicsTable.$inferSelect;
export type NewGynaeClinic = typeof gynaeClinicsTable.$inferInsert;
