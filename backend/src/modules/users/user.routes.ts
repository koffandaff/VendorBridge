import { Router } from "express";
import { UserController } from "./user.controller.js";
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
  validateRequest({ body: createUserSchema }),
  controller.createUser
);

userRouter.get(
  "/",
  validateRequest({ query: userQuerySchema }),
  controller.listUsers
);

userRouter.get(
  "/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.getUserById
);

userRouter.put(
  "/:id",
  validateRequest({ params: uuidParamSchema, body: updateUserSchema }),
  controller.updateUser
);

userRouter.patch(
  "/:id/status",
  validateRequest({ params: uuidParamSchema, body: updateUserStatusSchema }),
  controller.updateUserStatus
);

userRouter.patch(
  "/:id/password",
  validateRequest({ params: uuidParamSchema, body: resetPasswordSchema }),
  controller.resetPassword
);

userRouter.delete(
  "/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.softDeleteUser
);
