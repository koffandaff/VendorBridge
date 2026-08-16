import type { NotificationType } from "@prisma/client";
import type { PaginationMeta } from "../../core/http/response.js";

export interface NotificationListItemDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationQueryFilters {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

export interface NotificationListResult {
  items: NotificationListItemDto[];
  pagination: PaginationMeta;
  unreadCount: number;
}
