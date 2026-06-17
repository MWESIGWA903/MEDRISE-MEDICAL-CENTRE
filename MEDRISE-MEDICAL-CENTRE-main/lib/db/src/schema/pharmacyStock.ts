import { pgTable, serial, integer, text, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const pharmacyStockTable = pgTable("pharmacy_stock", {
  id: serial("id").primaryKey(),
  drugName: text("drug_name").notNull(),
  genericName: text("generic_name"),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull().default("units"),
  reorderLevel: integer("reorder_level").notNull().default(10),
  expiryDate: text("expiry_date"),
  buyingPrice: numeric("buying_price", { precision: 12, scale: 2 }),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pharmacyDispensingsTable = pgTable("pharmacy_dispensings", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").references(() => pharmacyStockTable.id).notNull(),
  patientId: integer("patient_id").references(() => patientsTable.id),
  consultationId: integer("consultation_id"),
  quantity: integer("quantity").notNull(),
  dispensedBy: integer("dispensed_by").references(() => adminsTable.id),
  dispensedAt: timestamp("dispensed_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const pharmacyOrdersTable = pgTable("pharmacy_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  consultationId: integer("consultation_id"),
  drugName: text("drug_name").notNull(),
  dose: text("dose").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions").notNull(),
  prescribedBy: integer("prescribed_by").references(() => adminsTable.id),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("routine"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("pharmacy_orders_patient_id_idx").on(t.patientId),
  index("pharmacy_orders_status_idx").on(t.status),
]);

export type PharmacyStock = typeof pharmacyStockTable.$inferSelect;
export type PharmacyDispensing = typeof pharmacyDispensingsTable.$inferSelect;
export type PharmacyOrder = typeof pharmacyOrdersTable.$inferSelect;
