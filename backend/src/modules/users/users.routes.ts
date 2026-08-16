import { Router } from "express";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import { UserController } from "./users.controller.js";
import {
  createUserSchema,
  resetPasswordSchema,
  userIdParamSchema,
  userQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "./users.schema.js";

export const usersRouter: Router = Router();
const controller = new UserController();

usersRouter.post(
  "/",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ body: createUserSchema }),
  controller.createUser
);

usersRouter.get(
  "/",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ query: userQuerySchema }),
  controller.listUsers
);

usersRouter.get(
  "/:id",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: userIdParamSchema }),
  controller.getUserById
);

usersRouter.patch(
  "/:id",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: userIdParamSchema, body: updateUserSchema }),
  controller.updateUser
);

usersRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: userIdParamSchema, body: updateUserStatusSchema }),
  controller.updateUserStatus
);

usersRouter.post(
  "/:id/resend-invite",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: userIdParamSchema }),
  controller.resendInvite
);

usersRouter.patch(
  "/:id/password",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: userIdParamSchema, body: resetPasswordSchema }),
  controller.resetPassword
);

usersRouter.delete(
  "/:id",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: userIdParamSchema }),
  controller.softDeleteUser
);