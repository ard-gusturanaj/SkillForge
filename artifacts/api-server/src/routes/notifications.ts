import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { Response } from "express";
import { getSingleParam, parsePositiveInt } from "../lib/params.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!))
      .orderBy(notificationsTable.createdAt);

    res.json(notifications.reverse());
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:notificationId/read", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parsePositiveInt(getSingleParam(req.params.notificationId));
    if (!notificationId) {
      res.status(400).json({ error: "Bad Request", message: "Invalid notificationId" });
      return;
    }

    const [notification] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, req.userId!)))
      .returning();

    if (!notification) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json(notification);
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/read-all", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, req.userId!));

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
