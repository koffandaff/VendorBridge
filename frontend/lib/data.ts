import { api, toQueryString } from "./api";
import { addDays, formatCurrencyCompact, formatDate, toNumber, toIsoDate } from "./format";
import type {
  AnalyticsStatsDto,
  AuditLogDto,
  DashboardSummaryDto,
  DashboardTrendPoint,
  InvoiceDto,
  PurchaseOrderDto,
  QuotationDto,
  ReportsOverviewDto,
  RFQDto,
  VendorDto,
  VendorPerformanceDto,
} from "./types";

export interface DashboardStats {
  activeRfqs: number;
  pendingApprovals: number;
  posThisMonth: string;
  overdueInvoices: number;
}

export interface RecentPO {
  id: string;
  vendor: string;
  amount: string;
  status: "Approved" | "Pending" | "Draft";
}

export interface ChartDataPoint {
  name: string;
  spend: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNumber: string;
  contactNo: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  status: "Active" | "Pending" | "Blocked";
  rawStatus: string;
}

export type RFQStatus = "Draft" | "Sent" | "Quotes Received" | "Closed";

export interface RFQItem {
  id: string;
  item: string;
  qty: number;
  category: string;
}

export interface RFQ {
  id: string;
  number: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  vendorsAssignedCount: number;
  quotesReceivedCount: number;
  status: RFQStatus;
  rawStatus: string;
  items: RFQItem[];
}

export type QuotationStatus = "Pending Review" | "Accepted" | "Rejected" | "Draft";

export interface Quotation {
  id: string;
  rfqId: string;
  rfqTitle: string;
  vendorName: string;
  submittedAt: string;
  grandTotal: number;
  status: QuotationStatus;
  rawStatus: string;
  quotationNumber: string;
  deliveryDays: number;
  validUntil: string;
  notes: string;
  vendorRating?: number | null;
}

const VENDOR_STATUS_LABEL: Record<string, "Active" | "Pending" | "Blocked"> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  INACTIVE: "Blocked",
  SUSPENDED: "Blocked",
};

const RFQ_STATUS_LABEL: Record<string, RFQStatus> = {
  DRAFT: "Draft",
  OPEN: "Sent",
  UNDER_REVIEW: "Quotes Received",
  AWAITING_APPROVAL: "Quotes Received",
  APPROVED: "Quotes Received",
  CLOSED: "Closed",
  REJECTED: "Closed",
  CANCELLED: "Closed",
};

const QUOTATION_STATUS_LABEL: Record<string, QuotationStatus> = {
  DRAFT: "Draft",
  SUBMITTED: "Pending Review",
  UNDER_REVIEW: "Pending Review",
  SELECTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Rejected",
};

const ITEM_TYPE_LABEL: Record<string, string> = {
  PRODUCT: "Product",
  SERVICE: "Service",
};

function mapVendor(vendor: VendorDto): Vendor {
  const contact = vendor.contacts?.[0];
  return {
    id: vendor.id,
    name: vendor.name,
    category: vendor.category?.name ?? "Uncategorized",
    gstNumber: vendor.gstNumber ?? "—",
    contactNo: vendor.phone,
    contactPerson: contact?.name,
    email: vendor.email,
    address: [vendor.address, vendor.city, vendor.state, vendor.country].filter(Boolean).join(", "),
    status: VENDOR_STATUS_LABEL[vendor.status] ?? "Pending",
    rawStatus: vendor.status,
  };
}

function mapRfq(rfq: RFQDto): RFQ {
  return {
    id: rfq.id,
    number: rfq.rfqNumber,
    title: rfq.title,
    description: rfq.description,
    category: ITEM_TYPE_LABEL[rfq.items[0]?.itemType ?? "PRODUCT"] ?? "Product",
    deadline: formatDate(rfq.deadline),
    vendorsAssignedCount: rfq._count?.invitedVendors ?? rfq.invitedVendors?.length ?? 0,
    quotesReceivedCount:
      rfq._count?.quotations ?? rfq.quotations?.filter((q) => q.status !== "DRAFT").length ?? 0,
    status: RFQ_STATUS_LABEL[rfq.status] ?? "Draft",
    rawStatus: rfq.status,
    items: rfq.items.map((item) => ({
      id: item.id,
      item: item.name,
      qty: toNumber(item.quantity),
      category: ITEM_TYPE_LABEL[item.itemType] ?? item.itemType,
    })),
  };
}

function mapQuotation(quotation: QuotationDto): Quotation {
  return {
    id: quotation.id,
    rfqId: quotation.rfqId,
    rfqTitle: quotation.rfq?.title ?? "—",
    vendorName: quotation.vendor?.name ?? "—",
    submittedAt: quotation.submittedAt ? formatDate(quotation.submittedAt) : "—",
    grandTotal: toNumber(quotation.totalAmount),
    status: QUOTATION_STATUS_LABEL[quotation.status] ?? "Pending Review",
    rawStatus: quotation.status,
    quotationNumber: quotation.quotationNumber,
    deliveryDays: quotation.deliveryDays,
    validUntil: formatDate(quotation.validUntil),
    notes: quotation.notes ?? "",
    vendorRating: quotation.vendor?.rating !== undefined && quotation.vendor?.rating !== null
      ? toNumber(quotation.vendor.rating)
      : null,
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [summary, trends] = await Promise.all([
    api.get<DashboardSummaryDto>("/dashboard/summary"),
    api.get<DashboardTrendPoint[]>(`/dashboard/trends${toQueryString({ months: 2 })}`),
  ]);
  const lastMonth = trends[trends.length - 1];
  return {
    activeRfqs: summary.rfqs.byStatus.OPEN ?? 0,
    pendingApprovals: summary.pendingApprovals,
    posThisMonth: formatCurrencyCompact(lastMonth?.purchaseOrders ?? 0),
    overdueInvoices: summary.invoices.byStatus.OVERDUE ?? 0,
  };
}

export async function fetchRecentPOs(): Promise<RecentPO[]> {
  const { items } = await api.get<{ items: PurchaseOrderDto[] }>(
    `/purchase-orders${toQueryString({ limit: 5 })}`
  );
  return items.map((po) => {
    const status: RecentPO["status"] =
      po.status === "DRAFT" ? "Draft" : po.status === "PENDING_APPROVAL" ? "Pending" : "Approved";
    return {
      id: po.poNumber,
      vendor: po.vendor?.name ?? "—",
      amount: formatCurrencyCompact(po.totalAmount),
      status,
    };
  });
}

export async function fetchSpendingTrends(): Promise<ChartDataPoint[]> {
  const trends = await api.get<DashboardTrendPoint[]>(
    `/dashboard/trends${toQueryString({ months: 6 })}`
  );
  return trends.map((point) => ({ name: point.month, spend: Number(point.spend) }));
}

export async function fetchVendors(): Promise<Vendor[]> {
  const { items } = await api.get<{ items: VendorDto[] }>(
    `/vendors${toQueryString({ limit: 100 })}`
  );
  return items.map(mapVendor);
}

export async function fetchVendorById(id: string): Promise<Vendor> {
  const vendor = await api.get<VendorDto>(`/vendors/${id}`);
  return mapVendor(vendor);
}

export async function fetchVendorCategories(): Promise<{ id: string; name: string }[]> {
  const categories = await api.get<{ id: string; name: string; description?: string | null }[]>(
    "/vendors/categories"
  );
  return categories;
}

export async function createVendor(input: {
  name: string;
  categoryId: string;
  email: string;
  phone: string;
  gstNumber?: string;
  address?: string;
}): Promise<VendorDto> {
  return api.post<VendorDto>("/vendors", {
    name: input.name,
    categoryId: input.categoryId,
    email: input.email,
    phone: input.phone,
    gstNumber: input.gstNumber,
    address: input.address,
    city: undefined,
    state: undefined,
    postalCode: undefined,
    country: "IN",
  });
}

export async function fetchRFQs(): Promise<RFQ[]> {
  const { items } = await api.get<{ items: RFQDto[] }>(`/rfqs${toQueryString({ limit: 100 })}`);
  return items.map(mapRfq);
}

export async function fetchRFQById(id: string): Promise<RFQ | undefined> {
  try {
    const rfq = await api.get<RFQDto>(`/rfqs/${id}`);
    return mapRfq(rfq);
  } catch {
    return undefined;
  }
}

export async function createRFQ(input: {
  title: string;
  description: string;
  deadline: string;
  items: { name: string; quantity: number; unit: string; itemType: "PRODUCT" | "SERVICE" }[];
  invitedVendorIds: string[];
}): Promise<RFQDto> {
  return api.post<RFQDto>("/rfqs", {
    title: input.title,
    description: input.description,
    deadline: toIsoDate(input.deadline),
    items: input.items,
    invitedVendorIds: input.invitedVendorIds,
  });
}

export async function updateRfqStatus(id: string, status: string): Promise<RFQDto> {
  return api.patch<RFQDto>(`/rfqs/${id}/status`, { status });
}

export async function fetchQuotations(rfqId?: string): Promise<Quotation[]> {
  const { items } = await api.get<{ items: QuotationDto[] }>(
    `/quotations${toQueryString({ rfqId, limit: 100 })}`
  );
  return items.map(mapQuotation);
}

export async function fetchQuotationById(id: string): Promise<Quotation | undefined> {
  try {
    const quotation = await api.get<QuotationDto>(`/quotations/${id}`);
    return mapQuotation(quotation);
  } catch {
    return undefined;
  }
}

export async function createQuotation(input: {
  rfqId: string;
  items: { rfqItemId: string; unitPrice: number; deliveryDays?: number }[];
  taxPercentage: number;
  notes?: string;
  isDraft: boolean;
}): Promise<QuotationDto> {
  return api.post<QuotationDto>("/quotations", {
    rfqId: input.rfqId,
    items: input.items,
    taxPercentage: input.taxPercentage,
    notes: input.notes,
    isDraft: input.isDraft,
  });
}

export async function selectQuotation(id: string): Promise<QuotationDto> {
  return api.patch<QuotationDto>(`/quotations/${id}/select`);
}

export async function rejectQuotation(id: string): Promise<QuotationDto> {
  return api.patch<QuotationDto>(`/quotations/${id}/reject`);
}

export async function createPurchaseOrder(input: {
  quotationId: string;
  expectedDeliveryDate: string;
  notes?: string;
}): Promise<PurchaseOrderDto> {
  return api.post<PurchaseOrderDto>("/purchase-orders", {
    quotationId: input.quotationId,
    expectedDeliveryDate: input.expectedDeliveryDate,
    notes: input.notes,
  });
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrderDto[]> {
  const { items } = await api.get<{ items: PurchaseOrderDto[] }>(
    `/purchase-orders${toQueryString({ limit: 100 })}`
  );
  return items;
}

export async function createInvoice(input: {
  purchaseOrderId: string;
  dueDate: string;
}): Promise<InvoiceDto> {
  return api.post<InvoiceDto>("/invoices", {
    purchaseOrderId: input.purchaseOrderId,
    dueDate: input.dueDate,
  });
}

export async function fetchInvoices(): Promise<InvoiceDto[]> {
  const { items } = await api.get<{ items: InvoiceDto[] }>(
    `/invoices${toQueryString({ limit: 100 })}`
  );
  return items;
}

export async function fetchInvoiceById(id: string): Promise<InvoiceDto | undefined> {
  try {
    return await api.get<InvoiceDto>(`/invoices/${id}`);
  } catch {
    return undefined;
  }
}

export async function markInvoicePaid(id: string): Promise<InvoiceDto> {
  return api.patch<InvoiceDto>(`/invoices/${id}/status`, { status: "PAID" });
}

export async function fetchActivityLogs(): Promise<
  { id: string; action: string; entityType: string; description: string; timestamp: string }[]
> {
  const { items } = await api.get<{ items: AuditLogDto[] }>(
    `/audit-logs${toQueryString({ limit: 50 })}`
  );
  return items.map((log) => {
    const value = log.newValue as { status?: string; totalAmount?: string } | undefined;
    const amount = value?.totalAmount ? formatCurrencyCompact(value.totalAmount) : "";
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      description: `${log.userEmail ?? "System"} — ${humanizeAction(log.action)}${amount ? ` (${amount})` : ""}`,
      timestamp: formatDate(log.createdAt),
    };
  });
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function fetchAnalyticsStats(): Promise<AnalyticsStatsDto> {
  const summary = await api.get<DashboardSummaryDto>("/dashboard/summary");
  return {
    activeRfqs: summary.rfqs.byStatus.OPEN ?? 0,
    pendingApprovals: summary.pendingApprovals,
    posThisMonth: summary.purchaseOrders.total,
    overdueInvoices: summary.invoices.byStatus.OVERDUE ?? 0,
  };
}

export async function fetchReportsOverview(): Promise<ReportsOverviewDto> {
  const [summary, trends, vendorPerformance, purchaseOrders] = await Promise.all([
    api.get<DashboardSummaryDto>("/dashboard/summary"),
    api.get<DashboardTrendPoint[]>(`/dashboard/trends${toQueryString({ months: 6 })}`),
    api.get<VendorPerformanceDto[]>("/dashboard/vendor-performance"),
    fetchPurchaseOrders(),
  ]);
  return {
    spendingTrend: trends.map((point) => ({ name: point.month, spend: Number(point.spend) })),
    spendByCategory: [],
    topVendors: vendorPerformance.slice(0, 5).map((vendor) => ({
      name: vendor.name,
      spend: Number(vendor.totalSpend),
    })),
    vendorStatusCounts: summary.vendors.byStatus,
    recentPos: purchaseOrders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      vendor: po.vendor?.name ?? "—",
      amount: Number(po.totalAmount),
      status: po.status,
      orderDate: po.orderDate,
    })),
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "PROCUREMENT_OFFICER" | "APPROVER" | "VENDOR";
}): Promise<{ id: string }> {
  return api.post<{ id: string }>("/auth/register", input);
}

export { addDays };