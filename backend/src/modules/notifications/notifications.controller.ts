import type { NextFunction, Request, Response } from "express";
import { sendPaginated, sendSuccess } from "../../core/http/response.js";
import { NotificationService } from "./notifications.service.js";
import type { NotificationQueryFilters } from "./notifications.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

function toFilters(query: Record<string, unknown>): NotificationQueryFilters {
  const filters: NotificationQueryFilters = {
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 10),
  };

  if (typeof query.unread === "string") {
    filters.unreadOnly = query.unread === "true";
  }

  return filters;
}

export class NotificationController {
  constructor(private readonly service: NotificationService = new NotificationService()) {}

  listMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = toFilters(req.query as Record<string, unknown>);
      const result = await this.service.listMine(req.user!.id, filters);
      sendPaginated(res, result.items, result.pagination, "Notifications retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getUnreadCount(req.user!.id);
      sendSuccess(res, result, "Unread notification count retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await this.service.markRead(req.user!.id, getParam(req, "id"));
      sendSuccess(res, notification, "Notification marked as read");
    } catch (error) {
      next(error);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.markAllRead(req.user!.id);
      sendSuccess(res, result, "All notifications marked as read");
    } catch (error) {
      next(error);
    }
  };
}