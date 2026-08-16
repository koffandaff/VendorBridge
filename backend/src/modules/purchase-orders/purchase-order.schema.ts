import { z } from "zod";
import { PurchaseOrderStatus } from "@prisma/client";

export const createPurchaseOrderSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID format"),
  orderDate: z.coerce.date("Invalid order date").optional(),
  expectedDeliveryDate: z.coerce.date("Invalid expected delivery date"),
  notes: z.string().trim().max(1000).nullish(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
});

export const purchaseOrderQuerySchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  vendorId: z.string().uuid("Invalid vendor ID format").optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "orderDate", "totalAmount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});