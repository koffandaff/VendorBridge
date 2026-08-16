"use client";

import React, { useState, useEffect } from "react";
import { createVendor, fetchVendors, fetchVendorCategories, Vendor } from "@/lib/data";
import styles from "./vendors-page.module.css";
import { Search, Plus, X } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import { PageSkeleton, ToolbarSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

type FilterTab = "All" | "Active" | "Pending" | "Blocked";

const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  categoryId: z.string().min(1, "Please select a valid category"),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format (e.g. 22AAAAA0000A1Z5)"),
  contactNo: z.string().min(10, "Valid contact number required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address is required"),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema)
  });

  const loadVendors = async () => {
    const data = await fetchVendors();
    setVendors(data);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vendorData, categoryData] = await Promise.all([fetchVendors(), fetchVendorCategories()]);
        setVendors(vendorData);
        setCategories(categoryData);
      } catch (error) {
        console.error("Failed to load vendors", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onSubmit = async (data: VendorFormValues) => {
    try {
      showLoading("Adding vendor...");
      await createVendor({
        name: data.name,
        categoryId: data.categoryId,
        email: data.email,
        phone: data.contactNo,
        gstNumber: data.gstNumber,
        address: data.address,
      });
      closeAlert();
      await showModalSuccess("Success", "Vendor added successfully!");
      reset();
      setIsModalOpen(false);
      loadVendors().catch(() => undefined);
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to add vendor");
    }
  };

  const closeModal = () => {
    reset();
    setIsModalOpen(false);
  };

  // Compute counts for tabs based on the unfiltered full data
  const counts = {
    All: vendors.length,
    Active: vendors.filter(v => v.status === "Active").length,
    Pending: vendors.filter(v => v.status === "Pending").length,
    Blocked: vendors.filter(v => v.status === "Blocked").length,
  };

  // Filter vendors based on active tab and search query
  const filteredVendors = vendors.filter((vendor) => {
    const matchesTab = activeTab === "All" || vendor.status === activeTab;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = 
      vendor.name.toLowerCase().includes(lowerQuery) ||
      vendor.gstNumber.toLowerCase().includes(lowerQuery) ||
      vendor.category.toLowerCase().includes(lowerQuery);
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case "Active": return styles.badgeActive;
      case "Pending": return styles.badgePending;
      case "Blocked": return styles.badgeBlocked;
      default: return "";
    }
  };

  if (loading) {
    return (
      <PageSkeleton>
        <ToolbarSkeleton />
        <TableSkeleton rows={6} columns={6} />
      </PageSkeleton>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Vendors</h1>
          <p className={styles.subtitle}>Manage supplier profiles and registrations</p>
        </div>
        <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Main Filter & Table Section */}
      <div className={styles.searchAndFilter}>
        
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search by name, GST number, category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className={styles.tabsRow}>
          {(["All", "Active", "Pending", "Blocked"] as FilterTab[]).map(tab => (
            <button 
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>GST No.</th>
                <th>Contact No.</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length > 0 ? (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id}>
                    <td>{vendor.name}</td>
                    <td>{vendor.category}</td>
                    <td>{vendor.gstNumber}</td>
                    <td>{vendor.contactNo}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={styles.viewButton}
                        onClick={() => router.push(`/vendors/${vendor.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No vendors found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Vendor</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.formGrid}>
                {/* Vendor Name */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vendor Name</label>
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${errors.name ? styles.error : ""}`}
                    placeholder="Company name"
                    {...register("name")}
                  />
                  {errors.name && <span className={styles.formError}>{errors.name.message}</span>}
                </div>

                {/* Category */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select 
                    className={`${styles.formSelect} ${errors.categoryId ? styles.error : ""}`}
                    {...register("categoryId")}
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <span className={styles.formError}>{errors.categoryId.message}</span>}
                </div>

                {/* GST Number */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>GST Number</label>
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${errors.gstNumber ? styles.error : ""}`}
                    placeholder="22AAAAA0000A1Z5"
                    {...register("gstNumber")}
                  />
                  {errors.gstNumber && <span className={styles.formError}>{errors.gstNumber.message}</span>}
                </div>

                {/* Contact Number */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Number</label>
                  <input 
                    type="text" 
                    className={`${styles.formInput} ${errors.contactNo ? styles.error : ""}`}
                    placeholder="+91 9876543210"
                    {...register("contactNo")}
                  />
                  {errors.contactNo && <span className={styles.formError}>{errors.contactNo.message}</span>}
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input 
                    type="email" 
                    className={`${styles.formInput} ${errors.email ? styles.error : ""}`}
                    placeholder="contact@company.com"
                    {...register("email")}
                  />
                  {errors.email && <span className={styles.formError}>{errors.email.message}</span>}
                </div>

                {/* Address (Full Width) */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Address</label>
                  <textarea 
                    className={`${styles.formTextarea} ${errors.address ? styles.error : ""}`}
                    placeholder="Full company address..."
                    {...register("address")}
                  />
                  {errors.address && <span className={styles.formError}>{errors.address.message}</span>}
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px" }}>
                <button 
                  type="button"
                  className={styles.viewButton} 
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={styles.addButton} 
                  style={{ boxShadow: "none" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
