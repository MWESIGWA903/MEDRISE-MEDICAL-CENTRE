import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id"),
  actorName: text("actor_name"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: text("details"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("audit_logs_actor_id_idx").on(t.actorId),
  index("audit_logs_created_at_idx").on(t.createdAt),
  index("audit_logs_entity_idx").on(t.entityType, t.entityId),
]);

export type AuditLog = typeof auditLogsTable.$inferSelect;
