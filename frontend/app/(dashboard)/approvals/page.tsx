"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, Star, ArrowLeft, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./approvals.module.css";

import { fetchQuotations, rejectQuotation, selectQuotation, Quotation } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default function ApprovalWorkflowPage() {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchQuotations();
        const pending = data.filter(
          (q) => q.rawStatus === "SUBMITTED" || q.rawStatus === "UNDER_REVIEW"
        );
        setQuotes(pending);
      } catch (error) {
        console.error("Failed to load approvals", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadPending = async () => {
    const data = await fetchQuotations();
    const pending = data.filter(
      (q) => q.rawStatus === "SUBMITTED" || q.rawStatus === "UNDER_REVIEW"
    );
    setQuotes(pending);
    setQuoteIndex(0);
    setRemarks("");
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

  const quote = quotes[quoteIndex];

  if (!quote) {
    return (
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Approval Workflow</h1>
            <p className={styles.subtitle}>Review and approve vendor quotations</p>
          </div>
          <button
            className={styles.rejectButton}
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "#94a3b8" }}
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "60px", background: "rgba(30, 41, 59, 0.4)", borderRadius: "20px" }}>
          <Inbox size={40} style={{ color: "#64748b", marginBottom: "16px" }} />
          <p style={{ color: "#94a3b8", fontSize: "16px" }}>No quotations pending approval right now.</p>
        </div>
      </div>
    );
  }

  const APPROVAL_DATA = {
    rfqTitle: quote.rfqTitle,
    vendorName: quote.vendorName,
    totalAmount: quote.grandTotal,
    deliveryDays: quote.deliveryDays,
    vendorRating: quote.vendorRating,
    currentStepIndex: quote.status === "Accepted" ? 3 : 1,
    steps: [
      { label: "Submitted" },
      { label: "L1 Review" },
      { label: "L2 Approval" },
      { label: "Generate PO" }
    ],
    approvers: [
      {
        id: "a1",
        name: "Procurement Manager (L1)",
        role: "Reviewer",
        status: "current",
        statusText: "Pending Review",
        initials: "L1"
      },
      {
        id: "a2",
        name: "Finance Director (L2)",
        role: "Approver",
        status: "future",
        statusText: "Waiting on L1",
        initials: "L2"
      },
      {
        id: "a3",
        name: "System",
        role: "Automated PO Generation",
        status: "future",
        statusText: "Waiting on Approvals",
        initials: "SYS"
      }
    ]
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject" && !remarks.trim()) {
      toast.error("Remarks are required to reject an approval.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (action === "approve") {
        await selectQuotation(quote.id);
        toast.success("Quotation approved successfully!");
      } else {
        await rejectQuotation(quote.id);
        toast.error("Quotation rejected.");
      }
      await loadPending();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Approval Workflow</h1>
          <p className={styles.subtitle}>
            {quotes.length > 1 && (
              <span style={{ marginRight: "8px" }}>({quoteIndex + 1} of {quotes.length})</span>
            )}
            RFQ: {APPROVAL_DATA.rfqTitle} &mdash; Vendor: {APPROVAL_DATA.vendorName} &mdash; {formatCurrency(APPROVAL_DATA.totalAmount)}
          </p>
        </div>
      </div>

      {/* Custom Stepper */}
      <div className={styles.stepperContainer}>
        <div className={styles.stepperLine}></div>
        {APPROVAL_DATA.steps.map((step, index) => {
          const isCompleted = index < APPROVAL_DATA.currentStepIndex;
          const isCurrent = index === APPROVAL_DATA.currentStepIndex;

          let stepClass = "";
          if (isCompleted) stepClass = styles.stepCompleted;
          else if (isCurrent) stepClass = styles.stepCurrent;

          return (
            <div key={index} className={`${styles.stepItem} ${stepClass}`}>
              <div className={styles.stepIcon}>
                {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={12} fill={isCurrent ? "currentColor" : "none"} />}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.gridContainer}>
        {/* Left Column: Approval Chain */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Approval Chain</h2>
          <div className={styles.approverList}>
            {APPROVAL_DATA.approvers.map((approver) => (
              <div key={approver.id} className={styles.approverItem}>
                <div className={styles.avatar}>{approver.initials}</div>
                <div className={styles.approverInfo}>
                  <div className={styles.approverName}>{approver.name}</div>
                  <div className={styles.approverRole}>{approver.role}</div>
                  <div className={`${styles.approverStatus} ${
                    approver.status === "completed" ? styles.statusCompleted :
                    approver.status === "current" ? styles.statusPending : styles.statusFuture
                  }`}>
                    {approver.status === "completed" && <CheckCircle2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />}
                    {approver.status === "current" && <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />}
                    {approver.statusText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Summary & Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Quotation Summary</h2>
            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Vendor Name</span>
                <span className={styles.summaryValue}>{APPROVAL_DATA.vendorName}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Delivery Timeline</span>
                <span className={styles.summaryValue}>{APPROVAL_DATA.deliveryDays > 0 ? `${APPROVAL_DATA.deliveryDays} Days` : "—"}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Vendor Rating</span>
                <span className={styles.summaryValue} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  {APPROVAL_DATA.vendorRating !== null && APPROVAL_DATA.vendorRating !== undefined ? `${APPROVAL_DATA.vendorRating} / 5.0` : "Not Rated"}
                </span>
              </div>
              <div className={styles.summaryItem} style={{ borderBottom: "none", paddingTop: "8px" }}>
                <span className={styles.summaryLabel}>Grand Total</span>
                <span className={styles.totalValue}>
                  {formatCurrency(APPROVAL_DATA.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks & Buttons */}
          <div className={styles.remarksContainer}>
            <label className={styles.remarksLabel}>Approval Remarks</label>
            <textarea
              className={styles.remarksTextarea}
              placeholder="Add your comments or conditions (required for rejection)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isSubmitting}
            />

            <div className={styles.actionsContainer}>
              <button
                className={styles.rejectButton}
                onClick={() => handleAction("reject")}
                disabled={isSubmitting}
              >
                Reject
              </button>
              <button
                className={styles.approveButton}
                onClick={() => handleAction("approve")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}