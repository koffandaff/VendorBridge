import type { PurchaseOrderStatus } from "@prisma/client";

export interface CreatePurchaseOrderInput {
  quotationId: string;
  orderDate?: Date;
  expectedDeliveryDate: Date;
  notes?: string | null;
}

export interface UpdatePurchaseOrderStatusInput {
  status: PurchaseOrderStatus;
}

export interface PurchaseOrderQueryFilters {
  status?: PurchaseOrderStatus;
  vendorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "orderDate" | "totalAmount";
  sortOrder?: "asc" | "desc";
}