import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  age: integer("age"),
  sex: text("sex"),
  service: text("service").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  preferredDoctor: text("preferred_doctor"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // New fields for professional appointment management
  assignedStaffId: integer("assigned_staff_id"),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
  rescheduledFrom: text("rescheduled_from"), // JSON string with original date/time
  rescheduledAt: timestamp("rescheduled_at"),
  rescheduleReason: text("reschedule_reason"),
  notesHistory: text("notes_history"), // JSON string with note history
  statusHistory: text("status_history"), // JSON string with status change history
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAppointment = typeof appointmentsTable.$inferInsert;
export type Appointment = typeof appointmentsTable.$inferSelect;
