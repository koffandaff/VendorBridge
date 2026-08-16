"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import styles from "./new-rfq.module.css";
import { createRFQ, fetchVendors, Vendor } from "@/lib/data";

const newRfqSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  deadline: z.string().min(1, "Deadline is required"),
  details: z.string().min(3, "Please provide specifications for this RFQ"),
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name required"),
    qty: z.coerce.number().positive("Must be > 0"),
    unit: z.string().min(1, "Unit required"),
    itemType: z.enum(["PRODUCT", "SERVICE"]),
  })).min(1, "Add at least one item"),
  assignedVendors: z.array(z.string()).min(1, "Please assign at least one vendor"),
});

type NewRfqFormValues = z.infer<typeof newRfqSchema>;

export default function NewRfqPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<NewRfqFormValues>({
    resolver: zodResolver(newRfqSchema) as unknown as Resolver<NewRfqFormValues>,
    defaultValues: {
      items: [{ itemName: "", qty: 1, unit: "pcs", itemType: "PRODUCT" }],
      assignedVendors: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const selectedVendors = watch("assignedVendors");

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const data = await fetchVendors();
        // Only show active vendors
        setVendors(data.filter(v => v.status === "Active"));
      } catch (error) {
        console.error("Failed to load vendors", error);
      } finally {
        setLoadingVendors(false);
      }
    };
    loadVendors();
  }, []);

  const handleVendorToggle = (vendorId: string) => {
    const current = selectedVendors || [];
    if (current.includes(vendorId)) {
      setValue("assignedVendors", current.filter(id => id !== vendorId), { shouldValidate: true });
    } else {
      setValue("assignedVendors", [...current, vendorId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: NewRfqFormValues) => {
    showLoading("Creating RFQ...");
    try {
      await createRFQ({
        title: data.title,
        description: data.details,
        deadline: data.deadline,
        items: data.items.map((item) => ({
          name: item.itemName,
          quantity: item.qty,
          unit: item.unit,
          itemType: item.itemType,
        })),
        invitedVendorIds: data.assignedVendors,
      });
      closeAlert();
      await showModalSuccess("RFQ created and sent successfully!");
      router.push("/rfqs");
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to create RFQ");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Create New RFQ</h1>
          <p className={styles.subtitle}>Draft and send a new request for quotation</p>
        </div>
        <button
          className={styles.backButton}
          onClick={() => router.push("/rfqs")}
        >
          <ArrowLeft size={16} />
          <span>Back to RFQs</span>
        </button>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGrid}>

            {/* Title */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>RFQ Title</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.title ? styles.error : ""}`}
                placeholder="e.g. Q3 Office Laptop Procurement"
                {...register("title")}
              />
              {errors.title && <span className={styles.formError}>{errors.title.message}</span>}
            </div>

            {/* Deadline */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Submission Deadline</label>
              <input
                type="date"
                className={`${styles.formInput} ${errors.deadline ? styles.error : ""}`}
                {...register("deadline")}
              />
              {errors.deadline && <span className={styles.formError}>{errors.deadline.message}</span>}
            </div>

            {/* Product/Service Details */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>Specifications / Details</label>
              <textarea
                className={`${styles.formTextarea} ${errors.details ? styles.error : ""}`}
                placeholder="Describe exactly what you need, including quality standards and delivery requirements..."
                {...register("details")}
              />
              {errors.details && <span className={styles.formError}>{errors.details.message}</span>}
            </div>

            {/* Items */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>Requested Items</label>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                Add the items or services you want vendors to quote on.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 0.5fr 0.5fr 1fr auto",
                      gap: "8px",
                      alignItems: "start",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Item name"
                      className={`${styles.formInput} ${errors.items?.[index]?.itemName ? styles.error : ""}`}
                      {...register(`items.${index}.itemName`)}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className={`${styles.formInput} ${errors.items?.[index]?.qty ? styles.error : ""}`}
                      {...register(`items.${index}.qty`)}
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      className={`${styles.formInput} ${errors.items?.[index]?.unit ? styles.error : ""}`}
                      {...register(`items.${index}.unit`)}
                    />
                    <select
                      className={`${styles.formSelect} ${errors.items?.[index]?.itemType ? styles.error : ""}`}
                      {...register(`items.${index}.itemType`)}
                    >
                      <option value="PRODUCT">Product</option>
                      <option value="SERVICE">Service</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#ef4444",
                        borderRadius: "8px",
                        padding: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {errors.items?.root && <span className={styles.formError}>{errors.items.root.message}</span>}
                <button
                  type="button"
                  onClick={() => append({ itemName: "", qty: 1, unit: "pcs", itemType: "PRODUCT" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px dashed rgba(16, 185, 129, 0.4)",
                    color: "#10b981",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>
            </div>

            {/* Assign Vendors */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>Assign Vendors</label>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                Select the active vendors you want to invite to this RFQ.
              </p>

              <div className={styles.checkboxGroup}>
                {loadingVendors ? (
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>Loading vendors...</span>
                ) : vendors.length === 0 ? (
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>No active vendors found.</span>
                ) : (
                  vendors.map(vendor => (
                    <label key={vendor.id} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={(selectedVendors || []).includes(vendor.id)}
                        onChange={() => handleVendorToggle(vendor.id)}
                      />
                      <span className={styles.checkboxLabel}>{vendor.name}</span>
                      <span className={styles.vendorCategory}>{vendor.category}</span>
                    </label>
                  ))
                )}
              </div>
              {errors.assignedVendors && <span className={styles.formError}>{errors.assignedVendors.message}</span>}
            </div>

          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push("/rfqs")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create & Send RFQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}