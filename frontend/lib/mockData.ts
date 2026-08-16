import { DashboardStats, RecentPO, ChartDataPoint, Vendor, RFQ, Quotation } from "./data";

export type Role = "Procurement Officer" | "Vendor" | "Manager" | "Admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const MOCK_USERS: User[] = [
  { id: "u1", name: "Ramesh Kumar", email: "officer@vendorbridge.com", role: "Procurement Officer" },
  { id: "u2", name: "TechCorp Vendor", email: "vendor@techcorp.com", role: "Vendor" },
  { id: "u3", name: "Sarah Jenkins", email: "manager@vendorbridge.com", role: "Manager" },
  { id: "u4", name: "System Admin", email: "admin@vendorbridge.com", role: "Admin" }
];

export const CURRENT_USER: User = MOCK_USERS[0];

export type POStatus = "Pending Payment" | "Paid" | "Overdue";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  poDate: string;
  dueDate: string;
  grandTotal: number;
  status: POStatus;
}

// 1. Relational Vendors
export const MOCK_VENDORS: Vendor[] = [
  { id: "V-001", name: "TechCorp Inc.", category: "IT Hardware", gstNumber: "27AADCB2230M1Z2", contactNo: "+1 234-567-8901", status: "Active" },
  { id: "V-002", name: "Secure Networks", category: "IT Hardware", gstNumber: "09GGJRS8896T7Z0", contactNo: "+1 234-567-8907", status: "Active" },
  { id: "V-003", name: "Global Logistics", category: "Logistics", gstNumber: "07CCEHJ4452P3Z8", contactNo: "+1 234-567-8903", status: "Active" },
  { id: "V-004", name: "Fast Track Deliveries", category: "Logistics", gstNumber: "19DDFKL5563Q4Z1", contactNo: "+1 234-567-8904", status: "Active" },
  { id: "V-005", name: "Swift Transports", category: "Logistics", gstNumber: "33EEHMN6674R5Z4", contactNo: "+1 234-567-8905", status: "Active" },
  { id: "V-006", name: "Office Supplies Co.", category: "Stationery", gstNumber: "29BBDFG3341N2Z5", contactNo: "+1 234-567-8902", status: "Active" },
  { id: "V-007", name: "PaperTrail", category: "Stationery", gstNumber: "24FFIPQ7785S6Z7", contactNo: "+1 234-567-8906", status: "Active" }
];

// 2. Relational RFQs (Must match categories exactly)
export const MOCK_RFQS: RFQ[] = [
  { 
    id: "RFQ-2025-001", title: "Engineering Laptops Q1", category: "IT Hardware", deadline: "15 Jan 2025", 
    vendorsAssignedCount: 2, quotesReceivedCount: 2, status: "Closed", 
    items: [{ id: "item-1", item: "MacBook Pro 16", qty: 10, category: "IT Hardware" }, { id: "item-2", item: "Dell XPS 15", qty: 15, category: "IT Hardware" }] 
  },
  { 
    id: "RFQ-2025-002", title: "Warehouse Fleet Expansion", category: "Logistics", deadline: "20 Feb 2025", 
    vendorsAssignedCount: 3, quotesReceivedCount: 3, status: "Quotes Received", 
    items: [{ id: "item-3", item: "Delivery Vans", qty: 5, category: "Logistics" }] 
  },
  { 
    id: "RFQ-2025-003", title: "Annual Office Stationery", category: "Stationery", deadline: "10 Mar 2025", 
    vendorsAssignedCount: 2, quotesReceivedCount: 1, status: "Quotes Received", 
    items: [{ id: "item-4", item: "A4 Paper Reams", qty: 500, category: "Stationery" }, { id: "item-5", item: "Whiteboard Markers", qty: 200, category: "Stationery" }] 
  },
];

// 3. Relational Quotations (Must link exactly to RFQs and matching Vendors)
export const MOCK_QUOTATIONS: Quotation[] = [
  // IT Hardware Quotes (RFQ-2025-001)
  { id: "QT-001", rfqId: "RFQ-2025-001", rfqTitle: "Engineering Laptops Q1", vendorName: "TechCorp Inc.", submittedAt: "10 Jan 2025", grandTotal: 45000.00, status: "Accepted" },
  { id: "QT-002", rfqId: "RFQ-2025-001", rfqTitle: "Engineering Laptops Q1", vendorName: "Secure Networks", submittedAt: "11 Jan 2025", grandTotal: 47500.00, status: "Rejected" },
  
  // Logistics Quotes (RFQ-2025-002) - 3 Quotes
  { id: "QT-003", rfqId: "RFQ-2025-002", rfqTitle: "Warehouse Fleet Expansion", vendorName: "Global Logistics", submittedAt: "15 Feb 2025", grandTotal: 150000.00, status: "Pending Review" },
  { id: "QT-004", rfqId: "RFQ-2025-002", rfqTitle: "Warehouse Fleet Expansion", vendorName: "Fast Track Deliveries", submittedAt: "16 Feb 2025", grandTotal: 145000.00, status: "Pending Review" },
  { id: "QT-005", rfqId: "RFQ-2025-002", rfqTitle: "Warehouse Fleet Expansion", vendorName: "Swift Transports", submittedAt: "17 Feb 2025", grandTotal: 155000.00, status: "Pending Review" },
  
  // Stationery Quotes (RFQ-2025-003)
  { id: "QT-006", rfqId: "RFQ-2025-003", rfqTitle: "Annual Office Stationery", vendorName: "Office Supplies Co.", submittedAt: "05 Mar 2025", grandTotal: 3200.00, status: "Pending Review" },
];

// 4. Relational Purchase Orders (Must link exactly to Accepted Quotations)
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-1", poNumber: "PO-2025-0068", vendor: "TechCorp Inc.", poDate: "20 Jan 2025", dueDate: "20 Feb 2025", grandTotal: 45000.00, status: "Paid" },
  { id: "PO-2", poNumber: "PO-2025-0069", vendor: "Global Logistics", poDate: "10 Mar 2025", dueDate: "10 Apr 2025", grandTotal: 150000.00, status: "Pending Payment" },
  { id: "PO-3", poNumber: "PO-2025-0070", vendor: "Office Supplies Co.", poDate: "15 Mar 2025", dueDate: "15 Apr 2025", grandTotal: 3200.00, status: "Overdue" },
];

// 5. Shared Activity Logs
export const MOCK_ACTIVITY_LOGS = [
  { id: 1, entityType: 'RFQ' as const, description: 'RFQ-2025-003 published to Stationery vendors', timestamp: '10 Mar 2025, 09:15 AM' },
  { id: 2, entityType: 'Vendors' as const, description: 'Vendor Fast Track Deliveries added', timestamp: '09 Mar 2025, 02:30 PM' },
  { id: 3, entityType: 'Approvals' as const, description: 'Approval pending for QT-003 (Warehouse Fleet Expansion)', timestamp: '15 Feb 2025, 11:45 AM' },
  { id: 4, entityType: 'Invoices' as const, description: 'Invoice generated for PO-2025-0068', timestamp: '20 Jan 2025, 04:20 PM' },
];

// 6. Reports & Charts (Linked to real PO values)
export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { name: "Jan", spend: 45000 },
  { name: "Feb", spend: 0 },
  { name: "Mar", spend: 153200 },
  { name: "Apr", spend: 0 },
  { name: "May", spend: 0 },
];

export const MOCK_RECENT_POS: RecentPO[] = MOCK_PURCHASE_ORDERS.map(po => ({
  id: po.poNumber,
  vendor: po.vendor,
  amount: `$${po.grandTotal.toLocaleString()}`,
  status: po.status === "Paid" ? "Approved" : po.status === "Pending Payment" ? "Pending" : "Draft"
}));

export const MOCK_STATS: DashboardStats = {
  activeRfqs: MOCK_RFQS.filter(r => r.status !== "Closed").length,
  pendingApprovals: MOCK_QUOTATIONS.filter(q => q.status === "Pending Review").length,
  posThisMonth: "$ 153,200", // March sum
  overdueInvoices: 1
};
