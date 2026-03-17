import { Router, Request } from "express";
import { db } from "@workspace/db";
import {
  projectsTable, usersTable, projectMembersTable, bookmarksTable
} from "@workspace/db/schema";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { Response } from "express";
import jwt from "jsonwebtoken";
import { getSingleParam, parsePositiveInt } from "../lib/params.js";

const JWT_SECRET = process.env.JWT_SECRET || "skillforge-secret-key-change-in-production";

function getUserIdFromRequest(req: Request): number | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return undefined;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch { return undefined; }
}

const router = Router();

async function buildProject(p: typeof projectsTable.$inferSelect, currentUserId?: number) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, p.id));

  const [owner] = await db.select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable).where(eq(usersTable.id, p.ownerId)).limit(1);

  let isBookmarked = false;
  if (currentUserId) {
    const bookmark = await db
      .select()
      .from(bookmarksTable)
      .where(and(eq(bookmarksTable.userId, currentUserId), eq(bookmarksTable.projectId, p.id)))
      .limit(1);
    isBookmarked = bookmark.length > 0;
  }

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    techStack: p.techStack,
    teamSize: p.teamSize,
    status: p.status,
    githubUrl: p.githubUrl,
    ownerId: p.ownerId,
    ownerName: owner?.name || "",
    ownerAvatarUrl: owner?.avatarUrl || null,
    memberCount: count,
    isBookmarked,
    createdAt: p.createdAt,
  };
}

router.get("/user/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await db.select().from(projectsTable).where(eq(projectsTable.ownerId, req.userId!));
    const result = await Promise.all(projects.map(p => buildProject(p, req.userId)));
    res.json(result);
  } catch (err) {
    console.error("Get my projects error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res: Response) => {
  try {
    const { search, tech, status, page = "1", limit = "12" } = req.query as Record<string, string>;
    const pageNum = parsePositiveInt(page) ?? 1;
    const limitNum = parsePositiveInt(limit) ?? 12;
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(projectsTable.title, `%${search}%`),
          ilike(projectsTable.description, `%${search}%`)
        )!
      );
    }
    if (tech) {
      conditions.push(sql`${projectsTable.techStack}::text ilike ${'%' + tech + '%'}`);
    }
    if (status) {
      conditions.push(eq(projectsTable.status, status as any));
    }

    const whereClause = conditions.length > 0
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectsTable)
      .where(whereClause);

    let q = db.select().from(projectsTable);
    if (whereClause) {
      q = q.where(whereClause) as typeof q;
    }

    const userId = getUserIdFromRequest(req);
    const projects = await q.limit(limitNum).offset(offset).orderBy(sql`${projectsTable.createdAt} desc`);
    const result = await Promise.all(projects.map(p => buildProject(p, userId)));

    res.json({
      projects: result,
      total: count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:projectId", async (req, res: Response) => {
  try {
    const projectId = parsePositiveInt(getSingleParam(req.params.projectId));
    if (!projectId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid projectId" });
      return;
    }
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
    if (!project) {
      res.status(404).json({ error: "Not Found", message: "Project not found" });
      return;
    }

    const currentUserId = (() => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) return undefined;
      try {
        const secret = JWT_SECRET;
        const payload = jwt.verify(auth.split(" ")[1], secret) as { userId: number };
        return payload.userId;
      } catch { return undefined; }
    })();

    const base = await buildProject(project, currentUserId);

    const members = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        githubUrl: usersTable.githubUrl,
        skills: usersTable.skills,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .innerJoin(projectMembersTable, eq(projectMembersTable.userId, usersTable.id))
      .where(eq(projectMembersTable.projectId, projectId));

    res.json({ ...base, members });
  } catch (err) {
    console.error("Get project by id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, techStack, teamSize, status, githubUrl } = req.body;

    if (!title || !description || !techStack || !teamSize || !status) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }

    const teamSizeNum = Number(teamSize);
    if (!Number.isInteger(teamSizeNum) || teamSizeNum <= 0) {
      res.status(400).json({ error: "Bad Request", message: "teamSize must be a positive integer" });
      return;
    }

    const [project] = await db.insert(projectsTable).values({
      title,
      description,
      techStack,
      teamSize: teamSizeNum,
      status,
      githubUrl: githubUrl || null,
      ownerId: req.userId!,
    }).returning();

    const result = await buildProject(project, req.userId);
    res.status(201).json(result);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:projectId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parsePositiveInt(getSingleParam(req.params.projectId));
    if (!projectId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid projectId" });
      return;
    }
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
    if (!project) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (project.ownerId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { title, description, techStack, teamSize, status, githubUrl } = req.body;
    const parsedTeamSize = teamSize !== undefined ? Number(teamSize) : undefined;
    if (parsedTeamSize !== undefined) {
      if (!Number.isInteger(parsedTeamSize) || parsedTeamSize <= 0) {
        res.status(400).json({ error: "Bad Request", message: "teamSize must be a positive integer" });
        return;
      }
    }

    const [updated] = await db.update(projectsTable).set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(techStack !== undefined && { techStack }),
      ...(parsedTeamSize !== undefined && { teamSize: parsedTeamSize }),
      ...(status !== undefined && { status }),
      ...(githubUrl !== undefined && { githubUrl }),
    }).where(eq(projectsTable.id, projectId)).returning();

    const result = await buildProject(updated, req.userId);
    res.json(result);
  } catch (err) {
    console.error("Update project error:", err);
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
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
    if (!project) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (project.ownerId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
