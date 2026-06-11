import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const imagingOrdersTable = pgTable("imaging_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  consultationId: integer("consultation_id"),
  queueEntryId: integer("queue_entry_id"),
  requestedBy: integer("requested_by"),
  modality: text("modality").notNull(),
  bodyPart: text("body_part"),
  clinicalIndication: text("clinical_indication"),
  priority: text("priority").notNull().default("routine"),
  status: text("status").notNull().default("requested"),
  findings: text("findings"),
  impression: text("impression"),
  reportedBy: integer("reported_by"),
  notes: text("notes"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type ImagingOrder = typeof imagingOrdersTable.$inferSelect;
