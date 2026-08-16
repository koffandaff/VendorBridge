import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { ExternalServiceError } from "../core/errors/app-error.js";
import { logger } from "../core/logger/logger.js";

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}

let transporter: Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
}

async function deliver(message: EmailMessage): Promise<void> {
  if (!transporter) {
    if (env.NODE_ENV === "production") {
      throw new ExternalServiceError("email system is not configured");
    }

    logger.info("[email] SMTP not configured - printing message to console", {
      to: message.to,
      subject: message.subject,
      body: message.text,
      attachments: message.attachments?.map((attachment) => attachment.filename),
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM ?? "VendorBridge <no-reply@vendorbridge.local>",
      ...message,
    });
    logger.info("email sent", { to: message.to, subject: message.subject });
  } catch (error) {
    logger.error("email delivery failed", {
      to: message.to,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new ExternalServiceError("failed to send email");
  }
}

export function sendOtpCode(to: string, code: string): Promise<void> {
  return deliver({
    to,
    subject: "VendorBridge verification code",
    text: [
      "Your VendorBridge verification code is:",
      "",
      code,
      "",
      `This code expires in ${env.OTP_EXPIRES_MINUTES} minutes. If you did not request it, you can ignore this email.`,
    ].join("\n"),
  });
}

export function sendInviteEmail(to: string, name: string, code: string): Promise<void> {
  return deliver({
    to,
    subject: "You have been invited to VendorBridge",
    text: [
      `Hi ${name},`,
      "",
      "An administrator has created your VendorBridge account.",
      "",
      "Use this verification code to verify your email address and set up your account:",
      "",
      code,
      "",
      `This code expires in ${env.OTP_EXPIRES_MINUTES} minutes. If you were not expecting this, you can ignore this email.`,
    ].join("\n"),
  });
}

export interface SendInvoiceEmailParams {
  to: string;
  vendorName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: Date;
  itemCount: number;
}

export function sendInvoiceEmail(
  params: SendInvoiceEmailParams,
  pdfBuffer: Buffer
): Promise<void> {
  return deliver({
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from VendorBridge`,
    text: [
      `Hi ${params.vendorName},`,
      "",
      `Please find attached invoice ${params.invoiceNumber} from VendorBridge.`,
      "",
      `Invoice number: ${params.invoiceNumber}`,
      `Total amount: ${params.totalAmount}`,
      `Due date: ${params.dueDate.toISOString().slice(0, 10)}`,
      `Line items: ${params.itemCount}`,
      "",
      "If you have any questions about this invoice, please reply to this email.",
    ].join("\n"),
    attachments: [
      {
        filename: `${params.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}