"use client";

import React, { useState } from "react";
import { Download, TrendingUp, TrendingDown, DollarSign, Users, CheckCircle, AlertCircle } from "lucide-react";
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

import { fetchVendors, fetchRecentPOs, fetchSpendingTrends, Vendor, ChartDataPoint, RecentPO } from "@/lib/data";

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("May 2025");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentPOs, setRecentPOs] = useState<RecentPO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  React.useEffect(() => {
    Promise.all([fetchSpendingTrends(), fetchRecentPOs(), fetchVendors()]).then(([chart, pos, vends]) => {
      setChartData(chart);
      setRecentPOs(pos);
      setVendors(vends);
    });
  }, []);

  // Compute metrics
  const totalSpend = recentPOs.reduce((acc, po) => acc + parseFloat(po.amount.replace(/[^0-9.-]+/g,"")), 0);
  
  const activeVendors = vendors.filter(v => v.status === "Active").length;
  
  // Spend by Category
  const categoryTotals: Record<string, number> = {};
  recentPOs.forEach(po => {
    const v = vendors.find(vend => vend.name === po.vendor);
    const cat = v ? v.category : "Other";
    const amt = parseFloat(po.amount.replace(/[^0-9.-]+/g,""));
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  });

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];
  const SPEND_BY_CATEGORY = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length],
      percentage: totalSpend > 0 ? Math.round((value / totalSpend) * 100) : 0
    }));

  // Top Vendors
  const vendorTotals: Record<string, { spend: number, pos: number }> = {};
  recentPOs.forEach(po => {
    const amt = parseFloat(po.amount.replace(/[^0-9.-]+/g,""));
    if (!vendorTotals[po.vendor]) vendorTotals[po.vendor] = { spend: 0, pos: 0 };
    vendorTotals[po.vendor].spend += amt;
    vendorTotals[po.vendor].pos += 1;
  });
  
  const TOP_VENDORS = Object.entries(vendorTotals)
    .sort(([, a], [, b]) => b.spend - a.spend)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      spend: data.spend,
      pos: data.pos
    }));

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
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
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Reports & Analytics</h1>
          <p className={styles.subtitle}>Procurement Insights - {selectedMonth}</p>
        </div>
        <div className={styles.headerRight}>
          <select 
            className={styles.monthPicker} 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="May 2025">May 2025</option>
            <option value="Apr 2025">Apr 2025</option>
            <option value="Mar 2025">Mar 2025</option>
            <option value="Feb 2025">Feb 2025</option>
            <option value="Jan 2025">Jan 2025</option>
            <option value="Dec 2024">Dec 2024</option>
          </select>
          <button className={styles.exportButton}>
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
          <div className={styles.statCardValue}>${totalSpend.toLocaleString()}</div>
          <div className={styles.statCardTrend}>
            <TrendingUp size={14} className={styles.trendUp} />
            <span className={styles.trendUp}>+12.5%</span>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>vs last month</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <Users size={16} color="#8b5cf6" />
            Active Vendors
          </div>
          <div className={styles.statCardValue}>{activeVendors}</div>
          <div className={styles.statCardTrend}>
            <TrendingUp size={14} className={styles.trendUp} />
            <span className={styles.trendUp}>+3</span>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>new this month</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <CheckCircle size={16} color="#10b981" />
            PO Fulfilled
          </div>
          <div className={styles.statCardValue}>94%</div>
          <div className={styles.statCardTrend}>
            <TrendingUp size={14} className={styles.trendUp} />
            <span className={styles.trendUp}>+2.1%</span>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>improvement</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardTitle}>
            <AlertCircle size={16} color="#ef4444" />
            Overdue Invoices
          </div>
          <div className={styles.statCardValue}>3</div>
          <div className={styles.statCardTrend}>
            <TrendingDown size={14} className={styles.trendDown} />
            <span className={styles.trendDown}>-2</span>
            <span style={{ color: "#64748b", marginLeft: "4px" }}>vs last month</span>
          </div>
        </div>
      </div>

      {/* Two Columns */}
      <div className={styles.twoColumnGrid}>
        {/* Spend By Category */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Spend by Category</h2>
          <div className={styles.categoryList}>
            {SPEND_BY_CATEGORY.map((cat, idx) => (
              <div key={idx} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryName}>{cat.name}</span>
                  <span className={styles.categoryValue}>{formatCurrency(cat.value)}</span>
                </div>
                <div className={styles.barTrack}>
                  <div 
                    className={styles.barFill} 
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} 
                  />
                </div>
              </div>
            ))}
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
                  <th style={{ textAlign: "right" }}>PO's</th>
                </tr>
              </thead>
              <tbody>
                {TOP_VENDORS.map((vendor, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{vendor.name}</td>
                    <td style={{ color: "#10b981", fontWeight: 600 }}>{formatCurrency(vendor.spend)}</td>
                    <td style={{ textAlign: "right", color: "#94a3b8" }}>{vendor.pos}</td>
                  </tr>
                ))}
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
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                tickFormatter={(val) => `$${val/1000}k`}
              />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
              <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? "#10b981" : "rgba(16, 185, 129, 0.3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
