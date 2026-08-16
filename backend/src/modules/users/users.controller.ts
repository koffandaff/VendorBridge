import type { NextFunction, Request, Response } from "express";
import { sendPaginated, sendSuccess } from "../../core/http/response.js";
import { UserService } from "./users.service.js";
import type {
  UpdateUserInput,
  UpdateUserStatusInput,
  UserQueryFilters,
} from "./users.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

function toFilters(query: Record<string, unknown>): UserQueryFilters {
  const filters: UserQueryFilters = {
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 10),
    sortBy: (query.sortBy as UserQueryFilters["sortBy"]) ?? "createdAt",
    sortOrder: (query.sortOrder as UserQueryFilters["sortOrder"]) ?? "desc",
  };

  if (typeof query.search === "string" && query.search.trim()) {
    filters.search = query.search.trim();
  }
  if (typeof query.role === "string" && query.role) {
    filters.role = query.role as UserQueryFilters["role"];
  }
  if (typeof query.isActive === "string") {
    filters.isActive = query.isActive === "true";
  }

  return filters;
}

export class UserController {
  constructor(private readonly service: UserService = new UserService()) {}

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = toFilters(req.query as Record<string, unknown>);
      const { items, pagination } = await this.service.listUsers(filters);
      sendPaginated(res, items, pagination, "Users retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getUserById(getParam(req, "id"));
      sendSuccess(res, user, "User retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.updateUser(getParam(req, "id"), req.body as UpdateUserInput, {
        id: req.user!.id,
      });
      sendSuccess(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.updateUserStatus(
        getParam(req, "id"),
        req.body as UpdateUserStatusInput,
        { id: req.user!.id }
      );
      sendSuccess(res, user, "User status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  resendInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.resendInvite(getParam(req, "id"), {
        id: req.user!.id,
      });
      sendSuccess(res, user, "Invitation email sent successfully");
    } catch (error) {
      next(error);
    }
  };
}