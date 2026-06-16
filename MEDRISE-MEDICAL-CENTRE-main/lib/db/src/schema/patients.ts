import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = typeof patientsTable.$inferInsert;
export type Patient = typeof patientsTable.$inferSelect;
