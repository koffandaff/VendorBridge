"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fetchRFQById, fetchQuotations, RFQ, Quotation } from "@/lib/data";

export default function CompareQuotesPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rfqData, allQuotes] = await Promise.all([
          fetchRFQById(rfqId),
          fetchQuotations()
        ]);
        
        setRfq(rfqData || null);
        // Filter quotes that belong to this RFQ
        setQuotes(allQuotes.filter(q => q.rfqId === rfqId));
      } catch (error) {
        console.error("Failed to load compare data", error);
      } finally {
        setLoading(false);
      }
    };
    if (rfqId) loadData();
  }, [rfqId]);

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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, background: "linear-gradient(to right, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Compare Quotes
          </h1>
          <p style={{ fontSize: "16px", color: "#94a3b8" }}>RFQ: {rfq.title} ({rfq.id})</p>
        </div>
        <button 
          onClick={() => router.push('/rfqs')}
          style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f8fafc", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <ArrowLeft size={16} />
          <span>Back to RFQs</span>
        </button>
      </div>

      {quotes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "rgba(30, 41, 59, 0.4)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <p style={{ color: "#94a3b8", fontSize: "16px" }}>No quotations have been submitted for this RFQ yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "16px" }}>
          {quotes.map(quote => (
            <div 
              key={quote.id}
              style={{ 
                minWidth: "320px",
                flex: "1",
                background: quote.status === "Accepted" ? "rgba(16, 185, 129, 0.05)" : "rgba(30, 41, 59, 0.4)",
                backdropFilter: "blur(12px)", 
                border: quote.status === "Accepted" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "20px", 
                padding: "24px", 
                display: "flex", 
                flexDirection: "column", 
                gap: "24px",
                position: "relative"
              }}
            >
              {quote.status === "Accepted" && (
                <div style={{ position: "absolute", top: "16px", right: "16px", color: "#10b981" }}>
                  <CheckCircle2 size={24} />
                </div>
              )}

              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>{quote.vendorName}</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Quote ID: {quote.id}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>Submitted On</span>
                  <span style={{ color: "#f8fafc", fontSize: "14px", fontWeight: 500 }}>{quote.submittedAt}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>Status</span>
                  <span style={{ 
                    color: quote.status === "Accepted" ? "#34d399" : quote.status === "Rejected" ? "#f87171" : "#fbbf24", 
                    fontSize: "14px", fontWeight: 600 
                  }}>{quote.status}</span>
                </div>
              </div>

              <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <span style={{ color: "#f8fafc", fontWeight: 600 }}>Grand Total</span>
                  <span style={{ color: "#10b981", fontSize: "24px", fontWeight: 700 }}>
                    ${quote.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#f8fafc", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                    onClick={() => router.push(`/quotations/review/${quote.id}`)}
                  >
                    Full Details
                  </button>
                  {quote.status === "Pending Review" && (
                    <button 
                      style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", color: "white", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                      onClick={() => alert(`Awarded RFQ to ${quote.vendorName}!`)}
                    >
                      Award
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
