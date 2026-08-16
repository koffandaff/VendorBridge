import { z } from "zod";
import { UserRole } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.nativeEnum(UserRole),
  phone: z.string().trim().min(5).max(20).nullish(),
  vendorId: z.string().uuid("Invalid vendor ID format").nullish(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  phone: z.string().trim().min(5).max(20).nullish(),
  role: z.nativeEnum(UserRole).optional(),
  vendorId: z.string().uuid("Invalid vendor ID format").nullish(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "name", "email", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});
