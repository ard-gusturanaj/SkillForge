import { Router } from "express";
import { db } from "@workspace/db";
import { bookmarksTable, projectsTable, usersTable, projectMembersTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { Response } from "express";
import { getSingleParam, parsePositiveInt } from "../lib/params.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookmarks = await db
      .select({ projectId: bookmarksTable.projectId })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, req.userId!));

    const projectIds = bookmarks.map(b => b.projectId);
    if (projectIds.length === 0) {
      res.json([]);
      return;
    }

    const projects = await Promise.all(
      projectIds.map(async (pid) => {
        const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, pid)).limit(1);
        if (!project) return null;

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projectMembersTable)
          .where(eq(projectMembersTable.projectId, pid));

        const [owner] = await db
          .select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
          .from(usersTable).where(eq(usersTable.id, project.ownerId)).limit(1);

        return {
          id: project.id,
          title: project.title,
          description: project.description,
          techStack: project.techStack,
          teamSize: project.teamSize,
          status: project.status,
          githubUrl: project.githubUrl,
          ownerId: project.ownerId,
          ownerName: owner?.name || "",
          ownerAvatarUrl: owner?.avatarUrl || null,
          memberCount: count,
          isBookmarked: true,
          createdAt: project.createdAt,
        };
      })
    );

    res.json(projects.filter(Boolean));
  } catch (err) {
    console.error("Get bookmarks error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:projectId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parsePositiveInt(getSingleParam(req.params.projectId));
    if (!projectId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid projectId" });
      return;
    }

    const existing = await db
      .select()
      .from(bookmarksTable)
      .where(and(eq(bookmarksTable.userId, req.userId!), eq(bookmarksTable.projectId, projectId)))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "Already bookmarked" });
      return;
    }

    await db.insert(bookmarksTable).values({
      userId: req.userId!,
      projectId,
    });

    res.status(201).json({ message: "Project bookmarked" });
  } catch (err) {
    console.error("Add bookmark error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:projectId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parsePositiveInt(getSingleParam(req.params.projectId));
    if (!projectId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid projectId" });
      return;
    }

    await db.delete(bookmarksTable).where(
      and(eq(bookmarksTable.userId, req.userId!), eq(bookmarksTable.projectId, projectId))
    );

    res.json({ message: "Bookmark removed" });
  } catch (err) {
    console.error("Remove bookmark error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
