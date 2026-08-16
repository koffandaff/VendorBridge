import type { UserRole } from "@prisma/client";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
  vendorId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  role?: UserRole;
  vendorId?: string | null;
}

export interface UpdateUserStatusInput {
  isActive: boolean;
}

export interface ResetPasswordInput {
  newPassword: string;
}

export interface UserQueryFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "email" | "role";
  sortOrder?: "asc" | "desc";
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  vendorId: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
