import { Router } from "express";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import { NotificationController } from "./notifications.controller.js";
import {
  notificationIdParamSchema,
  notificationQuerySchema,
} from "./notifications.schema.js";

export const notificationsRouter: Router = Router();
const controller = new NotificationController();

notificationsRouter.get(
  "/",
  authenticate,
  requirePermission("notifications:view"),
  validateRequest({ query: notificationQuerySchema }),
  controller.listMine
);

notificationsRouter.get(
  "/unread-count",
  authenticate,
  requirePermission("notifications:view"),
  controller.getUnreadCount
);

notificationsRouter.patch(
  "/:id/read",
  authenticate,
  requirePermission("notifications:view"),
  validateRequest({ params: notificationIdParamSchema }),
  controller.markRead
);

notificationsRouter.patch(
  "/read-all",
  authenticate,
  requirePermission("notifications:view"),
  controller.markAllRead
);