import { Router } from "express";
import { AnalyticsController } from "./analytics.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";

export const analyticsRouter: Router = Router();
const controller = new AnalyticsController();

analyticsRouter.get(
  "/stats",
  authenticate,
  requirePermission("analytics:view"),
  controller.getStats
);

analyticsRouter.get(
  "/reports/overview",
  authenticate,
  requirePermission("analytics:view"),
  controller.getReportsOverview
);