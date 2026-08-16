"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  Receipt,
  Building,
  ShoppingCart,
  UserRound,
  Stamp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "./activity.module.css";
import { fetchActivityLogs } from "@/lib/data";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

type Tab = "All" | "RFQ" | "Quotation" | "PurchaseOrder" | "Invoice" | "Vendor" | "User" | "Approval";

const TABS: Tab[] = ["All", "RFQ", "Quotation", "PurchaseOrder", "Invoice", "Vendor", "User", "Approval"];

const TAB_LABEL: Record<Tab, string> = {
  All: "All",
  RFQ: "RFQ",
  Quotation: "Quotation",
  PurchaseOrder: "Purchase Orders",
  Invoice: "Invoice",
  Vendor: "Vendor",
  User: "User",
  Approval: "Approval",
};

const ICON_CLASS: Record<string, string> = {
  RFQ: styles.RFQ,
  Quotation: styles.Approvals,
  PurchaseOrder: styles.RFQ,
  Invoice: styles.Invoices,
  Vendor: styles.Vendors,
  User: styles.Users,
  Approval: styles.Approvals,
};

interface ActivityLog {
  id: string;
  entityType: string;
  description: string;
  timestamp: string;
}

export default function ActivityLogsPage() {
  const [query, setQuery] = useState<{ tab: Tab; page: number }>({ tab: "All", page: 1 });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await fetchActivityLogs({
          entityType: query.tab === "All" ? undefined : query.tab,
          page: query.page,
          limit: 50,
        });
        if (cancelled) return;
        setLogs(result.items);
        setTotalPages(result.pagination.totalPages);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load activity logs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  const selectTab = (tab: Tab) => {
    setLoading(true);
    setQuery({ tab, page: 1 });
  };

  const goToPage = (page: number) => {
    setLoading(true);
    setQuery((prev) => ({ ...prev, page }));
  };

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "RFQ": return <FileText size={20} />;
      case "Quotation": return <CheckCircle size={20} />;
      case "PurchaseOrder": return <ShoppingCart size={20} />;
      case "Invoice": return <Receipt size={20} />;
      case "Vendor": return <Building size={20} />;
      case "User": return <UserRound size={20} />;
      case "Approval": return <Stamp size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Activity & Logs</h1>
            <p className={styles.subtitle}>Procurement audit trail</p>
          </div>
        </div>

        <div className={styles.tabsRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${query.tab === tab ? styles.activeTab : ""}`}
              onClick={() => selectTab(tab)}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>

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
          ) : error ? (
            <div className={styles.stateContainer}>
              <div className={styles.stateText}>{error}</div>
              <button
                className={styles.retryButton}
                onClick={retry}
              >
                Retry
              </button>
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className={styles.timelineList}>
                {logs.map((log) => (
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
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span className={styles.paginationInfo}>
                    Page {query.page} of {totalPages}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className={styles.pageButton}
                      onClick={() => goToPage(Math.max(1, query.page - 1))}
                      disabled={query.page <= 1}
                    >
                      <ChevronLeft size={15} />
                      Previous
                    </button>
                    <button
                      className={styles.pageButton}
                      onClick={() => goToPage(Math.min(totalPages, query.page + 1))}
                      disabled={query.page >= totalPages}
                    >
                      Next
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              No activity logs found for this filter.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}