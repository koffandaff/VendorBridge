# VendorBridge

End-to-end procurement platform built as a TypeScript monorepo. Manage vendors, run RFQs, collect and approve quotations, generate purchase orders and invoices, and track every action through audit logs and notifications.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Scripts](#scripts)
- [Demo Accounts](#demo-accounts)
- [Roles and Permissions](#roles-and-permissions)
- [API Reference](#api-reference)
- [Documentation](#documentation)

---

## Overview

VendorBridge is a full-cycle procurement workflow application:

- **Admin** manages users, vendors, and the audit trail.
- **Procurement Officers** create RFQs, invite vendors, review quotes, and generate POs and invoices.
- **Approvers** review pending quotations in a dedicated approval workflow.
- **Vendors** get invited to RFQs, submit quotations, and acknowledge purchase orders.

Everything a user does is captured in a searchable audit log and, where relevant, pushed to in-app notifications.

## Features

- **Authentication & user management**
  - Email + password login with JWT access tokens and refresh sessions
  - Invite-based registration (accept-invite flow), password change, OTP-based password reset
  - Admin user management: activate/deactivate, reset password, resend invites, delete
- **Role-based access control (RBAC)**
  - Four roles (`ADMIN`, `PROCUREMENT_OFFICER`, `APPROVER`, `VENDOR`) with a granular permission matrix enforced per endpoint
  - Frontend mirrors permissions for UX (hides actions a role cannot perform)
- **Vendor directory**
  - Vendor profiles with categories, contacts, GST details, and ratings
- **RFQs**
  - Create RFQs with line items, invite vendors, open/close for quotes, search, filter, and track status
- **Quotations**
  - Vendors submit quotations against invited RFQs (draft + submit)
  - Compare quotes side by side, accept or reject with remarks
- **Approval workflow**
  - Pending quotations surface for approval with an approval-chain stepper
- **Purchase orders**
  - Generate POs from a selected quotation, drive status through Sent/Approved/Acknowledged, vendor acknowledgement
- **Invoices**
  - Generate invoices from POs, download as PDF, email them, mark as paid
- **Analytics & reports**
  - Dashboard summary, spending trends, vendor performance, recent POs
- **Audit logging**
  - Every create/update/status change records actor, entity, and before/after details (including anonymous failed logins)
- **Notifications**
  - In-app notification bell with unread counts, role-targeted notifications (e.g. admins flagged when an invitation is accepted)
- **Activity page**
  - Searchable, day-grouped timeline of all audited actions (admin-only)

## Tech Stack

| Layer    | Tech                                               | Location              |
| -------- | -------------------------------------------------- | --------------------- |
| Frontend | Next.js 16 (App Router), TypeScript, CSS Modules   | `frontend/`           |
| Backend  | Express 5 + TypeScript (`tsx` dev runner)          | `backend/`            |
| Database | PostgreSQL (Supabase pooler) via Prisma            | `backend/prisma/`     |
| Validation | Zod (backend + frontend)                        | both workspaces       |
| Auth     | JWT (HS256) + refresh sessions + OTP codes         | `backend/src/core/auth` |
| Email    | Nodemailer (SMTP; prints to console when unset)    | `backend/src/shared`  |
| PDF      | PDFKit (invoice PDF generation)                    | `backend/src/shared`  |
| Shared   | `packages/shared-types` (API DTOs)                 | `packages/shared-types` |
| Tooling  | `packages/eslint-config` (flat config), Prettier   | `packages/eslint-config` |

## Repository Layout

```
├── backend/                  Express API
│   ├── prisma/               schema, migrations, seed
│   └── src/
│       ├── core/             auth, rbac, errors, http, logger, middleware
│       ├── modules/          audit-logs, auth, dashboard, invoices,
│       │                     notifications, purchase-orders, quotations,
│       │                     rfqs, users, vendors
│       └── shared/           helpers, validators, constants, types
├── frontend/                 Next.js application
│   ├── app/                  routes: (auth)/*, (dashboard)/*
│   ├── components/           reusable UI (ui/, layout/, shared/, forms/)
│   ├── features/             feature modules
│   ├── hooks/                reusable hooks
│   ├── lib/                  api client, auth context, data layer, utils
│   └── types/                shared type re-exports
├── packages/
│   ├── shared-types/         API contracts
│   └── eslint-config/        shared ESLint configuration
└── docs/                     architecture, API, database, auth docs
```

The repository is an npm workspace monorepo; everything is managed from the root.

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm
- A PostgreSQL database (the project ships with Supabase pooler configuration)

### Installation

```bash
npm install
```

### Database Setup

Create the database schema and seed demo data (run from the repository root):

```bash
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
```

### Environment Variables

Copy the example environment files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend variables include `DATABASE_URL` / `DIRECT_URL` (PostgreSQL), `JWT_ACCESS_SECRET`, CORS origins, and optional SMTP settings. The frontend only needs `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

### Running the Application

Run backend and frontend together (from the root):

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Scripts

| Command                                              | Description                          |
| ---------------------------------------------------- | ------------------------------------ |
| `npm run dev`                                        | Run backend + frontend together      |
| `npm run dev:backend`                                | Backend only (http://localhost:4000) |
| `npm run dev:frontend`                               | Frontend only (http://localhost:3000)|
| `npm run build`                                      | Build all workspaces                 |
| `npm run lint`                                       | Lint all workspaces                  |
| `npm run format`                                     | Format the repository (Prettier)     |
| `npm run format:check`                               | Check formatting                     |
| `npm run typecheck`                                  | Type-check all workspaces            |
| `npm run prisma:migrate --workspace backend`         | Apply Prisma migrations              |
| `npm run prisma:seed --workspace backend`            | Seed demo data                       |
| `npm run prisma:studio --workspace backend`          | Open Prisma Studio                   |

## Demo Accounts

The seed script creates the following accounts (all with `emailVerified: true`):

| Role                 | Email                          | Password      |
| -------------------- | ------------------------------ | ------------- |
| Admin                | `admin@gmail.com`              | `Admin@123`   |
| Procurement Officer  | `procurement.officer@gmail.com`| `Procure@123` |
| Approver (Manager)   | `approver@gmail.com`           | `Approve@123` |
| Vendor               | `vendor.user@gmail.com`        | `Vendor@123`  |

## Roles and Permissions

| Permission                 | ADMIN | PROCUREMENT OFFICER | APPROVER | VENDOR |
| -------------------------- | :---: | :-----------------: | :------: | :----: |
| users:manage               | ✓     |                     |          |        |
| vendors:manage             | ✓     |                     |          |        |
| auditLogs:view             | ✓     |                     |          |        |
| procurement:view           | ✓     | ✓                   |          |        |
| rfqs:create / rfqs:edit    | ✓     | ✓                   |          |        |
| quotations:view            | ✓     | ✓                   | ✓        | ✓      |
| quotations:select (approve/reject) | ✓  | ✓              | ✓        |        |
| purchaseOrders:generate    | ✓     | ✓                   |          |        |
| purchaseOrders:acknowledge | ✓     |                     |          | ✓      |
| invoices:generate          | ✓     | ✓                   |          |        |
| invoices:view              | ✓     | ✓                   | ✓        | ✓      |
| notifications:view         | ✓     | ✓                   | ✓        | ✓      |
| analytics:view             | ✓     | ✓                   | ✓        | ✓      |

The full permission matrix and enforcement logic live in `backend/src/core/rbac/`. Procurement Officers can list/view purchase orders and invoices through their generation permissions even though they do not hold the literal `:view` grants.

## API Reference

The backend exposes a versioned REST API under `/api/v1`. Every business endpoint is protected by JWT authentication plus a permission guard (`requirePermission`), and requests/responses use a consistent envelope:

```
{ "success": true, "data": ... }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

Key modules and their routes:

| Module          | Base path              |
| --------------- | ---------------------- |
| Auth            | `/api/v1/auth`         |
| Users           | `/api/v1/users`        |
| Vendors         | `/api/v1/vendors`      |
| RFQs            | `/api/v1/rfqs`         |
| Quotations      | `/api/v1/quotations`   |
| Purchase orders | `/api/v1/purchase-orders` |
| Invoices        | `/api/v1/invoices`     |
| Dashboard       | `/api/v1/dashboard`    |
| Audit logs      | `/api/v1/audit-logs`   |
| Notifications   | `/api/v1/notifications`|

See `docs/api.md` for detailed endpoint documentation and conventions.

## Documentation

- `docs/architecture.md` — architecture and conventions
- `docs/api.md` — API documentation and conventions
- `docs/database.md` — database/ORM notes and schema evolution
- `docs/auth.md` — authentication, sessions, and invitations
- `docs/admin.md` — admin workflows (users, invites, audit)
- `docs/Schema.md` — data model reference
- `context.md` — repository-level engineering rules