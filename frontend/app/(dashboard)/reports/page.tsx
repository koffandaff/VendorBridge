"use client";

import React, { useState } from "react";
import { Download, TrendingUp, DollarSign, Users, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./reports.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

import { fetchAnalyticsStats, fetchReportsOverview } from "@/lib/data";
import type { ReportsOverviewDto } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, toNumber } from "@/lib/format";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(15,17,21,0.9)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
        <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
        <p style={{ color: "#10b981", fontSize: "16px", fontWeight: 700 }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [overview, setOverview] = useState<ReportsOverviewDto | null>(null);
  const [stats, setStats] = useState({ activeRfqs: 0, pendingApprovals: 0, posThisMonth: 0, overdueInvoices: 0 });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    Promise.all([fetchReportsOverview(), fetchAnalyticsStats()])
      .then(([overviewData, statsData]) => {
        setOverview(overviewData);
        setStats(statsData);
        if (overviewData.spendingTrend.length > 0) {
          setSelectedMonth(overviewData.spendingTrend[overviewData.spendingTrend.length - 1].name);
        }
      })
      .catch((error) => console.error("Failed to load reports", error))
      .finally(() => setLoading(false));
  }, []);

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

  if (!overview) {
    return (
      <div style={{ padding: "40px", color: "#94a3b8" }}>
        <h2>Reports unavailable</h2>
        <p style={{ marginTop: "8px" }}>Unable to load analytics data right now.</p>
      </div>
    );
  }

  const totalSpend = overview.spendingTrend.reduce((acc, point) => acc + toNumber(point.spend), 0);
  const activeVendors = overview.vendorStatusCounts?.ACTIVE ?? 0;
  const totalPOs = overview.recentPos.length;
  const fulfilledPOs = overview.recentPos.filter((po) => po.status === "COMPLETED").length;
  const fulfillmentRate = totalPOs > 0 ? Math.round((fulfilledPOs / totalPOs) * 100) : 0;

  const poCountByVendor: Record<string, number> = {};
  overview.recentPos.forEach((po) => {
    poCountByVendor[po.vendor] = (poCountByVendor[po.vendor] ?? 0) + 1;
  });

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];
  const SPEND_BY_CATEGORY = overview.spendByCategory
    .map((cat, idx) => ({
      name: cat.name,
      value: toNumber(cat.spend),
      color: colors[idx % colors.length],
      percentage: totalSpend > 0 ? Math.round((toNumber(cat.spend) / totalSpend) * 100) : 0
    }));

  const TOP_VENDORS = overview.topVendors
    .slice(0, 5)
    .map((vendor) => ({
      name: vendor.name,
      spend: toNumber(vendor.spend),
      pos: poCountByVendor[vendor.name] ?? 0
    }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Reports & Analytics</h1>
          <p className={styles.subtitle}>Procurement Insights{selectedMonth ? ` - ${selectedMonth}` : ""}</p>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.monthPicker}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {overview.spendingTrend.length > 0 ? (
              overview.spendingTrend.map((point) => (
                <option key={point.name} value={point.name}>{point.name}</option>
              ))
            ) : (
              <option value="">No data</option>
            )}
          </select>
          <button
            className={styles.exportButton}
            onClick={() => console.log("Export not available")}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <DollarSign size={16} color="#3b82f6" />
            Total Spend
          </div>
          <div className={styles.statCardValue}>{formatCurrencyCompact(totalSpend)}</div>
          <div className={styles.statCardTrend}>
            <TrendingUp size={14} className={styles.trendUp} />
            <span style={{ color: "#64748b", marginLeft: "4px" }}>last 6 months</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <Users size={16} color="#8b5cf6" />
            Active Vendors
          </div>
          <div className={styles.statCardValue}>{activeVendors}</div>
          <div className={styles.statCardTrend}>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>registered suppliers</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <CheckCircle size={16} color="#10b981" />
            PO Fulfilled
          </div>
          <div className={styles.statCardValue}>{totalPOs > 0 ? `${fulfillmentRate}%` : "—"}</div>
          <div className={styles.statCardTrend}>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>
              {fulfilledPOs} of {totalPOs} recent orders
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <AlertCircle size={16} color="#ef4444" />
            Overdue Invoices
          </div>
          <div className={styles.statCardValue}>{stats.overdueInvoices}</div>
          <div className={styles.statCardTrend}>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>need attention</span>
          </div>
        </div>
      </div>

      {/* Two Columns */}
      <div className={styles.twoColumnGrid}>
        {/* Spend By Category */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Spend by Category</h2>
          <div className={styles.categoryList}>
            {SPEND_BY_CATEGORY.length > 0 ? (
              SPEND_BY_CATEGORY.map((cat, idx) => (
                <div key={idx} className={styles.categoryItem}>
                  <div className={styles.categoryHeader}>
                    <span className={styles.categoryName}>{cat.name}</span>
                    <span className={styles.categoryValue}>{formatCurrencyCompact(cat.value)}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#64748b", fontSize: "14px" }}>No spend data available.</p>
            )}
          </div>
        </div>

        {/* Top Vendors */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top Vendors by Spend</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Spend ($)</th>
                  <th style={{ textAlign: "right" }}>PO&apos;s</th>
                </tr>
              </thead>
              <tbody>
                {TOP_VENDORS.length > 0 ? (
                  TOP_VENDORS.map((vendor, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{vendor.name}</td>
                      <td style={{ color: "#10b981", fontWeight: 600 }}>{formatCurrency(vendor.spend)}</td>
                      <td style={{ textAlign: "right", color: "#94a3b8" }}>{vendor.pos}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No vendor spend data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Monthly Spend Trend</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                {overview.spendingTrend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === overview.spendingTrend.length - 1 ? "#10b981" : "rgba(16, 185, 129, 0.3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}