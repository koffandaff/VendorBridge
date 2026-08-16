import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { AuditLogQueryFilters } from "./audit-logs.types.js";

export const auditLogListItemSelect = {
  id: true,
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  oldValue: true,
  newValue: true,
  metadata: true,
  ipAddress: true,
  createdAt: true,
  user: { select: { email: true } },
} as const;

export type AuditLogListItemRecord = Prisma.AuditLogGetPayload<{
  select: typeof auditLogListItemSelect;
}>;

export class AuditLogRepository {
  async list(filters: AuditLogQueryFilters): Promise<{
    items: AuditLogListItemRecord[];
    totalItems: number;
  }> {
    const conditions: Prisma.AuditLogWhereInput[] = [];

    if (filters.userId) {
      conditions.push({ userId: filters.userId });
    }
    if (filters.entityType) {
      conditions.push({ entityType: filters.entityType });
    }
    if (filters.action) {
      conditions.push({ action: { contains: filters.action, mode: "insensitive" } });
    }
    if (filters.from) {
      conditions.push({ createdAt: { gte: new Date(filters.from) } });
    }
    if (filters.to) {
      conditions.push({ createdAt: { lte: new Date(filters.to) } });
    }

    const where: Prisma.AuditLogWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [items, totalItems] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        select: auditLogListItemSelect,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, totalItems };
  }
}