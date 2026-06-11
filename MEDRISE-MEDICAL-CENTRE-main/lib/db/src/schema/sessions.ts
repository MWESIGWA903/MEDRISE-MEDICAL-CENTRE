import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  adminId: integer("admin_id").notNull().references(() => adminsTable.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
