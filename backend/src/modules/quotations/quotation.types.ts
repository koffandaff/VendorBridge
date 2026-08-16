import type { QuotationStatus } from "@prisma/client";

export interface QuotationQueryFilters {
  rfqId?: string;
  vendorId?: string;
  status?: QuotationStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "totalAmount" | "deliveryDays";
  sortOrder?: "asc" | "desc";
}