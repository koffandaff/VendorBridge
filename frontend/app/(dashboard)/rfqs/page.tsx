"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, GitCompareArrows, Send, XCircle } from "lucide-react";
import styles from "./rfqs-list.module.css";
import { fetchRFQs, updateRfqStatus, RFQ, RFQStatus } from "@/lib/data";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import { useAuth } from "@/lib/AuthContext";

type FilterTab = "All" | "Draft" | "Sent" | "Quotes Received" | "Closed";

const TABS: FilterTab[] = ["All", "Draft", "Sent", "Quotes Received", "Closed"];

export default function RFQListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isProcurementStaff =
    user?.role === "Admin" || user?.role === "Procurement Officer";
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const loadRfqs = async () => {
    const data = await fetchRFQs();
    setRfqs(data);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadRfqs();
      } catch (error) {
        console.error("Failed to load RFQs", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const counts: Record<FilterTab, number> = {
    All: rfqs.length,
    Draft: rfqs.filter((rfq) => rfq.status === "Draft").length,
    Sent: rfqs.filter((rfq) => rfq.status === "Sent").length,
    "Quotes Received": rfqs.filter((rfq) => rfq.status === "Quotes Received").length,
    Closed: rfqs.filter((rfq) => rfq.status === "Closed").length,
  };

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesTab = activeTab === "All" || rfq.status === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      rfq.title.toLowerCase().includes(lowerQuery) ||
      rfq.number.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusClass = (status: RFQStatus) => {
    switch (status) {
      case "Draft": return styles.badgeDraft;
      case "Sent": return styles.badgeSent;
      case "Quotes Received": return styles.badgeQuotes;
      case "Closed": return styles.badgeClosed;
      default: return "";
    }
  };

  const handleOpen = async (rfq: RFQ) => {
    try {
      showLoading(`Opening RFQ ${rfq.number}...`);
      await updateRfqStatus(rfq.id, "OPEN");
      closeAlert();
      await showModalSuccess("Success", `RFQ ${rfq.number} opened for quotes`);
      await loadRfqs();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to open RFQ");
    }
  };

  const handleClose = async (rfq: RFQ) => {
    try {
      showLoading(`Closing RFQ ${rfq.number}...`);
      await updateRfqStatus(rfq.id, "CLOSED");
      closeAlert();
      await showModalSuccess("Success", `RFQ ${rfq.number} closed`);
      await loadRfqs();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to close RFQ");
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
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>RFQ&apos;s</h1>
          <p className={styles.subtitle}>Create and manage requests for quotation</p>
        </div>
        <button className={styles.addButton} onClick={() => router.push("/rfqs/new")}>
          <Plus size={18} />
          <span>New RFQ</span>
        </button>
      </div>

      <div className={styles.searchAndFilter}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by RFQ number or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.tabsRow}>
          {TABS.map((tab) => (
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
                <th>RFQ Number</th>
                <th>Title</th>
                <th>Category</th>
                <th>Deadline</th>
                <th>Vendors</th>
                <th>Quotes</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRFQs.length > 0 ? (
                filteredRFQs.map((rfq) => (
                  <tr key={rfq.id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{rfq.number}</td>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{rfq.title}</td>
                    <td>{rfq.category}</td>
                    <td>{rfq.deadline}</td>
                    <td>{rfq.vendorsAssignedCount}</td>
                    <td>{rfq.quotesReceivedCount}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusClass(rfq.status)}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button className={styles.viewButton} onClick={() => router.push(`/rfqs/${rfq.id}`)}>
                          <Eye size={14} /> View
                        </button>
                        {isProcurementStaff && rfq.rawStatus === "DRAFT" && (
                          <button
                            className={`${styles.viewButton} ${styles.openButton}`}
                            onClick={() => handleOpen(rfq)}
                          >
                            <Send size={14} /> Open
                          </button>
                        )}
                        {isProcurementStaff && rfq.rawStatus === "OPEN" && (
                          <button
                            className={`${styles.viewButton} ${styles.closeButton}`}
                            onClick={() => handleClose(rfq)}
                          >
                            <XCircle size={14} /> Close
                          </button>
                        )}
                        {rfq.quotesReceivedCount > 0 && (
                          <button
                            className={`${styles.viewButton} ${styles.compareButton}`}
                            onClick={() => router.push(`/rfqs/${rfq.id}/compare`)}
                          >
                            <GitCompareArrows size={14} /> Compare
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
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