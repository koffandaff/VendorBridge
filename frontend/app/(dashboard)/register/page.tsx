"use client";

import React, { useState } from "react";
import { User, UserPlus } from "lucide-react";
import styles from "./register.module.css";
import { showLoading, showModalSuccess, showToastError, closeAlert } from "@/lib/alerts";
import { registerUser } from "@/lib/data";

const ROLE_MAP: Record<string, "ADMIN" | "PROCUREMENT_OFFICER" | "APPROVER" | "VENDOR"> = {
  "Vendor": "VENDOR",
  "Procurement Officer": "PROCUREMENT_OFFICER",
  "Manager/Approver": "APPROVER",
  "Admin": "ADMIN",
};

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobRole: "Vendor",
    dept: "",
    country: "",
    additionalInfo: ""
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    showLoading("Registering User...");

    try {
      await registerUser({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone || undefined,
        role: ROLE_MAP[formData.jobRole] ?? "VENDOR",
      });
      closeAlert();
      await showModalSuccess("User successfully registered!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobRole: "Vendor",
        dept: "",
        country: "",
        additionalInfo: ""
      });
      setProfileImage(null);
    } catch (error) {
      closeAlert();
      showToastError(error instanceof Error ? error.message : "Failed to register user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          <div className={styles.avatarPlaceholder} style={profileImage ? { backgroundImage: `url(${profileImage})`, backgroundSize: 'cover', backgroundPosition: 'center', border: 'none' } : {}}>
            {!profileImage && <UserPlus size={32} />}
          </div>
          <div className={styles.uploadBtnContainer}>
            <label htmlFor="profileUpload" className={styles.uploadLabel}>
              Upload Photo
            </label>
            <input 
              type="file" 
              id="profileUpload" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className={styles.hiddenInput}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <h1 className={styles.title}>Register User</h1>
        <p className={styles.subtitle}>Create a new internal user or vendor profile</p>
        
        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="jobRole">Job Role</label>
              <select
                id="jobRole"
                name="jobRole"
                value={formData.jobRole}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="Vendor">Vendor</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Manager/Approver">Manager/Approver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="dept">Department</label>
              <input
                id="dept"
                name="dept"
                type="text"
                placeholder="e.g. IT Procurement"
                value={formData.dept}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">Select a country...</option>
                <option value="US">United States</option>
                <option value="IN">India</option>
                <option value="UK">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label htmlFor="additionalInfo">Additional Information...</label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                placeholder="Any other relevant details or company notes..."
                value={formData.additionalInfo}
                onChange={handleChange}
                disabled={isLoading}
              ></textarea>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? <span className={styles.loadingSpinner}></span> : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
