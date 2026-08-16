"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showLoading, showModalSuccess, closeAlert } from "@/lib/alerts";
import { Plus, Trash2 } from "lucide-react";
import styles from "./rfqs-page.module.css";
import { fetchVendors, Vendor } from "@/lib/data";

const rfqSchema = z.object({
  title: z.string().min(3, "Title is required"),
  category: z.string().min(1, "Category is required"),
  deadline: z.string().min(1, "Deadline is required"),
  instructions: z.string().min(10, "Provide detailed instructions"),
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name required"),
    qty: z.coerce.number().positive("Must be > 0"),
    unit: z.string().min(1, "Unit required"),
  })).min(1, "Add at least one item"),
  vendors: z.array(z.string()).min(1, "Select at least one vendor"),
});

type RFQFormValues = z.infer<typeof rfqSchema>;

export default function CreateRFQPage() {
  const router = useRouter();
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema) as any,
    defaultValues: {
      items: [{ itemName: "", qty: 1, unit: "pcs" }],
      vendors: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchVendors = watch("vendors");

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const data = await fetchVendors();
        setAvailableVendors(data.filter(v => v.status === "Active"));
      } catch (error) {
        console.error("Failed to load vendors", error);
      } finally {
        setLoading(false);
      }
    };
    loadVendors();
  }, []);

  const toggleVendor = (vendorId: string) => {
    const current = watchVendors || [];
    if (current.includes(vendorId)) {
      setValue("vendors", current.filter(id => id !== vendorId), { shouldValidate: true });
    } else {
      setValue("vendors", [...current, vendorId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: RFQFormValues) => {
    console.log("Submitting RFQ:", data);
    showLoading("Creating RFQ...");
    await new Promise(resolve => setTimeout(resolve, 800));
    closeAlert();
    await showModalSuccess("Success", "RFQ Created & Invites Sent!");
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Create RFQ's</h1>
          <p className={styles.subtitle}>New request for quotation</p>
        </div>
      </div>

      <div className={styles.formCard}>
        {/* Wireframe Stepper */}
        <div className={styles.stepperContainer}>
          <div className={styles.stepperLine}></div>
          <div className={`${styles.stepItem} ${styles.stepCurrent}`}>
            <div className={styles.stepIcon}>1</div>
            <span className={styles.stepLabel}>RFQ Details</span>
          </div>
          <div className={`${styles.stepItem} ${styles.stepCurrent}`}>
            <div className={styles.stepIcon}>2</div>
            <span className={styles.stepLabel}>Add Items</span>
          </div>
          <div className={`${styles.stepItem} ${styles.stepCurrent}`}>
            <div className={styles.stepIcon}>3</div>
            <span className={styles.stepLabel}>Vendors</span>
          </div>
        </div>

        <form onSubmit={handleSubmit((data: any) => onSubmit(data))}>
          <div className={styles.gridContainer}>
            
            {/* Left Column: Details */}
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>RFQ Title</label>
                <input 
                  type="text" 
                  className={`${styles.formInput} ${errors.title ? styles.error : ""}`}
                  placeholder="e.g. Office Furniture Procurement"
                  {...register("title")}
                />
                {errors.title && <span className={styles.formError}>{errors.title.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select 
                  className={`${styles.formSelect} ${errors.category ? styles.error : ""}`}
                  {...register("category")}
                >
                  <option value="">Select category...</option>
                  <option value="Furniture">Furniture</option>
                  <option value="IT Hardware">IT Hardware</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Construction">Construction</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <span className={styles.formError}>{errors.category.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Deadline</label>
                <input 
                  type="date" 
                  className={`${styles.formInput} ${errors.deadline ? styles.error : ""}`}
                  {...register("deadline")}
                />
                {errors.deadline && <span className={styles.formError}>{errors.deadline.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Instructions / Details</label>
                <textarea 
                  className={`${styles.formTextarea} ${errors.instructions ? styles.error : ""}`}
                  placeholder="Specific requirements, quality standards, or terms..."
                  {...register("instructions")}
                />
                {errors.instructions && <span className={styles.formError}>{errors.instructions.message}</span>}
              </div>
            </div>

            {/* Right Column: Items & Vendors */}
            <div>
              {/* Items Section */}
              <div className={styles.sectionTitle}>Requested Items</div>
              <div className={styles.itemsContainer}>
                {fields.map((field, index) => (
                  <div key={field.id} className={styles.itemRow}>
                    <input 
                      type="text" 
                      placeholder="Item Name" 
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
                      placeholder="Unit (e.g. pcs)" 
                      className={`${styles.formInput} ${errors.items?.[index]?.unit ? styles.error : ""}`}
                      {...register(`items.${index}.unit`)}
                    />
                    <button 
                      type="button" 
                      className={styles.removeButton}
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {errors.items?.root && <span className={styles.formError}>{errors.items.root.message}</span>}
                <button 
                  type="button" 
                  className={styles.addButton}
                  onClick={() => append({ itemName: "", qty: 1, unit: "pcs" })}
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {/* Vendors Section */}
              <div className={styles.sectionTitle}>Assign Vendors</div>
              <div className={styles.vendorsList}>
                {loading ? (
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>Loading vendors...</span>
                ) : availableVendors.length === 0 ? (
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>No active vendors available.</span>
                ) : (
                  availableVendors.map(vendor => {
                    const isSelected = (watchVendors || []).includes(vendor.id);
                    return (
                      <div 
                        key={vendor.id} 
                        className={`${styles.vendorItem} ${isSelected ? styles.selected : ""}`}
                        onClick={() => toggleVendor(vendor.id)}
                      >
                        <input 
                          type="checkbox" 
                          className={styles.checkbox}
                          checked={isSelected}
                          readOnly
                        />
                        <div className={styles.vendorInfo}>
                          <span className={styles.vendorName}>{vendor.name}</span>
                          <span className={styles.vendorCategory}>{vendor.category}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {errors.vendors && <span className={styles.formError}>{errors.vendors.message}</span>}
            </div>

          </div>
          
          <div className={styles.actionsRow}>
            <button 
              type="button"
              className={styles.cancelButton} 
              onClick={() => router.push("/dashboard")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={styles.submitButton} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create RFQ & Send Invites"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
