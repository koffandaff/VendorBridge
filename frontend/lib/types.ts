export type BackendRole = "ADMIN" | "PROCUREMENT_OFFICER" | "APPROVER" | "VENDOR";

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
}

export interface LoginResponse {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
}

export interface VendorCategory {
  id: string;
  name: string;
  description?: string | null;
}

export type VendorStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface VendorDto {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  status: VendorStatus;
  rating?: string | null;
  notes?: string | null;
  category: VendorCategory;
  contacts?: { id: string; name: string; email: string; phone: string; designation?: string | null; isPrimary: boolean }[];
}

export type RFQStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "UNDER_REVIEW"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type RFQItemType = "PRODUCT" | "SERVICE";

export interface RFQItemDto {
  id: string;
  rfqId: string;
  name: string;
  description?: string | null;
  itemType: RFQItemType;
  quantity: string;
  unit: string;
  estimatedUnitPrice?: string | null;
  notes?: string | null;
}

export interface RFQDto {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  status: RFQStatus;
  deadline: string;
  createdAt: string;
  items: RFQItemDto[];
  invitedVendors?: {
    id: string;
    status: string;
    vendor: { id: string; name: string; code: string };
  }[];
  quotations?: {
    id: string;
    quotationNumber: string;
    vendorId: string;
    status: string;
    totalAmount: string;
    submittedAt: string | null;
  }[];
  _count?: { items: number; invitedVendors: number; quotations: number };
}

export type QuotationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SELECTED"
  | "REJECTED"
  | "EXPIRED";

export interface QuotationItemDto {
  id: string;
  quotationId: string;
  rfqItemId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  notes?: string | null;
}

export interface QuotationDto {
  id: string;
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  status: QuotationStatus;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  deliveryDays: number;
  validUntil: string;
  notes: string;
  submittedAt?: string | null;
  createdAt: string;
  vendor: { id: string; name: string; code: string; rating?: string | null };
  rfq: { id: string; rfqNumber: string; title: string };
  items: QuotationItemDto[];
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "ACKNOWLEDGED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrderItemDto {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  quotationId: string;
  vendorId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  vendor: { id: string; name: string; code: string };
  quotation?: { id: string; quotationNumber: string };
  invoice?: { id: string; invoiceNumber: string; status: string } | null;
  items?: PurchaseOrderItemDto[];
  _count?: { items: number };
}

export type InvoiceStatus = "DRAFT" | "ISSUED" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItemDto {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  vendor: { id: string; name: string; code: string; address?: string | null; city?: string | null; state?: string | null; country: string; gstNumber?: string | null };
  purchaseOrder?: { id: string; poNumber: string; orderDate: string };
  items?: InvoiceItemDto[];
}

export interface AuditLogDto {
  id: string;
  userId: string;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface DashboardSummaryDto {
  users: { total: number; active: number };
  vendors: { total: number; byStatus: Record<VendorStatus, number> };
  categories: number;
  rfqs: { total: number; byStatus: Record<RFQStatus, number> };
  quotations: { total: number; byStatus: Record<QuotationStatus, number> };
  pendingApprovals: number;
  purchaseOrders: { total: number; totalSpend: string };
  invoices: { total: number; byStatus: Record<InvoiceStatus, number>; outstanding: string };
}

export interface DashboardTrendPoint {
  month: string;
  rfqs: number;
  purchaseOrders: number;
  invoices: number;
  spend: string;
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

export interface AnalyticsStatsDto {
  activeRfqs: number;
  pendingApprovals: number;
  posThisMonth: number;
  overdueInvoices: number;
}

export interface ReportsOverviewDto {
  spendingTrend: { name: string; spend: number }[];
  spendByCategory: { name: string; spend: number }[];
  topVendors: { name: string; spend: number }[];
  vendorStatusCounts: Record<string, number>;
  recentPos: {
    id: string;
    poNumber: string;
    vendor: string;
    amount: number;
    status: PurchaseOrderStatus;
    orderDate: string;
  }[];
}