import { Router } from "express";
import { ActivityController } from "./activity.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import { activityQuerySchema } from "./activity.schema.js";

export const activityRouter: Router = Router();
const controller = new ActivityController();

activityRouter.get(
  "/",
  authenticate,
  requirePermission("activity:view"),
  validateRequest({ query: activityQuerySchema }),
  controller.listActivityLogs
);