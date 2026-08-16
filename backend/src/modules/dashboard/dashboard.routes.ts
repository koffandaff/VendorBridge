import { Router } from "express";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import { DashboardController } from "./dashboard.controller.js";
import { dashboardTrendQuerySchema } from "./dashboard.schema.js";

export const dashboardRouter: Router = Router();
const controller = new DashboardController();

dashboardRouter.get(
  "/summary",
  authenticate,
  requirePermission("analytics:view"),
  controller.getSummary
);

dashboardRouter.get(
  "/trends",
  authenticate,
  requirePermission("analytics:view"),
  validateRequest({ query: dashboardTrendQuerySchema }),
  controller.getTrends
);

dashboardRouter.get(
  "/vendor-performance",
  authenticate,
  requirePermission("analytics:view"),
  controller.getVendorPerformance
);