"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileCheck, XCircle } from "lucide-react";
import { fetchQuotations, Quotation } from "@/lib/data";

export default function QuotationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchQuotations();
        const found = data.find(q => q.id === quoteId);
        setQuote(found || null);
      } catch (error) {
        console.error("Failed to load Quotation", error);
      } finally {
        setLoading(false);
      }
    };
    if (quoteId) loadData();
  }, [quoteId]);

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

  if (!quote) {
    return (
      <div style={{ padding: "40px", color: "#f8fafc" }}>
        <h2>Quotation Not Found</h2>
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
            Review Quotation: {quote.id}
          </h1>
          <p style={{ fontSize: "16px", color: "#94a3b8" }}>Submitted by {quote.vendorName} on {quote.submittedAt}</p>
        </div>
        <button 
          onClick={() => router.back()}
          style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f8fafc", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
        <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "16px" }}>Quotation Details</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Associated RFQ</span>
              <span style={{ color: "#f8fafc", fontWeight: 600 }}>{quote.rfqTitle} ({quote.rfqId})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Current Status</span>
              <span style={{ 
                color: quote.status === "Accepted" ? "#34d399" : quote.status === "Rejected" ? "#f87171" : "#fbbf24", 
                fontWeight: 600 
              }}>{quote.status}</span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", margin: "16px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", fontWeight: 700 }}>
              <span style={{ color: "#f8fafc" }}>Grand Total</span>
              <span style={{ color: "#10b981" }}>${quote.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "20px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "16px" }}>Actions</h2>
          
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Review this bid and make a decision to either approve or reject the quotation.</p>

          <button 
            style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", borderRadius: "10px", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)" }}
            onClick={() => {
              alert("Accepted!");
              router.push('/quotations');
            }}
          >
            <FileCheck size={18} />
            Accept Quotation
          </button>
          
          <button 
            style={{ width: "100%", padding: "12px", background: "transparent", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            onClick={() => {
              alert("Rejected.");
              router.push('/quotations');
            }}
          >
            <XCircle size={18} />
            Reject Quotation
          </button>
        </div>
      </div>
    </div>
  );
}
