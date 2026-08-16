import type { NextFunction, Request, Response } from "express";
import { sendPaginated } from "../../core/http/response.js";
import { AuditLogService } from "./audit-logs.service.js";
import type { AuditLogQueryFilters } from "./audit-logs.types.js";

export class AuditLogController {
  constructor(private readonly service: AuditLogService = new AuditLogService()) {}

  listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as Record<string, unknown>;
      const filters: AuditLogQueryFilters = {
        page: Number(query.page ?? 1),
        limit: Number(query.limit ?? 20),
      };

      if (typeof query.userId === "string" && query.userId) {
        filters.userId = query.userId;
      }
      if (typeof query.entityType === "string" && query.entityType) {
        filters.entityType = query.entityType;
      }
      if (typeof query.action === "string" && query.action) {
        filters.action = query.action;
      }
      if (typeof query.from === "string" && query.from) {
        filters.from = query.from;
      }
      if (typeof query.to === "string" && query.to) {
        filters.to = query.to;
      }

      const result = await this.service.list(filters);
      sendPaginated(res, result.items, result.pagination, "Audit logs retrieved successfully");
    } catch (error) {
      next(error);
    }
  };
}