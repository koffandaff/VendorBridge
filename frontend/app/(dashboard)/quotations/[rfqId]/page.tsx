"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import styles from "./quote-page.module.css";
import { fetchRFQById, RFQ, RFQItem } from "@/lib/data";

const itemSchema = z.object({
  id: z.string(),
  unitPrice: z.coerce.number().positive("Must be a positive number"),
  deliveryDays: z.coerce.number().int().positive("Must be at least 1 day"),
});

const quoteSchema = z.object({
  items: z.array(itemSchema),
  taxPercentage: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100"),
  notes: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

export default function SubmitQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.rfqId as string;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema) as any,
    defaultValues: {
      items: [],
      taxPercentage: 18,
      notes: ""
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "items"
  });

  // Watch values for live calculation
  const watchItems = watch("items");
  const watchTax = watch("taxPercentage") || 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRFQById(rfqId);
        if (data) {
          setRfq(data);
          // Initialize form items based on RFQ items
          reset({
            taxPercentage: 18,
            notes: "",
            items: data.items.map(item => ({
              id: item.id,
              unitPrice: 0,
              deliveryDays: 1,
            }))
          });
        } else {
          toast.error("RFQ not found");
          router.push("/rfqs");
        }
      } catch (error) {
        console.error("Failed to load RFQ", error);
      } finally {
        setLoading(false);
      }
    };
    if (rfqId) {
      loadData();
    }
  }, [rfqId, reset, router]);

  const { subtotal, gstAmount, grandTotal } = useMemo(() => {
    if (!watchItems || !rfq) return { subtotal: 0, gstAmount: 0, grandTotal: 0 };
    
    let sub = 0;
    watchItems.forEach((watchItem, index) => {
      const rfqItem = rfq.items[index];
      if (rfqItem && watchItem.unitPrice && !isNaN(watchItem.unitPrice)) {
        sub += (rfqItem.qty * watchItem.unitPrice);
      }
    });

    const tax = isNaN(watchTax) ? 0 : watchTax;
    const gst = sub * (tax / 100);
    const grand = sub + gst;

    return {
      subtotal: sub,
      gstAmount: gst,
      grandTotal: grand
    };
  }, [watchItems, watchTax, rfq]);

  const onSubmit = async (data: QuoteFormValues, isDraft: boolean) => {
    console.log(`Submitting Quotation (Draft: ${isDraft}):`, data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success(isDraft ? "Draft saved successfully!" : "Quotation submitted successfully!");
    router.push("/rfqs");
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

  if (!rfq) return null;

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Submit Quotations</h1>
          <p className={styles.subtitle}>
            RFQ: {rfq.title} &mdash; Deadline {rfq.deadline}
          </p>
        </div>
        <button 
          className={styles.backButton} 
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Line Items & Pricing</h2>
        
        <form id="quoteForm">
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th style={{ width: "200px" }}>Unit Price ($)</th>
                  <th style={{ width: "150px" }}>Delivery (Days)</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const rfqItem = rfq.items[index];
                  const watchPrice = watchItems?.[index]?.unitPrice || 0;
                  const rowTotal = rfqItem ? (rfqItem.qty * (isNaN(watchPrice) ? 0 : watchPrice)) : 0;
                  
                  return (
                    <tr key={field.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rfqItem?.item}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px" }}>
                          {rfqItem?.category}
                        </span>
                      </td>
                      <td>{rfqItem?.qty}</td>
                      <td>
                        <div className={styles.inputWrapper}>
                          <span className={styles.currencySymbol}>$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            className={`${styles.formInput} ${styles.inputWithSymbol} ${errors.items?.[index]?.unitPrice ? styles.error : ""}`}
                            placeholder="0.00"
                            {...register(`items.${index}.unitPrice`)}
                          />
                        </div>
                        {errors.items?.[index]?.unitPrice && (
                          <span className={styles.formError}>{errors.items[index]?.unitPrice?.message}</span>
                        )}
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={`${styles.formInput} ${errors.items?.[index]?.deliveryDays ? styles.error : ""}`}
                          placeholder="e.g. 14"
                          {...register(`items.${index}.deliveryDays`)}
                        />
                        {errors.items?.[index]?.deliveryDays && (
                          <span className={styles.formError}>{errors.items[index]?.deliveryDays?.message}</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#e2e8f0" }}>
                        ${rowTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.summarySection}>
            <div className={styles.termsGroup}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8" }}>Tax / GST (%)</label>
                <div className={styles.inputWrapper} style={{ maxWidth: "200px" }}>
                  <input 
                    type="number"
                    step="0.1"
                    className={`${styles.formInput} ${errors.taxPercentage ? styles.error : ""}`}
                    {...register("taxPercentage")}
                  />
                  <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>%</span>
                </div>
                {errors.taxPercentage && <span className={styles.formError}>{errors.taxPercentage.message}</span>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8" }}>Notes & Terms</label>
                <textarea 
                  className={styles.formTextarea}
                  placeholder="Payment terms, delivery conditions, warranties, etc."
                  {...register("notes")}
                />
              </div>
            </div>

            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span className={styles.summaryValue}>${subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Estimated Tax ({watchTax}%)</span>
                <span className={styles.summaryValue}>${gstAmount.toFixed(2)}</span>
              </div>
              <div className={styles.grandTotalRow}>
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.actionsRow}>
            <button 
              type="button"
              className={styles.saveDraftButton}
              onClick={handleSubmit((data: any) => onSubmit(data, true))}
              disabled={isSubmitting}
            >
              Save Draft
            </button>
            <button 
              type="button"
              className={styles.submitButton} 
              onClick={handleSubmit((data: any) => onSubmit(data, false))}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Quotation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
