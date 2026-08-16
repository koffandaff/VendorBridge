import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import type { ActivityQueryFilters } from "./activity.types.js";

export class ActivityRepository {
  async list(filters: ActivityQueryFilters) {
    const { entityType, action, page = 1, limit = 20 } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, totalItems };
  }
}