import { NotFoundError } from "../../core/errors/AppError.js";
import {
  NotificationRepository,
  type NotificationListItemRecord,
} from "./notifications.repository.js";
import type {
  NotificationListResult,
  NotificationQueryFilters,
} from "./notifications.types.js";

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository = new NotificationRepository()
  ) {}

  async listMine(userId: string, filters: NotificationQueryFilters): Promise<NotificationListResult> {
    const { items, totalItems } = await this.repository.listForUser(userId, filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const unreadCount = await this.repository.countUnread(userId);

    return {
      items,
      pagination: { page, limit, totalItems, totalPages },
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.repository.countUnread(userId);
    return { unreadCount };
  }

  async markRead(userId: string, id: string): Promise<NotificationListItemRecord> {
    const notification = await this.repository.findOwned(userId, id);
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (!notification.isRead) {
      await this.repository.markRead(userId, id);
    }
    return this.repository.findOwned(userId, id) as Promise<NotificationListItemRecord>;
  }

  async markAllRead(userId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await this.repository.markAllRead(userId);
    return { updatedCount };
  }
}