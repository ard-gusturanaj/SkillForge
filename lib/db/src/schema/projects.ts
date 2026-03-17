import { pgTable, serial, text, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectStatusEnum = ["looking_for_team", "active", "completed"] as const;
export type ProjectStatus = typeof projectStatusEnum[number];

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  techStack: json("tech_stack").$type<string[]>().notNull().default([]),
  teamSize: integer("team_size").notNull().default(1),
  status: text("status").$type<ProjectStatus>().notNull().default("looking_for_team"),
  githubUrl: text("github_url"),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
