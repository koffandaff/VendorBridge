"use client";

import React, { useState } from "react";
import { FileText, CheckCircle, Receipt, Building, Info } from "lucide-react";
import styles from "./activity.module.css";

type EntityType = "RFQ" | "Approvals" | "Invoices" | "Vendors";

interface ActivityLog {
  id: string;
  entityType: EntityType;
  description: React.ReactNode;
  timestamp: string;
}

import { MOCK_ACTIVITY_LOGS } from "@/lib/mockData";
type FilterTab = "All" | EntityType;

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [logs, setLogs] = useState(MOCK_ACTIVITY_LOGS);

  const filteredLogs = logs.filter(log => 
    activeTab === "All" || log.entityType === activeTab
  );

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case "RFQ": return <FileText size={20} />;
      case "Approvals": return <CheckCircle size={20} />;
      case "Invoices": return <Receipt size={20} />;
      case "Vendors": return <Building size={20} />;
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
        {(["All", "RFQ", "Approvals", "Invoices", "Vendors"] as FilterTab[]).map(tab => (
          <button 
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className={styles.timelineContainer}>
        {filteredLogs.length > 0 ? (
          <div className={styles.timelineList}>
            {filteredLogs.map(log => (
              <div key={log.id} className={styles.timelineItem}>
                <div className={`${styles.iconWrapper} ${styles[log.entityType]}`}>
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

      {/* Backend Reminder Banner */}
      <div className={styles.infoBanner}>
        <div className={styles.infoBannerText}>
          <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Backend Implementation Note:</strong><br/>
            Audit logs must be immutable. These entries must be write-once, with no edit or delete functionality. Your DB schema should reflect this (no soft-delete on log records).
          </div>
        </div>
      </div>
    </div>
  );
}
