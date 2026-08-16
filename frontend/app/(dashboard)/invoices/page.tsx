"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "../purchase-orders/po-page.module.css"; // Reuse the PO page styles
import { MOCK_PURCHASE_ORDERS, POStatus } from "@/lib/mockData";

type FilterTab = "All" | POStatus;

export default function InvoicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  // In a real app, you would have a separate MOCK_INVOICES array.
  // For this demo, we'll reuse the purchase orders and pretend they are invoices.
  const counts = {
    "All": MOCK_PURCHASE_ORDERS.length,
    "Pending Payment": MOCK_PURCHASE_ORDERS.filter(po => po.status === "Pending Payment").length,
    "Paid": MOCK_PURCHASE_ORDERS.filter(po => po.status === "Paid").length,
    "Overdue": MOCK_PURCHASE_ORDERS.filter(po => po.status === "Overdue").length,
  };

  const filteredInvoices = MOCK_PURCHASE_ORDERS.filter((po) => {
    const matchesTab = activeTab === "All" || po.status === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(lowerQuery) ||
      po.vendor.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeClass = (status: POStatus) => {
    switch(status) {
      case "Pending Payment": return styles.badgePending;
      case "Paid": return styles.badgePaid;
      case "Overdue": return styles.badgeOverdue;
      default: return "";
    }
  };

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
          {(["All", "Pending Payment", "Paid", "Overdue"] as FilterTab[]).map(tab => (
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
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>
                      INV-{invoice.poNumber.replace('PO-', '')}
                    </td>
                    <td>{invoice.vendor}</td>
                    <td>{invoice.poDate}</td>
                    <td>{invoice.dueDate}</td>
                    <td style={{ fontWeight: 600, color: "#10b981" }}>
                      ${invoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(invoice.status)}`}>
                        {invoice.status}
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
