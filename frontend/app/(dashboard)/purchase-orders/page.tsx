"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "./po-page.module.css";

import { MOCK_PURCHASE_ORDERS, POStatus } from "@/lib/mockData";

type FilterTab = "All" | POStatus;

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  // Compute counts for tabs
  const counts = {
    "All": MOCK_PURCHASE_ORDERS.length,
    "Pending Payment": MOCK_PURCHASE_ORDERS.filter(po => po.status === "Pending Payment").length,
    "Paid": MOCK_PURCHASE_ORDERS.filter(po => po.status === "Paid").length,
    "Overdue": MOCK_PURCHASE_ORDERS.filter(po => po.status === "Overdue").length,
  };

  // Filter based on active tab and search query
  const filteredPOs = MOCK_PURCHASE_ORDERS.filter((po) => {
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
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Purchase Orders</h1>
          <p className={styles.subtitle}>Auto-generated after approval</p>
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

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>PO Date</th>
                <th>Due Date</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length > 0 ? (
                filteredPOs.map(po => (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{po.poNumber}</td>
                    <td>{po.vendor}</td>
                    <td>{po.poDate}</td>
                    <td>{po.dueDate}</td>
                    <td style={{ fontWeight: 600, color: "#10b981" }}>
                      ${po.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={styles.viewButton}
                        onClick={() => router.push(`/invoices/${po.id}`)}
                      >
                        View
                      </button>
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
