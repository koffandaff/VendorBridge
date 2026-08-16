import { AuditLogRepository } from "./audit-logs.repository.js";
import type { AuditLogListResult, AuditLogQueryFilters } from "./audit-logs.types.js";

export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository = new AuditLogRepository()) {}

  async list(filters: AuditLogQueryFilters): Promise<AuditLogListResult> {
    const { items, totalItems } = await this.repository.list(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const dtoItems = items.map((item) => ({
      id: item.id,
      userId: item.userId,
      userEmail: item.user.email,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      oldValue: item.oldValue,
      newValue: item.newValue,
      metadata: item.metadata,
      ipAddress: item.ipAddress,
      createdAt: item.createdAt,
    }));

    return {
      items: dtoItems,
      pagination: { page, limit, totalItems, totalPages },
    };
  }
}