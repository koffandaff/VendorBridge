"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, XCircle } from "lucide-react";
import { fetchRFQById, updateRfqStatus, RFQ } from "@/lib/data";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import { useAuth } from "@/lib/AuthContext";

export default function RFQViewPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const isProcurementStaff =
    user?.role === "Admin" || user?.role === "Procurement Officer";
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRfq = async () => {
    const data = await fetchRFQById(rfqId);
    setRfq(data || null);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadRfq();
      } catch (error) {
        console.error("Failed to load RFQ", error);
      } finally {
        setLoading(false);
      }
    };
    if (rfqId) loadData();
  }, [rfqId]);

  const handleOpen = async () => {
    if (!rfq) return;
    showLoading("Opening RFQ...");
    try {
      await updateRfqStatus(rfq.id, "OPEN");
      closeAlert();
      await showModalSuccess(`RFQ ${rfq.number} opened for quotes`);
      await loadRfq();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to open RFQ");
    }
  };

  const handleClose = async () => {
    if (!rfq) return;
    showLoading("Closing RFQ...");
    try {
      await updateRfqStatus(rfq.id, "CLOSED");
      closeAlert();
      await showModalSuccess(`RFQ ${rfq.number} closed`);
      await loadRfq();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to close RFQ");
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

  if (!rfq) {
    return (
      <div style={{ padding: "40px", color: "#f8fafc" }}>
        <h2>RFQ Not Found</h2>
        <button 
          onClick={() => router.back()}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "8px", marginTop: "16px", cursor: "pointer" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px", animation: "fadeIn 0.4s ease-out" }}>
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, background: "linear-gradient(to right, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {rfq.title}
          </h1>
          <p style={{ fontSize: "16px", color: "#94a3b8" }}>{rfq.number} &mdash; Deadline: {rfq.deadline}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {isProcurementStaff && rfq.rawStatus === "DRAFT" && (
            <button
              onClick={handleOpen}
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Send size={16} />
              <span>Open RFQ</span>
            </button>
          )}
          {isProcurementStaff && rfq.rawStatus === "OPEN" && (
            <button
              onClick={handleClose}
              style={{ background: "transparent", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#ef4444", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <XCircle size={16} />
              <span>Close RFQ</span>
            </button>
          )}
          <button
            onClick={() => router.back()}
            style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f8fafc", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>
      </div>

      {rfq.rawStatus !== "DRAFT" && (
        <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "20px", padding: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "16px", marginBottom: "24px" }}>Specifications</h2>
          <p style={{ color: "#e2e8f0", fontSize: "15px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{rfq.description || "—"}</p>
        </div>
      )}

      <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "20px", padding: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "16px", marginBottom: "24px" }}>RFQ Details</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Category</div>
            <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 500 }}>{rfq.category}</div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Status</div>
            <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 500 }}>{rfq.status}</div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Vendors Assigned</div>
            <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 500 }}>{rfq.vendorsAssignedCount}</div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Quotes Received</div>
            <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 500 }}>{rfq.quotesReceivedCount}</div>
          </div>
        </div>

        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f8fafc", marginBottom: "16px" }}>Requested Items</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#94a3b8", fontWeight: 600, fontSize: "13px" }}>Item Name</th>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#94a3b8", fontWeight: 600, fontSize: "13px" }}>Category</th>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#94a3b8", fontWeight: 600, fontSize: "13px" }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {rfq.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", color: "#e2e8f0", fontWeight: 500 }}>{item.item}</td>
                  <td style={{ padding: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", color: "#e2e8f0" }}>{item.category}</td>
                  <td style={{ padding: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", color: "#e2e8f0" }}>{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
