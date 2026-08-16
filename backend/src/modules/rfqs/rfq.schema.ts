import { z } from "zod";
import { RFQItemType, RFQStatus } from "@prisma/client";

export const rfqItemSchema = z.object({
  name: z.string().trim().min(2, "Item name must be at least 2 characters").max(200),
  description: z.string().trim().max(1000).nullish(),
  itemType: z.nativeEnum(RFQItemType),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(1e9),
  unit: z.string().trim().min(1, "Unit is required").max(50),
  estimatedUnitPrice: z.coerce.number().nonnegative().max(1e15).nullish(),
  notes: z.string().trim().max(500).nullish(),
});

export const createRfqSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(3, "Description must be at least 3 characters").max(2000),
  deadline: z.coerce.date("Invalid deadline"),
  createdById: z.string().uuid("Invalid user ID format"),
  items: z.array(rfqItemSchema).min(1, "At least one item is required").max(100),
  invitedVendorIds: z
    .array(z.string().uuid("Invalid vendor ID format"))
    .max(200)
    .optional(),
});

export const updateRfqSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(3).max(2000).optional(),
  deadline: z.coerce.date("Invalid deadline").optional(),
  items: z.array(rfqItemSchema).min(1, "At least one item is required").max(100).optional(),
  invitedVendorIds: z
    .array(z.string().uuid("Invalid vendor ID format"))
    .max(200)
    .optional(),
});

export const updateRfqStatusSchema = z.object({
  status: z.nativeEnum(RFQStatus),
});

export const rfqQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(RFQStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "deadline", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});