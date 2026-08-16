import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../core/http/response.js";
import { DashboardService } from "./dashboard.service.js";
import type { DashboardTrendFilters } from "./dashboard.types.js";

export class DashboardController {
  constructor(private readonly service: DashboardService = new DashboardService()) {}

  getSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.service.getSummary();
      sendSuccess(res, summary, "Dashboard summary retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = { months: Number(req.query.months ?? 6) } as DashboardTrendFilters;
      const trends = await this.service.getTrends(filters);
      sendSuccess(res, trends, "Dashboard trends retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getVendorPerformance = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const performance = await this.service.getVendorPerformance();
      sendSuccess(res, performance, "Vendor performance retrieved successfully");
    } catch (error) {
      next(error);
    }
  };
}