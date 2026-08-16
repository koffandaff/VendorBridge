import type { Request, Response, NextFunction } from "express";
import { ActivityService } from "./activity.service.js";
import { sendPaginated } from "../../core/http/response.js";
import type { ActivityQueryFilters } from "./activity.types.js";

export class ActivityController {
  constructor(private readonly service: ActivityService = new ActivityService()) {}

  listActivityLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as ActivityQueryFilters;
      const { items, pagination } = await this.service.listActivityLogs(filters);
      sendPaginated(res, items, pagination, "Activity logs retrieved successfully");
    } catch (error) {
      next(error);
    }
  };
}