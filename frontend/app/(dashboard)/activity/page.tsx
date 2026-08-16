"use client";

import React, { useState, useEffect } from "react";
import { FileText, CheckCircle, Receipt, Building, ShoppingCart } from "lucide-react";
import styles from "./activity.module.css";
import { fetchActivityLogs } from "@/lib/data";

type FilterTab = "All" | "RFQ" | "Quotation" | "PurchaseOrder" | "Invoice" | "Vendor";

interface ActivityLog {
  id: string;
  entityType: string;
  description: string;
  timestamp: string;
}

const TABS: FilterTab[] = ["All", "RFQ", "Quotation", "PurchaseOrder", "Invoice", "Vendor"];

const ICON_CLASS: Record<string, string> = {
  RFQ: styles.RFQ,
  Quotation: styles.Approvals,
  PurchaseOrder: styles.RFQ,
  Invoice: styles.Invoices,
  Vendor: styles.Vendors,
};

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActivityLogs();
        setLogs(data);
      } catch (error) {
        console.error("Failed to load activity logs", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLogs = logs.filter(log =>
    activeTab === "All" || log.entityType === activeTab
  );

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "RFQ": return <FileText size={20} />;
      case "Quotation": return <CheckCircle size={20} />;
      case "PurchaseOrder": return <ShoppingCart size={20} />;
      case "Invoice": return <Receipt size={20} />;
      case "Vendor": return <Building size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Activity & Logs</h1>
          <p className={styles.subtitle}>Procurement audit trail</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "PurchaseOrder" ? "Purchase Orders" : tab}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className={styles.timelineContainer}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              borderTopColor: "#10b981",
              animation: "spin 1s ease-in-out infinite"
            }}></div>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className={styles.timelineList}>
            {filteredLogs.map(log => (
              <div key={log.id} className={styles.timelineItem}>
                <div className={`${styles.iconWrapper} ${ICON_CLASS[log.entityType] ?? styles.RFQ}`}>
                  {getEntityIcon(log.entityType)}
                </div>
                <div className={styles.contentWrapper}>
                  <div className={styles.description}>{log.description}</div>
                  <div className={styles.timestamp}>{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No activity logs found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}