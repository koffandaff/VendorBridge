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

export interface CreateQuotationItemInput {
  rfqItemId: string;
  unitPrice: number;
  deliveryDays?: number;
  notes?: string | null;
}

export interface CreateQuotationInput {
  rfqId: string;
  items: CreateQuotationItemInput[];
  taxPercentage?: number;
  notes?: string | null;
  validUntil?: Date;
  isDraft?: boolean;
}

export interface UpdateQuotationInput {
  items?: CreateQuotationItemInput[];
  taxPercentage?: number;
  notes?: string | null;
  validUntil?: Date;
  isDraft?: boolean;
}