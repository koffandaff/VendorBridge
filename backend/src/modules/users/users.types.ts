import type { UserRole } from "@prisma/client";
import type { PaginationMeta } from "../../core/http/response.js";

export interface UserListItemDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQueryFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy: "createdAt" | "name" | "email";
  sortOrder: "asc" | "desc";
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  role?: UserRole;
}

export interface UpdateUserStatusInput {
  isActive: boolean;
}

export interface UserListResult {
  items: UserListItemDto[];
  pagination: PaginationMeta;
}
