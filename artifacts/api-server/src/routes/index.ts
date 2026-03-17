import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import projectsRouter from "./projects.js";
import collaborationsRouter from "./collaborations.js";
import notificationsRouter from "./notifications.js";
import bookmarksRouter from "./bookmarks.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/projects", projectsRouter);
router.use("/collaborations", collaborationsRouter);
router.use("/notifications", notificationsRouter);
router.use("/bookmarks", bookmarksRouter);

export default router;
