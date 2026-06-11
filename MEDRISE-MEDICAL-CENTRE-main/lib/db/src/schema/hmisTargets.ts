import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const hmisTargetsTable = pgTable("hmis_targets", {
  id: serial("id").primaryKey(),
  metricKey: text("metric_key").notNull(),
  periodType: text("period_type").notNull().default("monthly"),
  targetValue: integer("target_value").notNull().default(0),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("hmis_targets_metric_period_unique").on(t.metricKey, t.periodType),
]);

export type HmisTarget = typeof hmisTargetsTable.$inferSelect;
