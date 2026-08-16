"use client";

import React, { useState, useEffect } from "react";
import { fetchQuotations, Quotation, QuotationStatus } from "@/lib/data";
import styles from "./quotations-list.module.css";
import { Search } from "lucide-react";

import { useRouter } from "next/navigation";

type FilterTab = "All" | QuotationStatus;

export default function QuotationsListPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchQuotations();
        setQuotations(data);
      } catch (error) {
        console.error("Failed to load quotations", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute counts for tabs
  const counts = {
    "All": quotations.length,
    "Pending Review": quotations.filter(q => q.status === "Pending Review").length,
    "Accepted": quotations.filter(q => q.status === "Accepted").length,
    "Rejected": quotations.filter(q => q.status === "Rejected").length,
  };

  // Filter based on active tab and search query
  const filteredQuotations = quotations.filter((quote) => {
    const matchesTab = activeTab === "All" || quote.status === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      quote.rfqTitle.toLowerCase().includes(lowerQuery) ||
      quote.vendorName.toLowerCase().includes(lowerQuery) ||
      quote.id.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeClass = (status: QuotationStatus) => {
    switch(status) {
      case "Pending Review": return styles.badgePending;
      case "Accepted": return styles.badgeAccepted;
      case "Rejected": return styles.badgeRejected;
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
          <h1 className={styles.title}>Quotations</h1>
          <p className={styles.subtitle}>Review and manage vendor bids</p>
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
            placeholder="Search by quote ID, RFQ title, or vendor name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className={styles.tabsRow}>
          {(["All", "Pending Review", "Accepted", "Rejected"] as FilterTab[]).map(tab => (
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
                <th>Quote ID</th>
                <th>RFQ Title</th>
                <th>Vendor</th>
                <th>Submitted On</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map(quote => (
                  <tr key={quote.id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{quote.id}</td>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{quote.rfqTitle}</td>
                    <td>{quote.vendorName}</td>
                    <td>{quote.submittedAt}</td>
                    <td style={{ fontWeight: 600, color: "#10b981" }}>
                      ${quote.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={styles.viewButton}
                        onClick={() => router.push(`/quotations/review/${quote.id}`)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No quotations found matching your criteria.
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
