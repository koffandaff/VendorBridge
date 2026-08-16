import type { PaginationMeta } from "../../core/http/response.js";

export interface AuditLogListItemDto {
  id: string;
  userId: string;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: Date;
}

export interface AuditLogQueryFilters {
  userId?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface AuditLogListResult {
  items: AuditLogListItemDto[];
  pagination: PaginationMeta;
}