// MOCK DATA and API layer simulation
// Later, these functions will be replaced by actual fetch calls to your backend.

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

const MOCK_STATS: DashboardStats = {
  activeRfqs: 12,
  pendingApprovals: 5,
  posThisMonth: "$ 24,500",
  overdueInvoices: 3
};

const MOCK_RECENT_POS: RecentPO[] = [
  { id: "PO-2023-001", vendor: "TechCorp Inc.", amount: "$4,500", status: "Approved" },
  { id: "PO-2023-002", vendor: "Office Supplies Co.", amount: "$850", status: "Pending" },
  { id: "PO-2023-003", vendor: "Global Logistics", amount: "$12,400", status: "Approved" },
  { id: "PO-2023-004", vendor: "Marketing Solutions", amount: "$3,200", status: "Draft" },
  { id: "PO-2023-005", vendor: "Software Systems", amount: "$1,850", status: "Pending" },
];

const MOCK_CHART_DATA: ChartDataPoint[] = [
  { name: "Jan", spend: 12000 },
  { name: "Feb", spend: 19000 },
  { name: "Mar", spend: 15000 },
  { name: "Apr", spend: 22000 },
  { name: "May", spend: 18000 },
  { name: "Jun", spend: 24500 },
];

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
  status: "Active" | "Pending" | "Blocked";
}

const MOCK_VENDORS: Vendor[] = [
  { id: "V-001", name: "TechCorp Inc.", category: "IT Hardware", gstNumber: "27AADCB2230M1Z2", contactNo: "+1 234-567-8901", status: "Active" },
  { id: "V-002", name: "Office Supplies Co.", category: "Stationery", gstNumber: "29BBDFG3341N2Z5", contactNo: "+1 234-567-8902", status: "Active" },
  { id: "V-003", name: "Global Logistics", category: "Shipping", gstNumber: "07CCEHJ4452P3Z8", contactNo: "+1 234-567-8903", status: "Pending" },
  { id: "V-004", name: "Marketing Solutions", category: "Services", gstNumber: "19DDFKL5563Q4Z1", contactNo: "+1 234-567-8904", status: "Active" },
  { id: "V-005", name: "Software Systems", category: "Software", gstNumber: "33EEHMN6674R5Z4", contactNo: "+1 234-567-8905", status: "Blocked" },
  { id: "V-006", name: "Build It Right", category: "Construction", gstNumber: "24FFIPQ7785S6Z7", contactNo: "+1 234-567-8906", status: "Pending" },
  { id: "V-007", name: "Secure Networks", category: "IT Hardware", gstNumber: "09GGJRS8896T7Z0", contactNo: "+1 234-567-8907", status: "Active" },
  { id: "V-008", name: "Clean Sweeps", category: "Facilities", gstNumber: "10HHKTU9907U8Z3", contactNo: "+1 234-567-8908", status: "Blocked" },
];

export const fetchVendors = async (): Promise<Vendor[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_VENDORS;
};

export type RFQStatus = "Draft" | "Sent" | "Quotes Received" | "Closed";

export interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  vendorsAssignedCount: number;
  quotesReceivedCount: number;
  status: RFQStatus;
}

const MOCK_RFQS: RFQ[] = [
  { id: "RFQ-2023-001", title: "Office Furniture Q3", category: "Furniture", deadline: "15 Sep 2023", vendorsAssignedCount: 3, quotesReceivedCount: 2, status: "Quotes Received" },
  { id: "RFQ-2023-002", title: "Laptops for Engineering", category: "IT Hardware", deadline: "20 Sep 2023", vendorsAssignedCount: 5, quotesReceivedCount: 5, status: "Closed" },
  { id: "RFQ-2023-003", title: "Warehouse Shelving", category: "Construction", deadline: "10 Oct 2023", vendorsAssignedCount: 2, quotesReceivedCount: 0, status: "Sent" },
  { id: "RFQ-2023-004", title: "Annual Stationery Supplies", category: "Stationery", deadline: "01 Nov 2023", vendorsAssignedCount: 0, quotesReceivedCount: 0, status: "Draft" },
  { id: "RFQ-2023-005", title: "Delivery Fleet Expansion", category: "Logistics", deadline: "25 Sep 2023", vendorsAssignedCount: 4, quotesReceivedCount: 3, status: "Quotes Received" },
];

export const fetchRFQs = async (): Promise<RFQ[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_RFQS;
};
