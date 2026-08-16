import type { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../core/http/response.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  ResetPasswordInput,
  UserQueryFilters,
} from "./user.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class UserController {
  constructor(private readonly service: UserService = new UserService()) {}

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.createUser(req.body as CreateUserInput);
      sendCreated(res, user, "User created successfully");
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as UserQueryFilters;
      const { items, pagination } = await this.service.listUsers(filters);
      sendPaginated(res, items, pagination, "Users retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getUserById(getParam(req, "id"));
      sendSuccess(res, user, "User details retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.updateUser(
        getParam(req, "id"),
        req.body as UpdateUserInput
      );
      sendSuccess(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.updateUserStatus(
        getParam(req, "id"),
        req.body as UpdateUserStatusInput
      );
      sendSuccess(res, user, "User status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.resetPassword(
        getParam(req, "id"),
        req.body as ResetPasswordInput
      );
      sendSuccess(res, user, "User password reset successfully");
    } catch (error) {
      next(error);
    }
  };

  softDeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.softDeleteUser(getParam(req, "id"));
      sendSuccess(res, user, "User set to inactive (soft deleted)");
    } catch (error) {
      next(error);
    }
  };
}
