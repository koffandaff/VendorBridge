import type {
  InvoiceStatus,
  QuotationStatus,
  RFQStatus,
  VendorStatus,
} from "@prisma/client";

export interface DashboardSummaryDto {
  users: {
    total: number;
    active: number;
  };
  vendors: {
    total: number;
    byStatus: Record<VendorStatus, number>;
  };
  categories: number;
  rfqs: {
    total: number;
    byStatus: Record<RFQStatus, number>;
  };
  quotations: {
    total: number;
    byStatus: Record<QuotationStatus, number>;
  };
  pendingApprovals: number;
  purchaseOrders: {
    total: number;
    totalSpend: string;
  };
  invoices: {
    total: number;
    byStatus: Record<InvoiceStatus, number>;
    outstanding: string;
  };
}

export interface DashboardTrendPoint {
  month: string;
  rfqs: number;
  purchaseOrders: number;
  invoices: number;
  spend: string;
}

export interface DashboardTrendFilters {
  months: number;
}

export interface VendorPerformanceDto {
  vendorId: string;
  name: string;
  code: string;
  status: VendorStatus;
  rating: string | null;
  orderCount: number;
  totalSpend: string;
}