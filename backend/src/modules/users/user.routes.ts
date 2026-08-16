import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  resetPasswordSchema,
  userQuerySchema,
  uuidParamSchema,
} from "./user.schema.js";

export const userRouter: Router = Router();
const controller = new UserController();

userRouter.post(
  "/",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ body: createUserSchema }),
  controller.createUser
);

userRouter.get(
  "/",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ query: userQuerySchema }),
  controller.listUsers
);

userRouter.get(
  "/:id",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: uuidParamSchema }),
  controller.getUserById
);

userRouter.put(
  "/:id",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: uuidParamSchema, body: updateUserSchema }),
  controller.updateUser
);

userRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: uuidParamSchema, body: updateUserStatusSchema }),
  controller.updateUserStatus
);

userRouter.patch(
  "/:id/password",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: uuidParamSchema, body: resetPasswordSchema }),
  controller.resetPassword
);

userRouter.delete(
  "/:id",
  authenticate,
  requirePermission("users:manage"),
  validateRequest({ params: uuidParamSchema }),
  controller.softDeleteUser
);
