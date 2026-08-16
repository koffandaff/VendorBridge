import type { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service.js";
import { sendSuccess } from "../../core/http/response.js";

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService = new AnalyticsService()) {}

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      sendSuccess(res, stats, "Dashboard statistics retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getReportsOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await this.service.getReportsOverview();
      sendSuccess(res, overview, "Reports overview retrieved successfully");
    } catch (error) {
      next(error);
    }
  };
}