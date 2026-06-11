import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const theatreBookingsTable = pgTable("theatre_bookings", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  surgeryType: text("surgery_type").notNull(),
  surgeonName: text("surgeon_name"),
  surgeonId: integer("surgeon_id").references(() => adminsTable.id),
  anaesthetistName: text("anaesthetist_name"),
  scrubNurseName: text("scrub_nurse_name"),
  circulatingNurseName: text("circulating_nurse_name"),
  bookedDate: text("booked_date").notNull(),
  bookedTime: text("booked_time"),
  estimatedDuration: integer("estimated_duration"),
  theatreRoom: text("theatre_room").default("Main Theatre"),
  priority: text("priority").notNull().default("elective"),
  status: text("status").notNull().default("scheduled"),
  diagnosis: text("diagnosis"),
  preOpNotes: text("pre_op_notes"),
  consentObtained: boolean("consent_obtained").default(false),
  npoStatus: boolean("npo_status").default(false),
  bloodAvailable: text("blood_available"),
  createdById: integer("created_by_id").references(() => adminsTable.id),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TheatreBooking = typeof theatreBookingsTable.$inferSelect;
export type NewTheatreBooking = typeof theatreBookingsTable.$inferInsert;
