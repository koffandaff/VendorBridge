"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
import styles from "./change-password.module.css";
import { changePassword } from "@/lib/data";
import { clearTokens } from "@/lib/api";
import { confirmPasswordSchema } from "@/lib/validation/password";

const changePasswordSchema = confirmPasswordSchema.extend({
  currentPassword: z.string().min(1, "Current password is required"),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      clearTokens();
      window.localStorage.removeItem("auth_user");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Change Password</h1>
          <p className={styles.subtitle}>Update your account password</p>
        </div>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Current Password</label>
              <input
                type="password"
                className={`${styles.formInput} ${errors.currentPassword ? styles.error : ""}`}
                placeholder="Enter current password"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <span className={styles.formError}>{errors.currentPassword.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>New Password</label>
              <input
                type="password"
                className={`${styles.formInput} ${errors.newPassword ? styles.error : ""}`}
                placeholder="8-72 characters, letters and numbers"
                {...register("newPassword")}
              />
              {errors.newPassword && <span className={styles.formError}>{errors.newPassword.message}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Confirm New Password</label>
              <input
                type="password"
                className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ""}`}
                placeholder="Re-enter new password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <span className={styles.formError}>{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              <KeyRound size={16} />
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}