import { Router } from "express";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import { AuditLogController } from "./audit-logs.controller.js";
import { auditLogQuerySchema } from "./audit-logs.schema.js";

export const auditLogsRouter: Router = Router();
const controller = new AuditLogController();

auditLogsRouter.get(
  "/",
  authenticate,
  requirePermission("auditLogs:view"),
  validateRequest({ query: auditLogQuerySchema }),
  controller.listAuditLogs
);