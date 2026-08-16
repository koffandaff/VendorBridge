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

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});