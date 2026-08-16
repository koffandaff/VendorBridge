import { UserRole } from "@prisma/client";
import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../config/constants.js";

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

export const userQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "name", "email", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    role: z.nativeEnum(UserRole),
    phone: z.string().trim().min(5).max(20).optional(),
    vendorId: z.string().uuid("Invalid vendor ID format").optional(),
  })
  .refine((data) => data.role === "VENDOR" || data.vendorId === undefined, {
    message: "vendorId can only be assigned to VENDOR users",
    path: ["vendorId"],
  });

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.union([z.string().trim().min(5).max(20), z.literal("")]).optional(),
    role: z.nativeEnum(UserRole).optional(),
    vendorId: z.union([z.string().uuid("Invalid vendor ID format"), z.literal(null)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});