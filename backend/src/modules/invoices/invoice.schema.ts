import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const createInvoiceSchema = z.object({
  purchaseOrderId: z.string().uuid("Invalid purchase order ID format"),
  invoiceDate: z.coerce.date("Invalid invoice date").optional(),
  dueDate: z.coerce.date("Invalid due date"),
  notes: z.string().trim().max(1000).nullish(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
});

export const invoiceQuerySchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  vendorId: z.string().uuid("Invalid vendor ID format").optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "invoiceDate", "totalAmount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});