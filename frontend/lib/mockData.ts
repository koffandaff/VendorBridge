import { DashboardStats, RecentPO, ChartDataPoint, Vendor, RFQ, Quotation } from "./data";

// MOCK_STATS is defined at the bottom to dynamically compute from the other arrays

export const MOCK_RECENT_POS: RecentPO[] = [
  { id: "PO-2023-001", vendor: "TechCorp Inc.", amount: "$4,500", status: "Approved" },
  { id: "PO-2023-002", vendor: "Office Supplies Co.", amount: "$850", status: "Pending" },
  { id: "PO-2023-003", vendor: "Global Logistics", amount: "$12,400", status: "Approved" },
  { id: "PO-2023-004", vendor: "Marketing Solutions", amount: "$3,200", status: "Draft" },
  { id: "PO-2023-005", vendor: "Software Systems", amount: "$1,850", status: "Pending" },
];

export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { name: "Jan", spend: 12000 },
  { name: "Feb", spend: 19000 },
  { name: "Mar", spend: 15000 },
  { name: "Apr", spend: 22000 },
  { name: "May", spend: 18000 },
  { name: "Jun", spend: 24500 },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: "V-001", name: "TechCorp Inc.", category: "IT Hardware", gstNumber: "27AADCB2230M1Z2", contactNo: "+1 234-567-8901", status: "Active" },
  { id: "V-002", name: "Office Supplies Co.", category: "Stationery", gstNumber: "29BBDFG3341N2Z5", contactNo: "+1 234-567-8902", status: "Active" },
  { id: "V-003", name: "Global Logistics", category: "Shipping", gstNumber: "07CCEHJ4452P3Z8", contactNo: "+1 234-567-8903", status: "Pending" },
  { id: "V-004", name: "Marketing Solutions", category: "Services", gstNumber: "19DDFKL5563Q4Z1", contactNo: "+1 234-567-8904", status: "Active" },
  { id: "V-005", name: "Software Systems", category: "Software", gstNumber: "33EEHMN6674R5Z4", contactNo: "+1 234-567-8905", status: "Blocked" },
  { id: "V-006", name: "Build It Right", category: "Construction", gstNumber: "24FFIPQ7785S6Z7", contactNo: "+1 234-567-8906", status: "Pending" },
  { id: "V-007", name: "Secure Networks", category: "IT Hardware", gstNumber: "09GGJRS8896T7Z0", contactNo: "+1 234-567-8907", status: "Active" },
  { id: "V-008", name: "Clean Sweeps", category: "Facilities", gstNumber: "10HHKTU9907U8Z3", contactNo: "+1 234-567-8908", status: "Blocked" },
];

export const MOCK_RFQS: RFQ[] = [
  { id: "RFQ-2023-001", title: "Office Furniture Q3", category: "Furniture", deadline: "15 Sep 2023", vendorsAssignedCount: 3, quotesReceivedCount: 2, status: "Quotes Received", items: [{ id: "item-1", item: "Ergonomic Chairs", qty: 50, category: "Furniture" }, { id: "item-2", item: "Standing Desks", qty: 20, category: "Furniture" }] },
  { id: "RFQ-2023-002", title: "Laptops for Engineering", category: "IT Hardware", deadline: "20 Sep 2023", vendorsAssignedCount: 5, quotesReceivedCount: 5, status: "Closed", items: [{ id: "item-3", item: "MacBook Pro 16", qty: 10, category: "IT Hardware" }, { id: "item-4", item: "Dell XPS 15", qty: 15, category: "IT Hardware" }] },
  { id: "RFQ-2023-003", title: "Warehouse Shelving", category: "Construction", deadline: "10 Oct 2023", vendorsAssignedCount: 2, quotesReceivedCount: 0, status: "Sent", items: [{ id: "item-5", item: "Heavy Duty Racks", qty: 100, category: "Construction" }] },
  { id: "RFQ-2023-004", title: "Annual Stationery Supplies", category: "Stationery", deadline: "01 Nov 2023", vendorsAssignedCount: 0, quotesReceivedCount: 0, status: "Draft", items: [{ id: "item-6", item: "A4 Paper Reams", qty: 500, category: "Stationery" }, { id: "item-7", item: "Whiteboard Markers", qty: 200, category: "Stationery" }] },
  { id: "RFQ-2023-005", title: "Delivery Fleet Expansion", category: "Logistics", deadline: "25 Sep 2023", vendorsAssignedCount: 4, quotesReceivedCount: 3, status: "Quotes Received", items: [{ id: "item-8", item: "Delivery Vans", qty: 5, category: "Logistics" }] },
];

export const MOCK_QUOTATIONS: Quotation[] = ([
  { id: "QT-001", rfqId: "RFQ-2023-001", rfqTitle: "", vendorName: "TechCorp Inc.", submittedAt: "10 Sep 2023", grandTotal: 12500.50, status: "Pending Review" },
  { id: "QT-002", rfqId: "RFQ-2023-001", rfqTitle: "", vendorName: "Global Logistics", submittedAt: "11 Sep 2023", grandTotal: 11800.00, status: "Pending Review" },
  { id: "QT-003", rfqId: "RFQ-2023-002", rfqTitle: "", vendorName: "Office Supplies Co.", submittedAt: "18 Sep 2023", grandTotal: 45000.00, status: "Accepted" },
  { id: "QT-004", rfqId: "RFQ-2023-002", rfqTitle: "", vendorName: "Secure Networks", submittedAt: "19 Sep 2023", grandTotal: 47500.00, status: "Rejected" },
] as Quotation[]).map(q => ({
  ...q,
  rfqTitle: MOCK_RFQS.find(r => r.id === q.rfqId)?.title || "Unknown RFQ"
}));

export const MOCK_STATS: DashboardStats = {
  activeRfqs: MOCK_RFQS.filter(r => r.status !== "Closed").length,
  pendingApprovals: MOCK_QUOTATIONS.filter(q => q.status === "Pending Review").length,
  posThisMonth: "$ 24,500", // Would theoretically be sum of MOCK_RECENT_POS this month
  overdueInvoices: 3
};
