import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { NotificationQueryFilters } from "./notifications.types.js";

export const notificationListItemSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  entityType: true,
  entityId: true,
  isRead: true,
  readAt: true,
  createdAt: true,
} as const;

export type NotificationListItemRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationListItemSelect;
}>;

export class NotificationRepository {
  async listForUser(
    userId: string,
    filters: NotificationQueryFilters
  ): Promise<{ items: NotificationListItemRecord[]; totalItems: number }> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(filters.unreadOnly ? { isRead: false } : {}),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        select: notificationListItemSelect,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, totalItems };
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async findOwned(userId: string, id: string): Promise<NotificationListItemRecord | null> {
    return prisma.notification.findFirst({
      where: { id, userId },
      select: notificationListItemSelect,
    });
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }
}