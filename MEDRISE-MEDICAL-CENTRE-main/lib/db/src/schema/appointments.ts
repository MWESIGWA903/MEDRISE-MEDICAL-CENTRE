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
  assignedStaffId: integer("assigned_staff_id"),
  assignedDoctorName: text("assigned_doctor_name"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  checkinTime: timestamp("checkin_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAppointment = typeof appointmentsTable.$inferInsert;
export type Appointment = typeof appointmentsTable.$inferSelect;
