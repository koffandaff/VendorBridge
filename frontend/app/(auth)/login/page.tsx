"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@gmail.com", password: "Admin@123" },
  { label: "Procurement Officer", email: "procurement.officer@gmail.com", password: "Procure@123" },
  { label: "Approver", email: "approver@gmail.com", password: "Approve@123" },
  { label: "Vendor", email: "vendor.user@gmail.com", password: "Vendor@123" },
];

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(email.trim(), password);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "Unable to sign in. Please try again." });
      }
      setIsLoading(false);
    }
  };

  const fillDemo = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setErrors({});
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          <span className={styles.avatarPlaceholder}>
            {/* SVG user icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
        </div>
        
        <h1 className={styles.title}>Welcome Back</h1>
        
        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <Link href="/forgot-password" className={styles.forgotPassword}>
            Forgot password?
          </Link>

          {errors.form && <span className={styles.errorText}>{errors.form}</span>}

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? <span className={styles.loadingSpinner}></span> : "Login"}
          </button>
        </form>

        <div className={styles.demoAccounts}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", textAlign: "center" }}>
            Demo accounts (click to fill)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                disabled={isLoading}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#cbd5e1",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
