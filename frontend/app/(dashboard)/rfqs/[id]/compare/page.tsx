"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, Eye } from "lucide-react";
import { fetchRFQById, fetchQuotations, selectQuotation, createPurchaseOrder, RFQ, Quotation } from "@/lib/data";
import { addDays, formatCurrency, toIsoDate } from "@/lib/format";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import styles from "./compare.module.css";

export default function CompareQuotesPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    const [rfqData, rfqQuotes] = await Promise.all([
      fetchRFQById(rfqId),
      fetchQuotations(rfqId),
    ]);
    setRfq(rfqData || null);
    setQuotes(rfqQuotes);
    const selected = rfqQuotes.find((q) => q.rawStatus === "SELECTED");
    setSelectedQuoteId(selected?.id ?? null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (error) {
        console.error("Failed to load compare data", error);
      } finally {
        setLoading(false);
      }
    };
    if (rfqId) load();
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

  const eligibleQuotes = quotes.filter((q) => q.rawStatus !== "REJECTED" && q.rawStatus !== "EXPIRED");
  const lowestPriceQuote = [...eligibleQuotes].sort((a, b) => a.grandTotal - b.grandTotal)[0];
  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);

  const getQualityLabel = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return "Not Rated";
    if (rating >= 4) return "Excellent";
    if (rating >= 3) return "Good";
    return "Average";
  };

  const handleSelect = async (quote: Quotation) => {
    setActionLoading(true);
    showLoading("Selecting...");
    try {
      await selectQuotation(quote.id);
      closeAlert();
      await showModalSuccess("Selected!", `Selected ${quote.vendorName} for ${rfq.title}`);
      await loadData();
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to select quotation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePO = async () => {
    if (!selectedQuote) return;
    setActionLoading(true);
    showLoading("Generating PO...");
    try {
      await createPurchaseOrder({
        quotationId: selectedQuote.id,
        expectedDeliveryDate: toIsoDate(addDays(new Date(), selectedQuote.deliveryDays || 14).toISOString()),
      });
      closeAlert();
      await showModalSuccess("Success", "Purchase Order generated!");
      router.push("/purchase-orders");
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to generate purchase order");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quotation Comparison</h1>
          <p className={styles.subtitle}>RFQ: {rfq.title} ({rfq.number}) - {quotes.length} quotations received</p>
        </div>
        <button className={styles.backButton} onClick={() => router.push('/rfqs')}>
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
              const isRecommended = lowestPriceQuote?.id === quote.id && !selectedQuote;
              const isSelected = selectedQuoteId === quote.id;

              return (
                <div key={quote.id} className={`${styles.column} ${isSelected ? styles.recommendedColumn : ""}`}>
                  {isRecommended && <div className={styles.recommendedBadge}>Recommended</div>}
                  {isSelected && <div className={styles.recommendedBadge} style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}><CheckCircle2 size={12} /> Selected</div>}

                  <div className={`${styles.cell} ${styles.headerCell}`}>
                    <span className={styles.vendorName}>{quote.vendorName}</span>
                    <span className={styles.vendorId}>{quote.quotationNumber}</span>
                  </div>

                  <div className={`${styles.cell} ${styles.valueCell} ${styles.priceCell}`} style={{ color: isRecommended || isSelected ? "#10b981" : "#f8fafc" }}>
                    {formatCurrency(quote.grandTotal)}
                  </div>

                  <div className={`${styles.cell} ${styles.valueCell}`}>
                    {quote.deliveryDays > 0 ? `${quote.deliveryDays} Days` : "—"}
                  </div>

                  <div className={`${styles.cell} ${styles.valueCell}`}>
                    {getQualityLabel(quote.vendorRating)}
                  </div>

                  <div className={`${styles.cell} ${styles.valueCell}`}>
                    Valid till {quote.validUntil}
                  </div>

                  <div className={`${styles.cell} ${styles.actionCell}`}>
                    {quote.rawStatus === "REJECTED" || quote.rawStatus === "EXPIRED" ? (
                      <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>Rejected</span>
                    ) : isSelected ? (
                      <button
                        className={styles.sendButton}
                        onClick={handleGeneratePO}
                        disabled={actionLoading}
                      >
                        <FileText size={14} />
                        {actionLoading ? "Generating..." : "Generate PO"}
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className={styles.viewButton} onClick={() => router.push(`/quotations/review/${quote.id}`)}>
                          <Eye size={14} /> View
                        </button>
                        {!selectedQuote && (
                          <button
                            className={styles.sendButton}
                            onClick={() => handleSelect(quote)}
                            disabled={actionLoading}
                          >
                            Select
                          </button>
                        )}
                      </div>
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