"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import styles from "./new-rfq.module.css";
import { fetchVendors, Vendor } from "@/lib/data";

const newRfqSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.enum(["Furniture", "IT Hardware", "Construction", "Logistics", "Stationery", "Other"], {
    message: "Please select a valid category"
  }),
  deadline: z.string().min(1, "Deadline is required"),
  details: z.string().min(20, "Please provide detailed specifications (min 20 characters)"),
  assignedVendors: z.array(z.string()).min(1, "Please assign at least one vendor"),
});

type NewRfqFormValues = z.infer<typeof newRfqSchema>;

export default function NewRfqPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<NewRfqFormValues>({
    resolver: zodResolver(newRfqSchema),
    defaultValues: {
      assignedVendors: [],
    }
  });

  const selectedVendors = watch("assignedVendors");
  const selectedCategory = watch("category");

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
    console.log("Submitting New RFQ:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success("RFQ created and sent successfully!");
    router.push("/rfqs");
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
          onClick={() => router.back()}
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

            {/* Category */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select 
                className={`${styles.formSelect} ${errors.category ? styles.error : ""}`}
                {...register("category")}
              >
                <option value="">Select category...</option>
                <option value="Furniture">Furniture</option>
                <option value="IT Hardware">IT Hardware</option>
                <option value="Construction">Construction</option>
                <option value="Logistics">Logistics</option>
                <option value="Stationery">Stationery</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <span className={styles.formError}>{errors.category.message}</span>}
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
                placeholder="Describe exactly what you need, including quantities, quality standards, and delivery requirements..."
                {...register("details")}
              />
              {errors.details && <span className={styles.formError}>{errors.details.message}</span>}
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
              onClick={() => router.back()}
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
