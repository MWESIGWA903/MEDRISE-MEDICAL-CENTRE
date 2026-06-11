import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";

export const loginHistoryTable = pgTable("login_history", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminsTable.id, { onDelete: "set null" }),
  username: text("username").notNull(),
  success: boolean("success").notNull().default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type LoginHistory = typeof loginHistoryTable.$inferSelect;
