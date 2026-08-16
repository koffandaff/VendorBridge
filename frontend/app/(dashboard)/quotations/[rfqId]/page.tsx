"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import styles from "./quote-page.module.css";
import { createQuotation, fetchRFQById, RFQ, RFQItem } from "@/lib/data";

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
    resolver: zodResolver(quoteSchema) as unknown as Resolver<QuoteFormValues>,
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
    try {
      showLoading(isDraft ? "Saving draft..." : "Submitting quotation...");
      await createQuotation({
        rfqId,
        items: data.items.map((item) => ({
          rfqItemId: item.id,
          unitPrice: item.unitPrice,
          deliveryDays: item.deliveryDays,
        })),
        taxPercentage: data.taxPercentage,
        notes: data.notes,
        isDraft,
      });
      closeAlert();
      await showModalSuccess("Success", isDraft ? "Draft saved successfully!" : "Quotation submitted successfully!");
      router.push("/quotations");
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to submit quotation");
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

  if (!rfq) return null;

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Submit Quotations</h1>
          <p className={styles.subtitle}>
            RFQ: {rfq.title} &mdash; deadline {rfq.deadline}
          </p>
        </div>
      </div>

      <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", background: "rgba(255,255,255,0.02)", marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>RFQ Summary</div>
        <div style={{ fontSize: "14px", color: "#e2e8f0" }}>
          {rfq.items.map(i => `${i.item} * ${i.qty}`).join(", ")} - category {rfq.category}
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle} style={{ fontSize: "14px", fontWeight: 400, color: "#e2e8f0" }}>Your Quotation</h2>
        
        <form id="quoteForm">
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th style={{ width: "200px" }}>Unit price</th>
                  <th style={{ width: "150px" }}>Total</th>
                  <th style={{ width: "150px", textAlign: "right" }}>Delivery (days)</th>
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
                        <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{rfqItem?.item}</div>
                      </td>
                      <td style={{ color: "#cbd5e1" }}>{rfqItem?.qty}</td>
                      <td>
                        <div className={styles.inputWrapper}>
                          <input 
                            type="number" 
                            step="0.01"
                            className={`${styles.formInput} ${errors.items?.[index]?.unitPrice ? styles.error : ""}`}
                            placeholder="0"
                            {...register(`items.${index}.unitPrice`)}
                          />
                        </div>
                        {errors.items?.[index]?.unitPrice && (
                          <span className={styles.formError}>{errors.items[index]?.unitPrice?.message}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {rowTotal.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <input 
                          type="number" 
                          className={`${styles.formInput} ${errors.items?.[index]?.deliveryDays ? styles.error : ""}`}
                          placeholder="e.g. 14"
                          style={{ textAlign: "right", width: "100px", float: "right" }}
                          {...register(`items.${index}.deliveryDays`)}
                        />
                        {errors.items?.[index]?.deliveryDays && (
                          <span className={styles.formError}>{errors.items[index]?.deliveryDays?.message}</span>
                        )}
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
                <label style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8" }}>tax / GST %</label>
                <div className={styles.inputWrapper} style={{ maxWidth: "150px" }}>
                  <input 
                    type="number"
                    step="0.1"
                    className={`${styles.formInput} ${errors.taxPercentage ? styles.error : ""}`}
                    {...register("taxPercentage")}
                  />
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>%</span>
                </div>
                {errors.taxPercentage && <span className={styles.formError}>{errors.taxPercentage.message}</span>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8" }}>Note / terms</label>
                <textarea 
                  className={styles.formTextarea}
                  placeholder="Payment terms: 20 days net..."
                  {...register("notes")}
                />
              </div>
            </div>

            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span className={styles.summaryValue}>{subtotal.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>GST ({watchTax}%)</span>
                <span className={styles.summaryValue}>{gstAmount.toLocaleString()}</span>
              </div>
              <div className={styles.grandTotalRow}>
                <span>Grand total</span>
                <span>{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.actionsRow} style={{ justifyContent: "flex-start", gap: "16px" }}>
            <button 
              type="button"
              className={styles.submitButton} 
              style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#e2e8f0" }}
              onClick={handleSubmit((data: QuoteFormValues) => onSubmit(data, false))}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Quotation"}
            </button>
            <button 
              type="button"
              className={styles.saveDraftButton}
              onClick={handleSubmit((data: QuoteFormValues) => onSubmit(data, true))}
              disabled={isSubmitting}
            >
              Save Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
