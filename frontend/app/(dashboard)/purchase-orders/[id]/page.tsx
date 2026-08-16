"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  acknowledgePurchaseOrder,
  fetchPurchaseOrderById,
  updatePurchaseOrderStatus,
} from "@/lib/data";
import type { PurchaseOrderDto } from "@/lib/types";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { useAuth } from "@/lib/AuthContext";
import styles from "./purchase-orders-detail.module.css";
import toast from "react-hot-toast";

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

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const poId = params.id as string;

  const [po, setPo] = useState<PurchaseOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<StatusAction | null>(null);

  const isOfficer = user?.role === "Procurement Officer";
  const isVendor = user?.role === "Vendor";

  const loadPO = async () => {
    const data = await fetchPurchaseOrderById(poId);
    setPo(data || null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadPO();
      } catch (error) {
        console.error("Failed to load purchase order", error);
      } finally {
        setLoading(false);
      }
    };
    if (poId) load();
  }, [poId]);

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

  const handleStatusAction = async (action: StatusAction) => {
    setActionLoading(action);
    try {
      if (action === "ACKNOWLEDGE") {
        await acknowledgePurchaseOrder(poId);
        toast.success("Purchase order acknowledged!");
      } else if (action === "SENT") {
        await updatePurchaseOrderStatus(poId, "SENT");
        toast.success("Purchase order marked as sent!");
      } else {
        await updatePurchaseOrderStatus(poId, "CANCELLED");
        toast.success("Purchase order cancelled.");
      }
      await loadPO();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update purchase order");
    } finally {
      setActionLoading(null);
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

  if (!po) {
    return (
      <div style={{ padding: "40px", color: "#f8fafc" }}>
        <h2>Purchase Order Not Found</h2>
        <button
          onClick={() => router.push('/purchase-orders')}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "8px", marginTop: "16px", cursor: "pointer" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Purchase Order {po.poNumber}</h1>
            <span className={`${styles.badge} ${getStatusBadgeClass(po.status)}`}>
              {STATUS_LABEL[po.status]}
            </span>
          </div>
          <p className={styles.subtitle}>
            {po.vendor?.name ?? "Vendor"} — ordered {formatDate(po.orderDate)}
          </p>
        </div>
        <div className={styles.headerActions}>
          {po.status === "APPROVED" && isOfficer && (
            <button
              className={styles.actionBtn}
              style={{ color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
              onClick={() => handleStatusAction("SENT")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "SENT" ? "Marking..." : "Mark as Sent"}
            </button>
          )}
          {po.status === "SENT" && isVendor && (
            <button
              className={styles.actionBtn}
              style={{ color: "#3b82f6", borderColor: "rgba(59,130,246,0.3)" }}
              onClick={() => handleStatusAction("ACKNOWLEDGE")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "ACKNOWLEDGE" ? "Acknowledging..." : "Acknowledge"}
            </button>
          )}
          {CANCELLABLE_STATUSES.includes(po.status) && isOfficer && (
            <button
              className={styles.actionBtn}
              style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}
              onClick={() => handleStatusAction("CANCELLED")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "CANCELLED" ? "Cancelling..." : "Cancel"}
            </button>
          )}
          <button className={styles.actionBtn} onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <div className={styles.infoRow}>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Vendor</div>
            <div className={styles.infoText}>
              {po.vendor?.name ?? "—"}
              {po.vendor?.code ? <><br />{po.vendor.code}</> : null}
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Order details</div>
            <div className={styles.infoText}>
              <div className={styles.infoLine}>
                <span className={styles.infoLineLabel}>PO number:</span> {po.poNumber}
              </div>
              <div className={styles.infoLine}>
                <span className={styles.infoLineLabel}>Order date:</span> {formatDate(po.orderDate)}
              </div>
              <div className={styles.infoLine}>
                <span className={styles.infoLineLabel}>Expected delivery:</span> {formatDate(po.expectedDeliveryDate)}
              </div>
              <div className={styles.infoLine}>
                <span className={styles.infoLineLabel}>Quotation:</span> {po.quotation?.quotationNumber ?? "—"}
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.infoRow} ${styles.infoRowFull}`}>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Notes</div>
            <div className={styles.infoText}>{po.notes || "—"}</div>
          </div>
        </div>
      </div>

      {/* Table & Summary */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th>Description</th>
              <th style={{ width: "80px" }}>Qty</th>
              <th style={{ width: "80px" }}>Unit</th>
              <th style={{ width: "140px" }} className={styles.alignRight}>Unit price</th>
              <th style={{ width: "140px" }} className={styles.alignRight}>Tax</th>
              <th style={{ width: "160px" }} className={styles.alignRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(po.items ?? []).length > 0 ? (
              po.items!.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ color: "#94a3b8" }}>{index + 1}</td>
                  <td>{item.description}</td>
                  <td>{toNumber(item.quantity)}</td>
                  <td>{item.unit}</td>
                  <td className={styles.alignRight}>{formatCurrency(toNumber(item.unitPrice))}</td>
                  <td className={styles.alignRight}>{formatCurrency(toNumber(item.taxAmount))}</td>
                  <td className={styles.alignRight}>{formatCurrency(toNumber(item.totalAmount))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                  No line items available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={styles.summaryRow}>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>{formatCurrency(toNumber(po.subtotal))}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Tax amount</span>
              <span>{formatCurrency(toNumber(po.taxAmount))}</span>
            </div>
            <div className={styles.grandTotalLine}>
              <span>Grand total</span>
              <span>{formatCurrency(toNumber(po.totalAmount))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}