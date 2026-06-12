import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const triageTable = pgTable("triage", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  assignedNurseId: integer("assigned_nurse_id").references(() => adminsTable.id),
  assignedNurseName: text("assigned_nurse_name"),

  bloodPressure: text("blood_pressure"),
  pulseRate: text("pulse_rate"),
  respiratoryRate: text("respiratory_rate"),
  oxygenSaturation: text("oxygen_saturation"),
  temperature: text("temperature"),
  weight: text("weight"),
  height: text("height"),
  painScale: integer("pain_scale"),

  chiefComplaint: text("chief_complaint").notNull(),
  nursingAssessment: text("nursing_assessment"),
  interventionsPerformed: text("interventions_performed"),
  reassessmentNotes: text("reassessment_notes"),

  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("active"),
  isEmergency: boolean("is_emergency").notNull().default(false),

  triageTime: timestamp("triage_time").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTriageSchema = createInsertSchema(triageTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTriage = typeof triageTable.$inferInsert;
export type Triage = typeof triageTable.$inferSelect;
