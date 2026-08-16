"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, Star, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./approvals.module.css";

// Dummy data defined directly for the approval workflow demo
const APPROVAL_DATA = {
  rfqTitle: "Office Furniture Q2",
  vendorName: "Infra Supplies",
  totalAmount: 185400,
  currency: "₹",
  deliveryDays: 14,
  vendorRating: 4.8,
  currentStepIndex: 2, // 0-indexed: 0=Submitted, 1=L1 Review, 2=L2 Approval, 3=Generate PO
  steps: [
    { label: "Submitted" },
    { label: "L1 Review" },
    { label: "L2 Approval" },
    { label: "Generate PO" }
  ],
  approvers: [
    { 
      id: "a1", 
      name: "Ramesh Kumar", 
      role: "Procurement Manager (L1)", 
      status: "completed", 
      statusText: "Approved on May 20, 10:32 AM",
      initials: "RK"
    },
    { 
      id: "a2", 
      name: "Sarah Jenkins", 
      role: "Finance Director (L2)", 
      status: "current", 
      statusText: "Pending — Assigned May 21",
      initials: "SJ"
    },
    { 
      id: "a3", 
      name: "System", 
      role: "Automated PO Generation", 
      status: "future", 
      statusText: "Waiting on L2 Approval",
      initials: "SYS"
    }
  ]
};

export default function ApprovalWorkflowPage() {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject" && !remarks.trim()) {
      toast.error("Remarks are required to reject an approval.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log(`Action: ${action.toUpperCase()}`);
    console.log(`Remarks: ${remarks}`);
    
    if (action === "approve") {
      toast.success("Quotation approved successfully!");
    } else {
      toast.error("Quotation rejected.");
    }
    
    setIsSubmitting(false);
    
    // Redirect back to dashboard or approvals list after action
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Approval Workflow</h1>
          <p className={styles.subtitle}>
            RFQ: {APPROVAL_DATA.rfqTitle} &mdash; Vendor: {APPROVAL_DATA.vendorName} &mdash; {APPROVAL_DATA.currency}{APPROVAL_DATA.totalAmount.toLocaleString()}
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
                <span className={styles.summaryValue}>{APPROVAL_DATA.deliveryDays} Days</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Vendor Rating</span>
                <span className={styles.summaryValue} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  {APPROVAL_DATA.vendorRating} / 5.0
                </span>
              </div>
              <div className={styles.summaryItem} style={{ borderBottom: "none", paddingTop: "8px" }}>
                <span className={styles.summaryLabel}>Grand Total</span>
                <span className={styles.totalValue}>
                  {APPROVAL_DATA.currency}{APPROVAL_DATA.totalAmount.toLocaleString()}
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
