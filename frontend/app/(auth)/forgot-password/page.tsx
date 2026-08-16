"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import styles from "./forgot-password.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { forgotPassword } from "@/lib/data";
import { ApiError } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(data.email.trim());
      setEmail(data.email.trim());
      setIsSuccess(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          <div className={styles.avatarPlaceholder}>
            <Mail size={40} />
          </div>
        </div>

        {isSuccess ? (
          <div className={styles.successPanel}>
            <div className={styles.successIcon}>
              <Mail size={28} />
            </div>
            <h1 className={styles.successTitle}>Check your inbox</h1>
            <p className={styles.successText}>
              If an account exists for this email, a verification code has been sent.
            </p>
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className={styles.successLink}
            >
              Enter the code
            </Link>
            <p className={styles.muted}>In development the code is printed in the backend console.</p>
            <Link href="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Forgot your password?</h1>
            <p className={styles.subtitle}>
              Enter your email and we&apos;ll send you a verification code to reset your password.
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

              <button type="submit" className={styles.button} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.loadingSpinner}></span> : "Send reset code"}
              </button>
            </form>

            <Link href="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}