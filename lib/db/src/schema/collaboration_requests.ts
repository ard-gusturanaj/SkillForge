import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const collabStatusEnum = ["pending", "accepted", "rejected"] as const;
export type CollabStatus = typeof collabStatusEnum[number];

export const collaborationRequestsTable = pgTable("collaboration_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  requesterId: integer("requester_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").$type<CollabStatus>().notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCollabRequestSchema = createInsertSchema(collaborationRequestsTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertCollabRequest = z.infer<typeof insertCollabRequestSchema>;
export type CollaborationRequest = typeof collaborationRequestsTable.$inferSelect;
