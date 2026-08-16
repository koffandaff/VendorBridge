"use client";

import React from "react";
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

// Mock Data
const MOCK_STATS = {
  activeRfqs: 12,
  pendingApprovals: 5,
  posThisMonth: "$ 24,500",
  overdueInvoices: 3
};

const MOCK_RECENT_POS = [
  { id: "PO-2023-001", vendor: "TechCorp Inc.", amount: "$4,500", status: "Approved" },
  { id: "PO-2023-002", vendor: "Office Supplies Co.", amount: "$850", status: "Pending" },
  { id: "PO-2023-003", vendor: "Global Logistics", amount: "$12,400", status: "Approved" },
  { id: "PO-2023-004", vendor: "Marketing Solutions", amount: "$3,200", status: "Draft" },
  { id: "PO-2023-005", vendor: "Software Systems", amount: "$1,850", status: "Pending" },
];

const MOCK_CHART_DATA = [
  { name: "Jan", spend: 12000 },
  { name: "Feb", spend: 19000 },
  { name: "Mar", spend: 15000 },
  { name: "Apr", spend: 22000 },
  { name: "May", spend: 18000 },
  { name: "Jun", spend: 24500 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case "Approved": return styles.badgeApproved;
      case "Pending": return styles.badgePending;
      case "Draft": return styles.badgeDraft;
      default: return "";
    }
  };

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
          <span className={styles.cardValue}>{MOCK_STATS.activeRfqs}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardHeader}>Pending Approvals</span>
          <span className={styles.cardValue}>{MOCK_STATS.pendingApprovals}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardHeader}>PO's this month</span>
          <span className={styles.cardValue}>{MOCK_STATS.posThisMonth}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardHeader}>Overdue Invoices</span>
          <span className={styles.cardValue}>{MOCK_STATS.overdueInvoices}</span>
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
                {MOCK_RECENT_POS.map((po) => (
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
              <LineChart data={MOCK_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  itemStyle={{ color: '#00ff88' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#00ff88" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#18181b', stroke: '#00ff88', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#00ff88' }}
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
          onClick={() => console.log("Navigate to New RFQ")}
        >
          + New RFQ
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => console.log("Navigate to Add Vendor")}
        >
          Add Vendor
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => console.log("Navigate to View Invoices")}
        >
          View Invoices
        </button>
      </div>
    </div>
  );
}
