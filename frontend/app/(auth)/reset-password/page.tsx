"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import styles from "./reset-password.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordSchema } from "@/lib/validation/password";
import { resetPasswordWithOtp } from "@/lib/data";
import { ApiError } from "@/lib/api";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
  })
  .merge(confirmPasswordSchema);

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      await resetPasswordWithOtp({
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
      <div className={styles.successPanel}>
        <div className={styles.successIcon}>
          <ShieldCheck size={32} />
        </div>
        <h1 className={styles.successTitle}>Password updated successfully</h1>
        <p className={styles.successText}>
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link href="/login" className={styles.successLink}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.avatar}>
        <div className={styles.avatarPlaceholder}>
          <KeyRound size={40} />
        </div>
      </div>

      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.subtitle}>Enter the 6-digit code we emailed you and choose a new password.</p>

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
          {isSubmitting ? <span className={styles.loadingSpinner}></span> : "Reset password"}
        </button>
      </form>

      <Link href="/login" className={styles.backLink}>
        Back to login
      </Link>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <div className={styles.container}>
        <div className={styles.card}>
          <ResetPasswordForm />
        </div>
      </div>
    </Suspense>
  );
}