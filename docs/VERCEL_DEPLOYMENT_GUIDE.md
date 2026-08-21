# Vercel Deployment Guide for VendorBridge

This guide explains step-by-step how to deploy the **VendorBridge** full-stack application (Next.js Frontend + Express/Prisma Backend) on **Vercel**.

---

## 🏗️ Architecture Overview

The monorepo contains:
1. **Frontend**: Next.js 16 (React 19, Tailwind CSS, Turbopack) deployed on Vercel.
2. **Backend**: Express 5 + Prisma ORM (PostgreSQL) deployed as a Vercel Serverless Function via `backend/api/index.ts`.
3. **Database**: PostgreSQL hosted on **Supabase**, **Neon**, **Railway**, or **Vercel Postgres**.

---

## 📋 Pre-Deployment Checklist

1. A GitHub repository with your VendorBridge code pushed.
2. A free [Vercel](https://vercel.com) account.
3. A hosted PostgreSQL database (e.g. [Supabase](https://supabase.com) or [Neon](https://neon.tech)).

---

## Step 1: Set Up Cloud PostgreSQL Database

If you don't already have a PostgreSQL database:

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Under **Project Settings** > **Database** > **Connection string** > **ORMs** > **Prisma**:
   - Copy `DATABASE_URL` (Connection pooling on port `6543`)
   - Copy `DIRECT_URL` (Direct connection on port `5432`)

### Option B: Neon
1. Go to [neon.tech](https://neon.tech) and create a free PostgreSQL database.
2. Copy the pooled connection string for `DATABASE_URL` and unpooled for `DIRECT_URL`.

---

## Step 2: Push Database Schema & Seed Data

Run these commands locally from your project root to prepare the remote database:

```bash
# In backend/.env, set DATABASE_URL and DIRECT_URL to your cloud database connection strings

# 1. Generate Prisma Client
npm run prisma:generate --workspace backend

# 2. Push schema to cloud database
npx prisma db push --schema=backend/prisma/schema.prisma

# 3. Seed initial admin & demo data
npm run prisma:seed --workspace backend
```

---

## Step 3: Deploy Backend API on Vercel

1. Log into **[Vercel Dashboard](https://vercel.com)**.
2. Click **"Add New..."** > **"Project"**.
3. Import your **VendorBridge** repository.
4. Configure the project settings:
   - **Project Name**: `vendorbridge-api` (or your preferred name)
   - **Framework Preset**: `Other`
   - **Root Directory**: `backend` (Click *Edit* and select the `backend` folder)
   - **Build Command**: `npm run vercel-build` (or leave default if auto-detected)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`
5. Add **Environment Variables** in Vercel:
   | Key | Example Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `DATABASE_URL` | `postgresql://...:6543/postgres?pgbouncer=true` | Pooled DB URL |
   | `DIRECT_URL` | `postgresql://...:5432/postgres` | Direct DB URL |
   | `JWT_ACCESS_SECRET` | `(32+ random characters secret)` | Generate with `openssl rand -hex 32` |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` | Token validity |
   | `REFRESH_TOKEN_EXPIRES_DAYS` | `30` | Session validity |
   | `OTP_EXPIRES_MINUTES` | `10` | OTP code expiry |
   | `CLIENT_URL` | `https://vendorbridge-frontend.vercel.app` | Frontend production URL |
   | `CORS_ORIGINS` | `https://vendorbridge-frontend.vercel.app` | Allowed CORS origins |
   | `SMTP_HOST` *(optional)* | `smtp.resend.com` / `smtp.gmail.com` | SMTP host for emails |
   | `SMTP_PORT` *(optional)* | `587` | SMTP port |
   | `SMTP_USER` *(optional)* | `apiKey` / `your-email` | SMTP username |
   | `SMTP_PASS` *(optional)* | `your-password` | SMTP password |
   | `SMTP_FROM` *(optional)* | `VendorBridge <no-reply@yourdomain.com>` | Sender email |
6. Click **Deploy**.
7. Once deployed, copy your API URL (e.g. `https://vendorbridge-api.vercel.app`).
8. Verify it by visiting `https://vendorbridge-api.vercel.app/health` in your browser. It should return `{"status":"ok","database":"up"}`.

---

## Step 4: Deploy Frontend on Vercel

1. In Vercel Dashboard, click **"Add New..."** > **"Project"**.
2. Import the **same repository**.
3. Configure the project settings:
   - **Project Name**: `vendorbridge-frontend` (or `vendorbridge`)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend` (Click *Edit* and select `frontend`)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
4. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://vendorbridge-api.vercel.app` (Backend URL from Step 3) |
5. Click **Deploy**.
6. Once deployed, note your frontend URL (e.g. `https://vendorbridge-frontend.vercel.app`).

---

## Step 5: Update Backend CORS with Final Frontend URL

1. Open your `vendorbridge-api` project in Vercel.
2. Go to **Settings** > **Environment Variables**.
3. Update `CLIENT_URL` and `CORS_ORIGINS` to match your actual frontend URL (e.g., `https://vendorbridge-frontend.vercel.app`).
4. Go to **Deployments** and click **Redeploy** on the latest deployment to apply the updated environment variables.

---

## 🚀 Alternative: Fast CLI Deployment via Vercel CLI

If you have `vercel` CLI installed:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy Backend
cd backend
vercel --prod

# 3. Deploy Frontend
cd ../frontend
vercel --prod
```
