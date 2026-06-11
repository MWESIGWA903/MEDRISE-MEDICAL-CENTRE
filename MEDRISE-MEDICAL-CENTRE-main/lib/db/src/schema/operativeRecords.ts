import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { theatreBookingsTable } from "./theatreBookings";

export const operativeRecordsTable = pgTable("operative_records", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => theatreBookingsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  operationPerformed: text("operation_performed").notNull(),
  preOpDiagnosis: text("pre_op_diagnosis"),
  postOpDiagnosis: text("post_op_diagnosis"),
  procedureNotes: text("procedure_notes"),
  findings: text("findings"),
  complications: text("complications"),
  anaesthesiaType: text("anaesthesia_type"),
  anaesthesiaAgents: text("anaesthesia_agents"),
  bloodLossMl: text("blood_loss_ml"),
  bloodTransfusion: boolean("blood_transfusion").default(false),
  specimensSent: text("specimens_sent"),
  drainsInserted: text("drains_inserted"),
  closureMethod: text("closure_method"),
  actualStartTime: text("actual_start_time"),
  actualEndTime: text("actual_end_time"),
  surgeonName: text("surgeon_name"),
  assistantName: text("assistant_name"),
  anaesthetistName: text("anaesthetist_name"),
  swabCountCorrect: boolean("swab_count_correct").default(true),
  instrumentCountCorrect: boolean("instrument_count_correct").default(true),
  postOpInstructions: text("post_op_instructions"),
  postOpWard: text("post_op_ward"),
  condition: text("condition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OperativeRecord = typeof operativeRecordsTable.$inferSelect;
export type NewOperativeRecord = typeof operativeRecordsTable.$inferInsert;
