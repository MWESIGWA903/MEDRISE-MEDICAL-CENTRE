import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const maternityRecordsTable = pgTable("maternity_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  gravida: integer("gravida").default(1),
  para: integer("para").default(0),
  lmp: text("lmp"),
  edd: text("edd"),
  gestationalAgeAtBooking: integer("gestational_age_at_booking"),
  ageAtBooking: integer("age_at_booking"),
  bookingWeight: text("booking_weight"),
  bookingBp: text("booking_bp"),
  bloodGroup: text("blood_group"),
  rhesus: text("rhesus"),
  hivStatus: text("hiv_status"),
  tbStatus: text("tb_status"),
  syphilisStatus: text("syphilis_status"),
  hepatitisBStatus: text("hepatitis_b_status"),
  riskFactors: text("risk_factors"),
  isHighRisk: boolean("is_high_risk").default(false),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  attendedBy: integer("attended_by").references(() => adminsTable.id),
  attendedByName: text("attended_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MaternityRecord = typeof maternityRecordsTable.$inferSelect;
export type NewMaternityRecord = typeof maternityRecordsTable.$inferInsert;
