"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_PURCHASE_ORDERS } from "@/lib/mockData";
import styles from "./invoice.module.css";
import { showLoading, showModalSuccess, closeAlert } from "@/lib/alerts";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const po = MOCK_PURCHASE_ORDERS.find((p) => p.id === poId) || {
    id: "PO-001",
    poNumber: "PO-2025-0068",
    vendor: "Infra supplies pvt ltd",
    poDate: "21 may, 2025",
    grandTotal: 200010,
    status: "Pending Payment"
  };

  const invoiceNumber = `INV-${po.poNumber.replace('PO-', '')}`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Purchase Order & Invoice</h1>
          <p className={styles.subtitle}>
            PO-2024-auto-generated after approval
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn}>Download PDF</button>
          <button className={styles.actionBtn}>Print</button>
          <button className={styles.actionBtn}>Email invoice</button>
        </div>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <div className={styles.infoRow}>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Bill to:</div>
            <div className={styles.infoText}>
              your Organization Name<br />
              123 business park, ahmedabad<br />
              GSTIN:253834384FB
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Vendor</div>
            <div className={styles.infoText}>
              {po.vendor}<br />
              456, industrial estate, surat<br />
              GSTIN: 343434DB4523
            </div>
          </div>
        </div>
        
        <div className={styles.infoRow} style={{ padding: "16px 24px" }}>
          <div className={styles.infoColumn} style={{ gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>PO Number:</span> {po.poNumber}
            </div>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>PO date:</span> {po.poDate}
            </div>
          </div>
          <div className={styles.infoColumn} style={{ gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>invoice date:</span> 22 may 2025
            </div>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>Due date:</span> 21 june 2025
            </div>
          </div>
        </div>
      </div>

      {/* Table & Summary */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ width: "100px" }}>Qty</th>
              <th style={{ width: "200px" }}>Unit price</th>
              <th style={{ width: "200px" }} className={styles.alignRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ergonomic chair</td>
              <td>25</td>
              <td>3500</td>
              <td className={styles.alignRight}>87,500</td>
            </tr>
            <tr>
              <td>Tech Core LTD</td>
              <td>10</td>
              <td>8,200</td>
              <td className={styles.alignRight}>82000</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.summaryRow}>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>1,69,500</span>
            </div>
            <div className={styles.summaryLine}>
              <span>CGST(9%)</span>
              <span>15,255</span>
            </div>
            <div className={styles.summaryLine}>
              <span>SGST(9%)</span>
              <span>15,255</span>
            </div>
            <div className={styles.grandTotalLine}>
              <span>Grand total</span>
              <span>2,00,010</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>status: <span className={styles.statusBadge}>Pending Payment</span></span>
        <button 
          className={styles.markPaid} 
          style={{ background: "transparent", border: "none", padding: 0 }}
          onClick={async () => {
            showLoading("Processing payment...");
            await new Promise(resolve => setTimeout(resolve, 800));
            closeAlert();
            await showModalSuccess("Success", "Payment marked as paid!");
            router.push('/invoices');
          }}
        >
          Mark as Paid
        </button>
      </div>
    </div>
  );
}
