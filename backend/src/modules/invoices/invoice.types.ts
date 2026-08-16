import type { InvoiceStatus } from "@prisma/client";

export interface CreateInvoiceInput {
  purchaseOrderId: string;
  invoiceDate?: Date;
  dueDate: Date;
  notes?: string | null;
}

export interface UpdateInvoiceStatusInput {
  status: InvoiceStatus;
}

export interface InvoiceQueryFilters {
  status?: InvoiceStatus;
  vendorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "invoiceDate" | "totalAmount";
  sortOrder?: "asc" | "desc";
}