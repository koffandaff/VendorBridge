"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MailPlus, ShieldCheck } from "lucide-react";
import styles from "./accept-invite.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordSchema } from "@/lib/validation/password";
import { acceptInvitation } from "@/lib/data";
import { ApiError } from "@/lib/api";

const acceptInviteSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
  })
  .merge(confirmPasswordSchema);

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

export default function AcceptInvitePage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AcceptInviteFormValues) => {
    try {
      await acceptInvitation({
        email: data.email.trim(),
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successPanel}>
            <div className={styles.successIcon}>
              <ShieldCheck size={32} />
            </div>
            <h1 className={styles.successTitle}>Password updated successfully</h1>
            <p className={styles.successText}>
              Your account is ready. You can now sign in with your email and new password.
            </p>
            <Link href="/login" className={styles.successLink}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          <div className={styles.avatarPlaceholder}>
            <MailPlus size={40} />
          </div>
        </div>

        <h1 className={styles.title}>You&apos;ve been invited to VendorBridge</h1>
        <p className={styles.subtitle}>
          Enter the code from your invitation email and set your password to get started.
        </p>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={isSubmitting}
              {...register("otp")}
            />
            {errors.otp && <span className={styles.errorText}>{errors.otp.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter your new password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register("newPassword")}
            />
            {errors.newPassword && <span className={styles.errorText}>{errors.newPassword.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword.message}</span>
            )}
          </div>

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.loadingSpinner}></span> : "Accept invitation"}
          </button>
        </form>

        <p className={styles.hint}>
          Code expired or missing? Ask your administrator to resend the invitation.
        </p>

        <Link href="/login" className={styles.backLink}>
          Back to login
        </Link>
      </div>
    </div>
  );
}