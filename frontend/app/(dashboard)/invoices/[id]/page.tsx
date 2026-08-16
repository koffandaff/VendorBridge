"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { downloadInvoicePdf, fetchInvoiceById, markInvoicePaid, sendInvoiceEmail } from "@/lib/data";
import type { InvoiceDto } from "@/lib/types";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import styles from "./invoice.module.css";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const loadInvoice = async () => {
    const data = await fetchInvoiceById(invoiceId);
    setInvoice(data || null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadInvoice();
      } catch (error) {
        console.error("Failed to load invoice", error);
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) load();
  }, [invoiceId]);

  const handleMarkPaid = async () => {
    setActionLoading(true);
    showLoading("Processing payment...");
    try {
      await markInvoicePaid(invoiceId);
      closeAlert();
      await showModalSuccess("Success", "Payment marked as paid!");
      await loadInvoice();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to mark invoice as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    showLoading("Downloading PDF...");
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
      closeAlert();
      await showModalSuccess("Success", "Invoice PDF downloaded");
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to download PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEmailInvoice = async () => {
    setEmailLoading(true);
    showLoading("Sending email...");
    try {
      const updated = await sendInvoiceEmail(invoiceId);
      closeAlert();
      await showModalSuccess("Success", `Invoice emailed to ${updated.vendor?.name ?? "vendor"}`);
      await loadInvoice();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to send invoice email");
    } finally {
      setEmailLoading(false);
    }
  };

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

  if (!invoice) {
    return (
      <div style={{ padding: "40px", color: "#f8fafc" }}>
        <h2>Invoice Not Found</h2>
        <button
          onClick={() => router.push('/invoices')}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "8px", marginTop: "16px", cursor: "pointer" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const vendorAddress = [
    invoice.vendor?.address,
    invoice.vendor?.city,
    invoice.vendor?.state,
    invoice.vendor?.country,
  ].filter(Boolean).join(", ");

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Invoice {invoice.invoiceNumber}</h1>
          <p className={styles.subtitle}>
            {invoice.purchaseOrder?.poNumber ?? "PO"} — generated {formatDate(invoice.invoiceDate)}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.actionBtn}
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? "Downloading..." : "Download PDF"}
          </button>
          <button className={styles.actionBtn} onClick={() => window.print()}>
            Print
          </button>
          {(invoice.status === "ISSUED" || invoice.status === "SENT") && (
            <button
              className={styles.actionBtn}
              onClick={handleEmailInvoice}
              disabled={emailLoading}
            >
              {emailLoading ? "Sending..." : "Email invoice"}
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <div className={styles.infoRow}>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Bill to:</div>
            <div className={styles.infoText}>
              Your Organization<br />
              Organization HQ<br />
              GSTIN: 253834384FB
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoLabel}>Vendor</div>
            <div className={styles.infoText}>
              {invoice.vendor?.name ?? "—"}<br />
              {vendorAddress || "—"}<br />
              GSTIN: {invoice.vendor?.gstNumber ?? "—"}
            </div>
          </div>
        </div>

        <div className={styles.infoRow} style={{ padding: "16px 24px" }}>
          <div className={styles.infoColumn} style={{ gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>PO Number:</span> {invoice.purchaseOrder?.poNumber ?? "—"}
            </div>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>PO date:</span> {invoice.purchaseOrder ? formatDate(invoice.purchaseOrder.orderDate) : "—"}
            </div>
          </div>
          <div className={styles.infoColumn} style={{ gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>Invoice date:</span> {formatDate(invoice.invoiceDate)}
            </div>
            <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f8fafc" }}>
              <span style={{ color: "#94a3b8" }}>Due date:</span> {formatDate(invoice.dueDate)}
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
            {(invoice.items ?? []).length > 0 ? (
              invoice.items!.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{toNumber(item.quantity)}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                  No line items available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={styles.summaryRow}>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Tax</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className={styles.grandTotalLine}>
              <span>Grand total</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>status: <span className={styles.statusBadge}>{invoice.status}</span></span>
        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
          <button
            className={styles.markPaid}
            style={{ background: "transparent", border: "none", padding: 0 }}
            onClick={handleMarkPaid}
            disabled={actionLoading}
          >
            {actionLoading ? "Marking..." : "Mark as Paid"}
          </button>
        )}
      </div>
    </div>
  );
}