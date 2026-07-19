import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  dateOfBirth: text("date_of_birth"),
  age: integer("age"),
  ageMonths: integer("age_months"),
  ageWeeks: integer("age_weeks"),
  ageDays: integer("age_days"),
  gender: text("gender"),
  department: text("department"),
  address: text("address"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medicalNotes: text("medical_notes"),
  nextOfKinName: text("next_of_kin_name"),
  nextOfKinPhone: text("next_of_kin_phone"),
  nextOfKinRelationship: text("next_of_kin_relationship"),
  insuranceName: text("insurance_name"),
  insurancePolicyNumber: text("insurance_policy_number"),
  paymentMethod: text("payment_method"),
  // Additional Master Patient Record fields
  maritalStatus: text("marital_status"),
  occupation: text("occupation"),
  religion: text("religion"),
  nationality: text("nationality"),
  weight: text("weight"),
  height: text("height"),
  bmi: text("bmi"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  pregnancyStatus: text("pregnancy_status"),
  lastVisitDate: timestamp("last_visit_date"),
  lastVisitDepartment: text("last_visit_department"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("patients_phone_idx").on(t.phone),
  index("patients_full_name_idx").on(t.fullName),
  index("patients_date_of_birth_idx").on(t.dateOfBirth),
  index("patients_gender_idx").on(t.gender),
]);

export const insertPatientSchema = createInsertSchema(patientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = typeof patientsTable.$inferInsert;
export type Patient = typeof patientsTable.$inferSelect;
