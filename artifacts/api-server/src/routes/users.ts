import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, projectsTable, projectMembersTable } from "@workspace/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { Response } from "express";
import { getSingleParam, parsePositiveInt } from "../lib/params.js";

const router = Router();

router.get("/", async (req, res: Response) => {
  try {
    const { search, skill, page = "1", limit = "12" } = req.query as Record<string, string>;
    const pageNum = parsePositiveInt(page) ?? 1;
    const limitNum = parsePositiveInt(limit) ?? 12;
    const offset = (pageNum - 1) * limitNum;

    let query = db.select().from(usersTable);

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`)
        )!
      );
    }
    if (skill) {
      conditions.push(
        sql`${usersTable.skills}::text ilike ${'%' + skill + '%'}`
      );
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : or(...conditions)) : undefined);

    let usersQuery = db.select().from(usersTable);
    if (conditions.length > 0) {
      usersQuery = usersQuery.where(conditions.length === 1 ? conditions[0] : or(...conditions)) as typeof usersQuery;
    }
    const users = await usersQuery.limit(limitNum).offset(offset);

    res.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        githubUrl: u.githubUrl,
        skills: u.skills,
        createdAt: u.createdAt,
      })),
      total: count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:userId", async (req, res: Response) => {
  try {
    const userId = parsePositiveInt(getSingleParam(req.params.userId));
    if (!userId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid userId" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    const ownedProjects = await db.select({
      id: projectsTable.id,
      title: projectsTable.title,
      description: projectsTable.description,
      techStack: projectsTable.techStack,
      teamSize: projectsTable.teamSize,
      status: projectsTable.status,
      githubUrl: projectsTable.githubUrl,
      ownerId: projectsTable.ownerId,
      createdAt: projectsTable.createdAt,
    }).from(projectsTable).where(eq(projectsTable.ownerId, userId));

    const memberProjects = await db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        description: projectsTable.description,
        techStack: projectsTable.techStack,
        teamSize: projectsTable.teamSize,
        status: projectsTable.status,
        githubUrl: projectsTable.githubUrl,
        ownerId: projectsTable.ownerId,
        createdAt: projectsTable.createdAt,
      })
      .from(projectsTable)
      .innerJoin(projectMembersTable, eq(projectMembersTable.projectId, projectsTable.id))
      .where(eq(projectMembersTable.userId, userId));

    const allProjects = [...ownedProjects, ...memberProjects];
    const uniqueProjects = allProjects.filter(
      (p, i, a) => a.findIndex(x => x.id === p.id) === i
    );

    const projectsWithMeta = await Promise.all(uniqueProjects.map(async (p) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projectMembersTable)
        .where(eq(projectMembersTable.projectId, p.id));

      const [owner] = await db.select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
        .from(usersTable).where(eq(usersTable.id, p.ownerId)).limit(1);

      return {
        ...p,
        ownerName: owner?.name || "",
        ownerAvatarUrl: owner?.avatarUrl || null,
        memberCount: count,
        isBookmarked: false,
      };
    }));

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      githubUrl: user.githubUrl,
      skills: user.skills,
      createdAt: user.createdAt,
      projects: projectsWithMeta,
    });
  } catch (err) {
    console.error("Get user by id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/me/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, avatarUrl, githubUrl, skills } = req.body;

    const [user] = await db
      .update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(skills !== undefined && { skills }),
      })
      .where(eq(usersTable.id, req.userId!))
      .returning();

    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      githubUrl: user.githubUrl,
      skills: user.skills,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
