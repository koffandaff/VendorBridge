// MOCK DATA and API layer simulation
// Later, these functions will be replaced by actual fetch calls to your backend.

import {
  MOCK_STATS,
  MOCK_RECENT_POS,
  MOCK_CHART_DATA,
  MOCK_VENDORS,
  MOCK_RFQS,
  MOCK_QUOTATIONS
} from "./mockData";

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

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_STATS;
};

export const fetchRecentPOs = async (): Promise<RecentPO[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_RECENT_POS;
};

export const fetchSpendingTrends = async (): Promise<ChartDataPoint[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_CHART_DATA;
};

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
}

export const fetchVendors = async (): Promise<Vendor[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_VENDORS;
};

export type RFQStatus = "Draft" | "Sent" | "Quotes Received" | "Closed";

export interface RFQItem {
  id: string;
  item: string;
  qty: number;
  category: string;
}

export interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  vendorsAssignedCount: number;
  quotesReceivedCount: number;
  status: RFQStatus;
  items: RFQItem[];
}

export const fetchRFQs = async (): Promise<RFQ[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_RFQS;
};

export const fetchRFQById = async (id: string): Promise<RFQ | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_RFQS.find(rfq => rfq.id === id);
};

export type QuotationStatus = "Pending Review" | "Accepted" | "Rejected";

export interface Quotation {
  id: string;
  rfqId: string;
  rfqTitle: string;
  vendorName: string;
  submittedAt: string;
  grandTotal: number;
  status: QuotationStatus;
}

export const fetchQuotations = async (): Promise<Quotation[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_QUOTATIONS;
};
