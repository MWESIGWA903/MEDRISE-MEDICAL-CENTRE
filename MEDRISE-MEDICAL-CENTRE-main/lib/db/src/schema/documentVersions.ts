import { pgTable, serial, integer, text, timestamp, json, index } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";
import { patientsTable } from "./patients";

export const documentVersionsTable = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(), // consultation, prescription, referral, lab_request, imaging_request, theatre_booking, admission, nursing_note, progress_note, discharge_form, death_notification, medical_certificate, sick_leave_form
  documentId: integer("document_id").notNull(), // ID of the original document
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  version: integer("version").notNull().default(1),
  content: json("content").notNull(), // Full document content as JSON
  changeReason: text("change_reason"),
  createdById: integer("created_by_id").references(() => adminsTable.id),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("document_versions_document_id_idx").on(t.documentId),
  index("document_versions_document_type_idx").on(t.documentType),
  index("document_versions_patient_id_idx").on(t.patientId),
]);

export type DocumentVersion = typeof documentVersionsTable.$inferSelect;
export type NewDocumentVersion = typeof documentVersionsTable.$inferInsert;
