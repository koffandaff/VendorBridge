import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const quotationQuerySchema = z.object({
  rfqId: z.string().uuid("Invalid RFQ ID format").optional(),
  vendorId: z.string().uuid("Invalid vendor ID format").optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "totalAmount", "deliveryDays"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const quotationCompareQuerySchema = z.object({
  rfqId: z.string().uuid("Invalid RFQ ID format"),
});

export const quotationItemSchema = z.object({
  rfqItemId: z.string().uuid("Invalid RFQ item ID format"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be zero or more").max(1e15),
  deliveryDays: z.coerce
    .number()
    .int("Delivery days must be a whole number")
    .nonnegative()
    .max(3650)
    .optional(),
  notes: z.string().trim().max(500).nullish(),
});

export const createQuotationSchema = z.object({
  rfqId: z.string().uuid("Invalid RFQ ID format"),
  items: z.array(quotationItemSchema).min(1, "At least one item is required").max(100),
  taxPercentage: z.coerce
    .number()
    .nonnegative("Tax percentage must be zero or more")
    .max(100, "Tax percentage cannot exceed 100")
    .optional(),
  notes: z.string().trim().max(2000).nullish(),
  validUntil: z.coerce.date("Invalid valid-until date").optional(),
  isDraft: z.boolean().optional(),
});

export const updateQuotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1, "At least one item is required").max(100).optional(),
  taxPercentage: z.coerce.number().nonnegative().max(100).optional(),
  notes: z.string().trim().max(2000).nullish(),
  validUntil: z.coerce.date("Invalid valid-until date").optional(),
  isDraft: z.boolean().optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});