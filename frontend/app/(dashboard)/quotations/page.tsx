"use client";

import React, { useState, useEffect } from "react";
import { fetchRFQs, fetchQuotations, RFQ, Quotation } from "@/lib/data";
import styles from "./quotations-list.module.css";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function QuotationsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [myQuotations, setMyQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRFQs();
        setRfqs(data);
        if (user?.role === "Vendor") {
          const quotations = await fetchQuotations();
          setMyQuotations(quotations);
        }
      } catch (error) {
        console.error("Failed to load RFQs", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.role]);

  const isVendor = user?.role === "Vendor";

  const getMyStatus = (rfqId: string) => {
    const quotation = myQuotations.find((q) => q.rfqId === rfqId && q.rawStatus !== "DRAFT");
    if (!quotation) return { label: "Not Submitted", color: "#94a3b8" };
    switch (quotation.status) {
      case "Accepted": return { label: "Accepted", color: "#10b981" };
      case "Rejected": return { label: "Rejected", color: "#ef4444" };
      case "Draft": return { label: "Draft", color: "#94a3b8" };
      default: return { label: "Submitted", color: "#f59e0b" };
    }
  };

  // Vendors see RFQs they need to bid on. Officers see RFQs that have received quotes to compare.
  const displayRFQs = rfqs.filter((rfq) => {
    if (isVendor) {
      return rfq.status === "Sent" || rfq.status === "Quotes Received";
    }
    return rfq.quotesReceivedCount > 0;
  });

  const filteredRFQs = displayRFQs.filter(
    (rfq) => rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) || rfq.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255, 255, 255, 0.1)", borderRadius: "50%", borderTopColor: "#10b981", animation: "spin 1s ease-in-out infinite" }}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{isVendor ? "Submit Quotations" : "Compare Quotations"}</h1>
          <p className={styles.subtitle}>
            {isVendor ? "Review RFQs and submit your bids" : "Compare vendor quotations for active RFQs"}
          </p>
        </div>
      </div>

      <div className={styles.searchAndFilter}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search by RFQ title or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>RFQ ID</th>
                <th>Title</th>
                <th>Deadline</th>
                <th>Category</th>
                {isVendor ? <th>My Status</th> : <th>Quotes Received</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRFQs.length > 0 ? (
                filteredRFQs.map(rfq => (
                  <tr key={rfq.id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{rfq.number}</td>
                    <td style={{ fontWeight: 600, color: "#f8fafc" }}>{rfq.title}</td>
                    <td>{rfq.deadline}</td>
                    <td>{rfq.category}</td>
                    <td>
                      {isVendor ? (
                        (() => {
                          const status = getMyStatus(rfq.id);
                          return <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>;
                        })()
                      ) : (
                        <span style={{ color: "#10b981", fontWeight: 600 }}>{rfq.quotesReceivedCount} Quotes</span>
                      )}
                    </td>
                    <td>
                      {isVendor ? (
                        <button 
                          className={styles.viewButton}
                          style={{ borderColor: "#10b981", color: "#10b981" }}
                          onClick={() => router.push(`/quotations/${rfq.id}`)}
                        >
                          Submit Quote
                        </button>
                      ) : (
                        <button 
                          className={styles.viewButton}
                          style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                          onClick={() => router.push(`/rfqs/${rfq.id}/compare`)}
                        >
                          Compare Quotes
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
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
