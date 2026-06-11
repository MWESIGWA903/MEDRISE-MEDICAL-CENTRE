import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { maternityRecordsTable } from "./maternityRecords";
import { adminsTable } from "./admins";

export const deliveryRecordsTable = pgTable("delivery_records", {
  id: serial("id").primaryKey(),
  maternityRecordId: integer("maternity_record_id").notNull().references(() => maternityRecordsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  deliveryDate: text("delivery_date").notNull(),
  deliveryTime: text("delivery_time"),
  gestationalAge: integer("gestational_age"),
  deliveryMode: text("delivery_mode"),
  deliveryWard: text("delivery_ward"),
  babySex: text("baby_sex"),
  birthWeight: text("birth_weight"),
  apgar1: integer("apgar_1"),
  apgar5: integer("apgar_5"),
  apgar10: integer("apgar_10"),
  neonatalOutcome: text("neonatal_outcome"),
  neonatalResuscitation: boolean("neonatal_resuscitation").default(false),
  thirdStageManagement: text("third_stage_management"),
  placentaComplete: text("placenta_complete"),
  bloodLoss: text("blood_loss"),
  perinealTears: text("perineal_tears"),
  maternalOutcome: text("maternal_outcome"),
  complications: text("complications"),
  breastfeedingInitiated: text("breastfeeding_initiated"),
  vitaminKGiven: boolean("vitamin_k_given").default(false),
  eyeProphylaxis: boolean("eye_prophylaxis").default(false),
  attendantId: integer("attendant_id").references(() => adminsTable.id),
  attendantName: text("attendant_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DeliveryRecord = typeof deliveryRecordsTable.$inferSelect;
export type NewDeliveryRecord = typeof deliveryRecordsTable.$inferInsert;
