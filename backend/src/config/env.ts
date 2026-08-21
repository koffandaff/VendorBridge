import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const envFilePath = path.resolve(import.meta.dirname, "../../.env");

if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const emptyStringToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const envSchema = z
  .object({
    NODE_ENV: z.preprocess(emptyStringToUndefined, z.enum(["development", "test", "production"]).default("development")),
    PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().max(65535).default(4000)),
    DATABASE_URL: z.preprocess(emptyStringToUndefined, z.string().optional()),
    DIRECT_URL: z.preprocess(emptyStringToUndefined, z.string().optional()),
    JWT_ACCESS_SECRET: z.preprocess(
      emptyStringToUndefined,
      z.string().default("default_jwt_secret_key_at_least_32_chars_long_for_dev_mode")
    ),
    JWT_ACCESS_EXPIRES_IN: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .regex(/^\d+(ms|s|m|h|d|w|y)?$/, "JWT_ACCESS_EXPIRES_IN must look like 15m, 1h or 86400")
        .default("15m")
    ),
    REFRESH_TOKEN_EXPIRES_DAYS: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().default(30)),
    OTP_EXPIRES_MINUTES: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().default(10)),
    CLIENT_URL: z.preprocess(emptyStringToUndefined, z.string().default("http://localhost:3000")),
    CORS_ORIGINS: z.preprocess(emptyStringToUndefined, z.string().default("http://localhost:3000,http://localhost:5173")),
    SMTP_HOST: z.preprocess(emptyStringToUndefined, z.string().optional()),
    SMTP_PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().max(65535).optional()),
    SMTP_USER: z.preprocess(emptyStringToUndefined, z.string().optional()),
    SMTP_PASS: z.preprocess(emptyStringToUndefined, z.string().optional()),
    SMTP_FROM: z.preprocess(emptyStringToUndefined, z.string().optional()),
  })
  .superRefine((data, ctx) => {
    const smtpHostSet = Boolean(data.SMTP_HOST);
    const smtpPortSet = Boolean(data.SMTP_PORT);

    if (smtpHostSet !== smtpPortSet) {
      ctx.addIssue({
        code: "custom",
        path: smtpHostSet ? ["SMTP_PORT"] : ["SMTP_HOST"],
        message: "SMTP_HOST and SMTP_PORT must be configured together",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const variables = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  console.error("[config] warning: environment configuration issues detected:");
  for (const variable of variables) {
    console.error(`  - ${variable}`);
  }
}

const fallbackEnv: z.infer<typeof envSchema> = {
  NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "default_jwt_secret_key_at_least_32_chars_long_for_dev_mode",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_DAYS: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
  OTP_EXPIRES_MINUTES: Number(process.env.OTP_EXPIRES_MINUTES) || 10,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
};

export const env = result.success ? result.data : fallbackEnv;

export const PORT = env.PORT;
export const NODE_ENV = env.NODE_ENV;

export const isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT);

export const corsOrigins = (env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export type Env = z.infer<typeof envSchema>;
