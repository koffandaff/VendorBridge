"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import styles from "./dashboard-page.module.css";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  fetchDashboardStats, 
  fetchRecentPOs, 
  fetchSpendingTrends,
  DashboardStats,
  RecentPO,
  ChartDataPoint
} from "@/lib/data";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPOs, setRecentPOs] = useState<RecentPO[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, posData, trendsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentPOs(),
          fetchSpendingTrends()
        ]);
        setStats(statsData);
        setRecentPOs(posData);
        setChartData(trendsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case "Approved": return styles.badgeApproved;
      case "Pending": return styles.badgePending;
      case "Draft": return styles.badgeDraft;
      default: return "";
    }
  };

  if (loading || !stats) {
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
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Welcome back, {user?.username || "Guest"} - {user?.role || "User"} - Today's Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <span className={styles.cardHeader}>Active RFQs</span>
          <span className={styles.cardValue}>{stats.activeRfqs}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardHeader}>Pending Approvals</span>
          <span className={styles.cardValue}>{stats.pendingApprovals}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardHeader}>PO's this month</span>
          <span className={styles.cardValue}>{stats.posThisMonth}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardHeader}>Overdue Invoices</span>
          <span className={styles.cardValue}>{stats.overdueInvoices}</span>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className={styles.mainContent}>
        {/* Left Column: Recent POs */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Recent Purchase Orders</h2>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PO#</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.map((po) => (
                  <tr key={po.id}>
                    <td>{po.id}</td>
                    <td>{po.vendor}</td>
                    <td>{po.amount}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Spending Trends */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Spending Trends (Last 6 Months)</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#1e293b', stroke: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className={styles.actionsRow}>
        <button 
          className={styles.actionButton}
          onClick={() => router.push("/rfqs")}
        >
          + New RFQ
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => router.push("/vendors")}
        >
          Add Vendor
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => router.push("/invoices")}
        >
          View Invoices
        </button>
      </div>
    </div>
  );
}
