import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const growthRecordsTable = pgTable("growth_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  date: text("date").notNull(),
  ageMonths: integer("age_months"),
  weight: text("weight"),
  height: text("height"),
  muac: text("muac"),
  headCircumference: text("head_circumference"),
  weightForAgeZ: text("weight_for_age_z"),
  heightForAgeZ: text("height_for_age_z"),
  bmi: text("bmi"),
  nutritionalStatus: text("nutritional_status"),
  oedema: text("oedema"),
  feedingAssessment: text("feeding_assessment"),
  notes: text("notes"),
  recordedById: integer("recorded_by_id").references(() => adminsTable.id),
  recordedByName: text("recorded_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GrowthRecord = typeof growthRecordsTable.$inferSelect;
export type NewGrowthRecord = typeof growthRecordsTable.$inferInsert;
