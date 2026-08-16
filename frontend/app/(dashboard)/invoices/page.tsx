"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "../purchase-orders/po-page.module.css"; // Reuse the PO page styles
import { fetchInvoices } from "@/lib/data";
import type { InvoiceDto } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

type FilterTab = "All" | "Pending Payment" | "Paid" | "Overdue" | "Cancelled";

const TABS: FilterTab[] = ["All", "Pending Payment", "Paid", "Overdue", "Cancelled"];

const STATUS_LABEL: Record<InvoiceDto["status"], string> = {
  DRAFT: "Pending Payment",
  ISSUED: "Pending Payment",
  SENT: "Pending Payment",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Failed to load invoices", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts: Record<FilterTab, number> = {
    All: invoices.length,
    "Pending Payment": invoices.filter((invoice) => STATUS_LABEL[invoice.status] === "Pending Payment").length,
    Paid: invoices.filter((invoice) => STATUS_LABEL[invoice.status] === "Paid").length,
    Overdue: invoices.filter((invoice) => STATUS_LABEL[invoice.status] === "Overdue").length,
    Cancelled: invoices.filter((invoice) => STATUS_LABEL[invoice.status] === "Cancelled").length,
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesTab = activeTab === "All" || STATUS_LABEL[invoice.status] === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
      invoice.vendor?.name?.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeClass = (status: InvoiceDto["status"]) => {
    switch (status) {
      case "DRAFT":
      case "ISSUED":
      case "SENT":
        return styles.badgePending;
      case "PAID":
        return styles.badgePaid;
      case "OVERDUE":
      case "CANCELLED":
        return styles.badgeOverdue;
      default:
        return "";
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
    <div className={styles.container} style={{ maxWidth: 'none' }}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>Manage and track vendor invoices</p>
        </div>
      </div>

      <div className={styles.searchAndFilter}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by Invoice number, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Vendor</th>
                <th>Date Generated</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{invoice.invoiceNumber}</td>
                    <td>{invoice.vendor?.name ?? "—"}</td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td style={{ fontWeight: 600, color: "#10b981" }}>
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(invoice.status)}`}>
                        {STATUS_LABEL[invoice.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.viewButton}
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No invoices found matching your criteria.
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