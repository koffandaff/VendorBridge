"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchRFQById, fetchQuotations, RFQ, Quotation } from "@/lib/data";
import { showModalSuccess } from "@/lib/alerts";
import styles from "./compare.module.css";

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
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255, 255, 255, 0.1)", borderRadius: "50%", borderTopColor: "#10b981", animation: "spin 1s ease-in-out infinite" }}></div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div style={{ padding: "40px", color: "#f8fafc" }}>
        <h2>RFQ Not Found</h2>
        <button onClick={() => router.back()} className={styles.backButton} style={{ marginTop: "16px" }}>Go Back</button>
      </div>
    );
  }

  const lowestPriceQuote = [...quotes].sort((a, b) => a.grandTotal - b.grandTotal)[0];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quotation Comparison</h1>
          <p className={styles.subtitle}>RFQ: {rfq.title} ({rfq.id}) - {quotes.length} quotations received</p>
        </div>
        <button className={styles.backButton} onClick={() => router.push('/quotations')}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {quotes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "rgba(30, 41, 59, 0.4)", borderRadius: "20px" }}>
          <p style={{ color: "#94a3b8" }}>No quotations have been submitted for this RFQ yet.</p>
        </div>
      ) : (
        <div>
          <div className={styles.comparisonGrid}>
            {/* Parameters Column */}
            <div className={`${styles.column} ${styles.parametersColumn}`}>
              <div className={`${styles.cell} ${styles.headerCell}`}>Vendor</div>
              <div className={styles.cell}>Total Price</div>
              <div className={styles.cell}>Delivery</div>
              <div className={styles.cell}>Quality</div>
              <div className={styles.cell}>Timeline</div>
              <div className={`${styles.cell} ${styles.actionCell}`}></div>
            </div>

            {/* Vendor Columns */}
            {quotes.map((quote) => {
              const isRecommended = lowestPriceQuote?.id === quote.id;
              
              return (
                <div key={quote.id} className={`${styles.column} ${isRecommended ? styles.recommendedColumn : ""}`}>
                  {isRecommended && <div className={styles.recommendedBadge}>Recommended</div>}
                  
                  <div className={`${styles.cell} ${styles.headerCell}`}>
                    <span className={styles.vendorName}>{quote.vendorName}</span>
                    <span className={styles.vendorId}>{quote.id}</span>
                  </div>
                  
                  <div className={`${styles.cell} ${styles.valueCell} ${styles.priceCell}`} style={{ color: isRecommended ? "#10b981" : "#f8fafc" }}>
                    ${quote.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  
                  <div className={`${styles.cell} ${styles.valueCell}`}>
                    {Math.floor(Math.random() * 10 + 5)} Days
                  </div>
                  
                  <div className={`${styles.cell} ${styles.valueCell}`}>
                    {['Excellent', 'Good', 'Average'][Math.floor(Math.random() * 3)]}
                  </div>
                  
                  <div className={`${styles.cell} ${styles.valueCell}`}>
                    {['Immediate', 'Standard', 'Flexible'][Math.floor(Math.random() * 3)]}
                  </div>
                  
                  <div className={`${styles.cell} ${styles.actionCell}`}>
                    {isRecommended ? (
                      <button 
                        className={styles.sendButton}
                        onClick={async () => {
                          await showModalSuccess("Sent to Manager for Approval!");
                          router.push('/approvals');
                        }}
                      >
                        Send for Approval
                      </button>
                    ) : (
                      <button className={styles.viewButton} onClick={() => router.push(`/quotations/review/${quote.id}`)}>
                        View
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.recommendationText}>
            * Lowest price automatically recommended
          </p>
        </div>
      )}
    </div>
  );
}
