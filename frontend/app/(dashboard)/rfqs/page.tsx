"use client";

import React, { useState, useEffect } from "react";
import { fetchRFQs, RFQ, RFQStatus } from "@/lib/data";
import styles from "./rfqs-page.module.css";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type FilterTab = "All" | RFQStatus;

export default function RFQsPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRFQs();
        setRfqs(data);
      } catch (error) {
        console.error("Failed to load RFQs", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute counts for tabs based on the unfiltered full data
  const counts = {
    "All": rfqs.length,
    "Draft": rfqs.filter(r => r.status === "Draft").length,
    "Sent": rfqs.filter(r => r.status === "Sent").length,
    "Quotes Received": rfqs.filter(r => r.status === "Quotes Received").length,
    "Closed": rfqs.filter(r => r.status === "Closed").length,
  };

  // Filter RFQs based on active tab and search query
  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesTab = activeTab === "All" || rfq.status === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      rfq.title.toLowerCase().includes(lowerQuery) ||
      rfq.category.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeClass = (status: RFQStatus) => {
    switch(status) {
      case "Draft": return styles.badgeDraft;
      case "Sent": return styles.badgeSent;
      case "Quotes Received": return styles.badgeQuotesReceived;
      case "Closed": return styles.badgeClosed;
      default: return "";
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
          <h1 className={styles.title}>RFQ's</h1>
          <p className={styles.subtitle}>Manage requests for quotation</p>
        </div>
        <button 
          className={styles.addButton} 
          onClick={() => router.push('/rfqs/new')}
        >
          <Plus size={18} />
          <span>New RFQ</span>
        </button>
      </div>

      {/* Main Filter & Table Section */}
      <div className={styles.searchAndFilter}>
        
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search by RFQ title, category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className={styles.tabsRow}>
          {(["All", "Draft", "Sent", "Quotes Received", "Closed"] as FilterTab[]).map(tab => (
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
                <th>RFQ Title</th>
                <th>Category</th>
                <th>Deadline</th>
                <th>Vendors Assigned</th>
                <th>Quotes Received</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRFQs.length > 0 ? (
                filteredRFQs.map(rfq => (
                  <tr key={rfq.id}>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{rfq.title}</td>
                    <td>{rfq.category}</td>
                    <td>{rfq.deadline}</td>
                    <td>
                      {rfq.vendorsAssignedCount} {rfq.vendorsAssignedCount === 1 ? 'vendor' : 'vendors'}
                    </td>
                    <td>
                      {rfq.vendorsAssignedCount > 0 
                        ? `${rfq.quotesReceivedCount}/${rfq.vendorsAssignedCount}`
                        : '-'}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(rfq.status)}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button 
                        className={styles.viewButton}
                        onClick={() => router.push(`/rfqs/${rfq.id}`)}
                      >
                        View
                      </button>
                      {rfq.status === "Quotes Received" && (
                        <button 
                          className={styles.compareButton}
                          onClick={() => router.push(`/rfqs/${rfq.id}/compare`)}
                        >
                          Compare
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No RFQs found matching your criteria.
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
