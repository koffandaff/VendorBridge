"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText } from "lucide-react";
import styles from "./po-page.module.css";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";

import { acknowledgePurchaseOrder, createInvoice, fetchPurchaseOrders, updatePurchaseOrderStatus } from "@/lib/data";
import type { PurchaseOrderDto } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import { addDays, formatCurrency, formatDate, toIsoDate } from "@/lib/format";

type FilterTab = "All" | "Draft" | "Pending Approval" | "Approved" | "Completed" | "Cancelled";

const TABS: FilterTab[] = ["All", "Draft", "Pending Approval", "Approved", "Completed", "Cancelled"];

const STATUS_LABEL: Record<PurchaseOrderDto["status"], string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SENT: "Sent",
  ACKNOWLEDGED: "Acknowledged",
  PARTIALLY_RECEIVED: "Partially Received",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const CANCELLABLE_STATUSES: PurchaseOrderDto["status"][] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "ACKNOWLEDGED",
  "PARTIALLY_RECEIVED",
];

type StatusAction = "SENT" | "CANCELLED" | "ACKNOWLEDGE";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [pos, setPos] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<{ id: string; action: StatusAction } | null>(null);

  const isOfficer = user?.role === "Procurement Officer";
  const isVendor = user?.role === "Vendor";

  const loadPOs = async () => {
    const data = await fetchPurchaseOrders();
    setPos(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadPOs();
      } catch (error) {
        console.error("Failed to load purchase orders", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getTabStatus = (status: PurchaseOrderDto["status"]): FilterTab => {
    if (status === "PENDING_APPROVAL") return "Pending Approval";
    if (status === "APPROVED" || status === "SENT" || status === "ACKNOWLEDGED" || status === "PARTIALLY_RECEIVED") return "Approved";
    if (status === "COMPLETED") return "Completed";
    if (status === "CANCELLED") return "Cancelled";
    return "Draft";
  };

  const counts: Record<FilterTab, number> = {
    All: pos.length,
    Draft: pos.filter((po) => getTabStatus(po.status) === "Draft").length,
    "Pending Approval": pos.filter((po) => getTabStatus(po.status) === "Pending Approval").length,
    Approved: pos.filter((po) => getTabStatus(po.status) === "Approved").length,
    Completed: pos.filter((po) => getTabStatus(po.status) === "Completed").length,
    Cancelled: pos.filter((po) => getTabStatus(po.status) === "Cancelled").length,
  };

  const filteredPOs = pos.filter((po) => {
    const matchesTab = activeTab === "All" || getTabStatus(po.status) === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      po.poNumber.toLowerCase().includes(lowerQuery) ||
      po.vendor?.name?.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeClass = (status: PurchaseOrderDto["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
      case "DRAFT":
        return styles.badgePending;
      case "APPROVED":
      case "SENT":
      case "ACKNOWLEDGED":
      case "PARTIALLY_RECEIVED":
      case "COMPLETED":
        return styles.badgePaid;
      case "CANCELLED":
        return styles.badgeOverdue;
      default:
        return "";
    }
  };

  const handleGenerateInvoice = async (po: PurchaseOrderDto) => {
    setInvoiceLoadingId(po.id);
    showLoading("Generating Invoice...");
    try {
      await createInvoice({
        purchaseOrderId: po.id,
        dueDate: toIsoDate(addDays(new Date(), 30).toISOString()),
      });
      closeAlert();
      await showModalSuccess(`Invoice generated for ${po.poNumber}!`);
      await loadPOs();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to generate invoice");
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const handleStatusAction = async (po: PurchaseOrderDto, action: StatusAction) => {
    setStatusLoading({ id: po.id, action });
    try {
      if (action === "ACKNOWLEDGE") {
        await acknowledgePurchaseOrder(po.id);
        toast.success(`Purchase order ${po.poNumber} acknowledged!`);
      } else {
        await updatePurchaseOrderStatus(po.id, action);
        toast.success(
          action === "SENT"
            ? `Purchase order ${po.poNumber} marked as sent!`
            : `Purchase order ${po.poNumber} cancelled.`
        );
      }
      await loadPOs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update purchase order");
    } finally {
      setStatusLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "300px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
          borderTopColor: "#10b981",
          animation: "spin 1s ease-in-out infinite"
        }}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Purchase Orders</h1>
          <p className={styles.subtitle}>Auto-generated after quotation selection</p>
        </div>
      </div>

      {/* Main Filter & Table Section */}
      <div className={styles.searchAndFilter}>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by PO number, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className={styles.tabsRow}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>PO Date</th>
                <th>Expected Delivery</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length > 0 ? (
                filteredPOs.map(po => (
                  <tr key={po.id}>
                    <td>
                      <Link href={`/purchase-orders/${po.id}`} className={styles.poLink}>
                        {po.poNumber}
                      </Link>
                    </td>
                    <td>{po.vendor?.name ?? "—"}</td>
                    <td>{formatDate(po.orderDate)}</td>
                    <td>{formatDate(po.expectedDeliveryDate)}</td>
                    <td style={{ fontWeight: 600, color: "#10b981" }}>
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(po.status)}`}>
                        {STATUS_LABEL[po.status]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {po.invoice && po.invoice.id ? (
                          <button
                            className={styles.viewButton}
                            onClick={() => router.push(`/invoices/${po.invoice!.id}`)}
                          >
                            View Invoice
                          </button>
                        ) : (
                          <button
                            className={styles.viewButton}
                            style={{ borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}
                            onClick={() => handleGenerateInvoice(po)}
                            disabled={invoiceLoadingId === po.id}
                          >
                            <FileText size={14} />
                            {invoiceLoadingId === po.id ? "Generating..." : "Generate Invoice"}
                          </button>
                        )}
                        {po.status === "APPROVED" && isOfficer && (
                          <button
                            className={styles.viewButton}
                            style={{ borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}
                            onClick={() => handleStatusAction(po, "SENT")}
                            disabled={statusLoading?.id === po.id}
                          >
                            {statusLoading?.id === po.id && statusLoading.action === "SENT" ? "Marking..." : "Mark Sent"}
                          </button>
                        )}
                        {po.status === "SENT" && isVendor && (
                          <button
                            className={styles.viewButton}
                            style={{ borderColor: "rgba(59,130,246,0.3)", color: "#3b82f6" }}
                            onClick={() => handleStatusAction(po, "ACKNOWLEDGE")}
                            disabled={statusLoading?.id === po.id}
                          >
                            {statusLoading?.id === po.id && statusLoading.action === "ACKNOWLEDGE" ? "Acknowledging..." : "Acknowledge"}
                          </button>
                        )}
                        {CANCELLABLE_STATUSES.includes(po.status) && isOfficer && (
                          <button
                            className={styles.viewButton}
                            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}
                            onClick={() => handleStatusAction(po, "CANCELLED")}
                            disabled={statusLoading?.id === po.id}
                          >
                            {statusLoading?.id === po.id && statusLoading.action === "CANCELLED" ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No purchase orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}