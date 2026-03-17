import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const notificationTypeEnum = [
  "collaboration_request",
  "request_accepted",
  "request_rejected",
  "project_invite",
] as const;
export type NotificationType = typeof notificationTypeEnum[number];

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").$type<NotificationType>().notNull(),
  message: text("message").notNull(),
  relatedProjectId: integer("related_project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  relatedProjectTitle: text("related_project_title"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
