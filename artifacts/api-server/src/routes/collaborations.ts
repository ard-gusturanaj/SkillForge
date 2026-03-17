import { Router } from "express";
import { db } from "@workspace/db";
import {
  collaborationRequestsTable,
  projectsTable,
  usersTable,
  projectMembersTable,
  notificationsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { Response } from "express";
import { getSingleParam, parsePositiveInt } from "../lib/params.js";

const router = Router();

router.post("/request", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, message } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "Bad Request", message: "projectId is required" });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
    if (!project) {
      res.status(404).json({ error: "Not Found", message: "Project not found" });
      return;
    }

    if (project.ownerId === req.userId) {
      res.status(400).json({ error: "Bad Request", message: "Cannot request to join your own project" });
      return;
    }

    const existingMember = await db
      .select()
      .from(projectMembersTable)
      .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, req.userId!)))
      .limit(1);

    if (existingMember.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "Already a member of this project" });
      return;
    }

    const existingRequest = await db
      .select()
      .from(collaborationRequestsTable)
      .where(and(
        eq(collaborationRequestsTable.projectId, projectId),
        eq(collaborationRequestsTable.requesterId, req.userId!),
        eq(collaborationRequestsTable.status, "pending")
      ))
      .limit(1);

    if (existingRequest.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "Already sent a request to this project" });
      return;
    }

    const [request] = await db.insert(collaborationRequestsTable).values({
      projectId,
      requesterId: req.userId!,
      message: message || null,
    }).returning();

    const [requester] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    await db.insert(notificationsTable).values({
      userId: project.ownerId,
      type: "collaboration_request",
      message: `${requester?.name || "Someone"} wants to join your project "${project.title}"`,
      relatedProjectId: project.id,
      relatedProjectTitle: project.title,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("Create collab request error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/requests/incoming", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const myProjects = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.ownerId, req.userId!));
    const myProjectIds = myProjects.map(p => p.id);

    if (myProjectIds.length === 0) {
      res.json([]);
      return;
    }

    const requests = await db
      .select({
        id: collaborationRequestsTable.id,
        projectId: collaborationRequestsTable.projectId,
        requesterId: collaborationRequestsTable.requesterId,
        message: collaborationRequestsTable.message,
        status: collaborationRequestsTable.status,
        createdAt: collaborationRequestsTable.createdAt,
      })
      .from(collaborationRequestsTable)
      .where(eq(collaborationRequestsTable.status, "pending"));

    const filtered = requests.filter(r => myProjectIds.includes(r.projectId));

    const result = await Promise.all(filtered.map(async r => {
      const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, r.requesterId)).limit(1);
      const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, r.projectId)).limit(1);
      return {
        ...r,
        projectTitle: project?.title || "",
        requesterName: requester?.name || "",
        requesterAvatarUrl: requester?.avatarUrl || null,
        requesterSkills: requester?.skills || [],
      };
    }));

    res.json(result);
  } catch (err) {
    console.error("Get incoming requests error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/requests/outgoing", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await db
      .select()
      .from(collaborationRequestsTable)
      .where(eq(collaborationRequestsTable.requesterId, req.userId!));

    const result = await Promise.all(requests.map(async r => {
      const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, r.projectId)).limit(1);
      const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, project?.ownerId || 0)).limit(1);
      const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, r.requesterId)).limit(1);
      return {
        ...r,
        projectTitle: project?.title || "",
        requesterName: requester?.name || "",
        requesterAvatarUrl: requester?.avatarUrl || null,
        requesterSkills: requester?.skills || [],
      };
    }));

    res.json(result);
  } catch (err) {
    console.error("Get outgoing requests error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/requests/:requestId/respond", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parsePositiveInt(getSingleParam(req.params.requestId));
    if (!requestId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid requestId" });
      return;
    }
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      res.status(400).json({ error: "Bad Request", message: "action must be accept or reject" });
      return;
    }

    const [request] = await db.select().from(collaborationRequestsTable).where(eq(collaborationRequestsTable.id, requestId)).limit(1);
    if (!request) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, request.projectId)).limit(1);
    if (!project || project.ownerId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";
    const [updated] = await db
      .update(collaborationRequestsTable)
      .set({ status: newStatus })
      .where(eq(collaborationRequestsTable.id, requestId))
      .returning();

    if (action === "accept") {
      const existing = await db
        .select()
        .from(projectMembersTable)
        .where(and(eq(projectMembersTable.projectId, request.projectId), eq(projectMembersTable.userId, request.requesterId)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(projectMembersTable).values({
          projectId: request.projectId,
          userId: request.requesterId,
        });
      }
    }

    await db.insert(notificationsTable).values({
      userId: request.requesterId,
      type: action === "accept" ? "request_accepted" : "request_rejected",
      message: action === "accept"
        ? `Your request to join "${project.title}" was accepted!`
        : `Your request to join "${project.title}" was rejected.`,
      relatedProjectId: project.id,
      relatedProjectTitle: project.title,
    });

    res.json(updated);
  } catch (err) {
    console.error("Respond to request error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
