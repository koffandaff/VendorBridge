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
  Search,
  X,
} from "lucide-react";
import styles from "./activity.module.css";
import { fetchActivityLogs, type ActivityLogEntry } from "@/lib/data";
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

const ENTITY_NOUN: Record<string, string> = {
  RFQ: "RFQ",
  Quotation: "Quotation",
  PurchaseOrder: "Purchase order",
  Invoice: "Invoice",
  Vendor: "Vendor",
  User: "User",
  Approval: "Approval",
};

interface DayGroup {
  label: string;
  logs: ActivityLogEntry[];
}

function dayLabel(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Unknown date";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function timeLabel(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function groupByDay(logs: ActivityLogEntry[]): DayGroup[] {
  const groups = new Map<string, ActivityLogEntry[]>();
  for (const log of logs) {
    const label = dayLabel(log.createdAt);
    const list = groups.get(label);
    if (list) list.push(log);
    else groups.set(label, [log]);
  }
  return Array.from(groups, ([label, items]) => ({ label, logs: items }));
}

function getEntityIcon(type: string) {
  switch (type) {
    case "RFQ": return <FileText size={18} />;
    case "Quotation": return <CheckCircle size={18} />;
    case "PurchaseOrder": return <ShoppingCart size={18} />;
    case "Invoice": return <Receipt size={18} />;
    case "Vendor": return <Building size={18} />;
    case "User": return <UserRound size={18} />;
    case "Approval": return <Stamp size={18} />;
    default: return <FileText size={18} />;
  }
}

export default function ActivityLogsPage() {
  const [query, setQuery] = useState<{ tab: Tab; page: number }>({ tab: "All", page: 1 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [totalItems, setTotalItems] = useState(0);
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
          action: search || undefined,
          page: query.page,
          limit: 50,
        });
        if (cancelled) return;
        setLogs(result.items);
        setTotalItems(result.pagination.totalItems);
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
  }, [query, search, reloadKey]);

  const selectTab = (tab: Tab) => {
    setLoading(true);
    setQuery({ tab, page: 1 });
  };

  const goToPage = (page: number) => {
    setLoading(true);
    setQuery((prev) => ({ ...prev, page }));
  };

  const applySearch = () => {
    setLoading(true);
    setSearch(searchInput.trim());
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const clearSearch = () => {
    setSearchInput("");
    setLoading(true);
    setSearch("");
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const groups = groupByDay(logs);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Activity &amp; Logs</h1>
            <p className={styles.subtitle}>Procurement audit trail</p>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Search actions — e.g. created, invoice, user…"
              aria-label="Search activity logs"
            />
            {searchInput ? (
              <button className={styles.clearButton} onClick={clearSearch} aria-label="Clear search">
                <X size={15} />
              </button>
            ) : null}
            <button className={styles.searchButton} onClick={applySearch}>
              Search
            </button>
          </div>
          <div className={styles.resultCount}>
            {loading ? "Loading…" : `${totalItems} ${totalItems === 1 ? "activity" : "activities"}`}
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
            <div className={styles.stateContainer}>
              <div className={styles.spinner} />
            </div>
          ) : error ? (
            <div className={styles.stateContainer}>
              <div className={styles.stateText}>{error}</div>
              <button className={styles.retryButton} onClick={retry}>
                Try again
              </button>
            </div>
          ) : groups.length > 0 ? (
            <>
              <div className={styles.timelineList}>
                {groups.map((group) => (
                  <div key={group.label} className={styles.dayGroup}>
                    <div className={styles.dayHeader}>
                      <span>{group.label}</span>
                      <span className={styles.dayCount}>{group.logs.length}</span>
                    </div>
                    {group.logs.map((log) => (
                      <div key={log.id} className={styles.timelineItem}>
                        <div className={`${styles.iconWrapper} ${ICON_CLASS[log.entityType] ?? styles.RFQ}`}>
                          {getEntityIcon(log.entityType)}
                        </div>
                        <div className={styles.contentWrapper}>
                          <div className={styles.description}>
                            {log.actionLabel}
                            <span className={styles.entityBadge}>{ENTITY_NOUN[log.entityType] ?? log.entityType}</span>
                          </div>
                          <div className={styles.meta}>{log.description}</div>
                        </div>
                        <span className={styles.timestamp}>{timeLabel(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <span className={styles.paginationInfo}>
                    Page {query.page} of {totalPages}
                  </span>
                  <div className={styles.pageButtons}>
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
              {search ? (
                <>
                  No results for &ldquo;{search}&rdquo;.
                  <span className={styles.emptyHint}>Try a different keyword or clear the search.</span>
                </>
              ) : (
                <>
                  No activity yet.
                  <span className={styles.emptyHint}>Actions like creating RFQs or purchase orders will appear here.</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}