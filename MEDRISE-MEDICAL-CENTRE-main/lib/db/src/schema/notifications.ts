import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  severity: text("severity").notNull().default("info"),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationDismissalsTable = pgTable("notification_dismissals", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id")
    .references(() => notificationsTable.id, { onDelete: "cascade" })
    .notNull(),
  adminId: integer("admin_id")
    .references(() => adminsTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NotificationDismissal = typeof notificationDismissalsTable.$inferSelect;
