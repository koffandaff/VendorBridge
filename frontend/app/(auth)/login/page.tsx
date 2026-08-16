"use client";

import React, { useState } from "react";
import styles from "./login.module.css";
import { useAuth, UserRole } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Mock an async API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fake user data with a role based on the username for demonstration
    let role: UserRole = "Vendor";
    const lowerUsername = username.toLowerCase();
    
    if (lowerUsername.includes("admin")) {
      role = "Admin";
    } else if (lowerUsername.includes("procurement")) {
      role = "Procurement Officer";
    } else if (lowerUsername.includes("manager")) {
      role = "Manager/Approver";
    }

    login({
      username,
      role
    });

    setIsLoading(false);
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            {errors.username && <span className={styles.errorText}>{errors.username}</span>}
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
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <a href="#" className={styles.forgotPassword} onClick={(e) => e.preventDefault()}>
            Forgot password?
          </a>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? <span className={styles.loadingSpinner}></span> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
