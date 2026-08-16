import { UserRole } from "@prisma/client";
import { z } from "zod";

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

export const userQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.union([z.string().trim().min(5).max(20), z.literal("")]).optional(),
    role: z.nativeEnum(UserRole).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});