# API Documentation

## General

- **Base URL (development)**: `http://localhost:4000`
- Content type: `application/json`
- All business endpoints are prefixed with `/api/v1` (see `backend/src/config/constants.ts`).

## Response envelope

Every endpoint (except `/health`) responds with one of two shapes:

```jsonc
// success
{ "success": true, "data": { /* resource */ } }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "invalid request body", "details": [] } }
```

Error codes: `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401), `AUTHORIZATION_ERROR` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `PAYLOAD_TOO_LARGE` (413), `RATE_LIMIT_EXCEEDED` (429),
`DATABASE_ERROR` (500), `INTERNAL_SERVER_ERROR` (500), `EXTERNAL_SERVICE_ERROR` (502).

Every response includes the `x-request-id` header for tracing.

## Health

| Method | Path      | Description                                                        |
| ------ | --------- | ------------------------------------------------------------------ |
| `GET`  | `/health` | Liveness + dependency check. `{"status":"ok","database":"up"}`.    |

## Authentication — `/api/v1/auth`

Full documentation (flows, token/OTP design, security notes, env vars, demo accounts):
**[auth.md](auth.md)**

| Method | Path             | Auth          | Description                                             |
| ------ | ---------------- | ------------- | ------------------------------------------------------- |
| `POST` | `/auth/login`    | –             | Login with email/password, returns tokens               |
| `POST` | `/auth/register` | ADMIN (`users:manage`) | Create a user + send OTP invite email          |
| `POST` | `/auth/refresh`  | –             | Rotate an opaque refresh token for a new token pair     |
| `POST` | `/auth/logout`   | Bearer        | Revoke a refresh session                                |
| `GET`  | `/auth/me`       | Bearer        | Current user profile                                    |
| `POST` | `/auth/change-password` | Bearer | Change password (revokes all sessions)              |
| `POST` | `/auth/forgot-password` | –      | Request a verification code by email                    |
| `POST` | `/auth/verify-otp` | –           | Verify a 6-digit code (single use)                      |
| `POST` | `/auth/reset-password` | –       | Set a new password with a verified code                 |

### Auth conventions (contract)

- Access token: `Authorization: Bearer <jwt>` (15 min default, HS256, payload `{ sub, role }`).
- Refresh token: opaque 256-bit token, sent in the request body (e.g. login/refresh responses),
  never stored plain — only its sha256 hash exists in `Session.token`.
- Headers/interceptors must refresh before the access token expires: call
  `POST /auth/refresh` with the current refresh token and replace both tokens on success.

### Vendor Categories (`/api/v1/vendors/categories`)

| Method   | Path                         | Auth          | Description                                      |
| -------- | ---------------------------- | ------------- | ------------------------------------------------ |
| `POST`   | `/api/v1/vendors/categories`     | ADMIN (`vendors:manage`) | Create a vendor category               |
| `GET`    | `/api/v1/vendors/categories`     | Bearer        | List all vendor categories                       |
| `GET`    | `/api/v1/vendors/categories/:id` | Bearer        | Get vendor category details by ID                |
| `PUT`    | `/api/v1/vendors/categories/:id` | ADMIN (`vendors:manage`) | Update a vendor category              |
| `DELETE` | `/api/v1/vendors/categories/:id` | ADMIN (`vendors:manage`) | Delete vendor category (fails if vendors exist) |

### Vendors (`/api/v1/vendors`)

| Method   | Path                             | Auth          | Description                                      |
| -------- | -------------------------------- | ------------- | ------------------------------------------------ |
| `POST`   | `/api/v1/vendors`                | ADMIN (`vendors:manage`) | Create a vendor (auto-generates code if omitted) |
| `GET`    | `/api/v1/vendors`                | Bearer        | List vendors with search, filter, pagination     |
| `GET`    | `/api/v1/vendors/:id`            | Bearer        | Get vendor details by ID                         |
| `PUT`    | `/api/v1/vendors/:id`            | ADMIN (`vendors:manage`) | Update vendor details                    |
| `PATCH`  | `/api/v1/vendors/:id/status`     | ADMIN (`vendors:manage`) | Update vendor status                     |
| `PATCH`  | `/api/v1/vendors/:id/rating`     | ADMIN (`vendors:manage`) | Update vendor rating (0.00 - 5.00)       |
| `DELETE` | `/api/v1/vendors/:id`            | ADMIN (`vendors:manage`) | Soft-delete vendor (sets status to INACTIVE) |

### Vendor Contacts (`/api/v1/vendors/:vendorId/contacts`)

| Method   | Path                                       | Auth          | Description                              |
| -------- | ------------------------------------------ | ------------- | ---------------------------------------- |
| `POST`   | `/api/v1/vendors/:vendorId/contacts`       | ADMIN (`vendors:manage`) | Add contact to vendor          |
| `GET`    | `/api/v1/vendors/:vendorId/contacts`       | Bearer        | List all contacts for a vendor           |
| `PUT`    | `/api/v1/vendors/:vendorId/contacts/:id`   | ADMIN (`vendors:manage`) | Update a vendor contact        |
| `DELETE` | `/api/v1/vendors/:vendorId/contacts/:id`   | ADMIN (`vendors:manage`) | Delete a vendor contact        |

## Admin — `/api/v1/users`

All user endpoints require ADMIN (`users:manage`). Passwords are never exposed in responses.

| Method | Path                       | Auth                | Description                                         |
| ------ | -------------------------- | ------------------- | --------------------------------------------------- |
| `GET`  | `/users`                   | ADMIN (`users:manage`) | List users (search, role/isActive filter, sort, pagination) |
| `GET`  | `/users/:id`               | ADMIN (`users:manage`) | Get user details by ID                         |
| `PATCH`| `/users/:id`               | ADMIN (`users:manage`) | Update name / phone / role (cannot change own role) |
| `PATCH`| `/users/:id/status`        | ADMIN (`users:manage`) | Activate/deactivate a user (cannot deactivate self) |
| `POST` | `/users/:id/resend-invite` | ADMIN (`users:manage`) | Re-issue the OTP invite email for a user             |

Mutating endpoints record an audit log entry (`USER.UPDATED`, `USER.ACTIVATED`, `USER.DEACTIVATED`,
`USER.INVITE_RESENT`).

## Notifications — `/api/v1/notifications`

Users only ever see their own notifications (`notifications:view` is granted to every role).

| Method | Path                          | Auth   | Description                                  |
| ------ | ----------------------------- | ------ | -------------------------------------------- |
| `GET`  | `/notifications`              | Bearer | List my notifications (pagination, `?unread=true`) |
| `GET`  | `/notifications/unread-count` | Bearer | Count of unread notifications                |
| `PATCH`| `/notifications/:id/read`     | Bearer | Mark one notification as read                |
| `PATCH`| `/notifications/read-all`     | Bearer | Mark all of my notifications as read         |

Internal helper `notify()` (`backend/src/shared/helpers/notification.helper.ts`) is exposed to
future modules (RFQ, approvals, PO, invoice) for emitting `Notification` rows.

## Audit logs — `/api/v1/audit-logs`

Append-only. Records who did what, to which entity, what changed (old/new values), and from which IP.

| Method | Path           | Auth                  | Description |
| ------ | -------------- | --------------------- | ----------- |
| `GET`  | `/audit-logs`  | ADMIN (`auditLogs:view`) | List audit entries — filters: `userId`, `entityType`, `action`, `from`/`to` (ISO datetime), `page`, `limit` |

Currently audited: login, register, logout, and every user mutation. `recordAudit()` helper:
`backend/src/shared/helpers/audit.helper.ts`.

## Dashboard — `/api/v1/dashboard`

Requires ADMIN (`analytics:view`).

| Method | Path                           | Auth                  | Description |
| ------ | ------------------------------ | --------------------- | ----------- |
| `GET`  | `/dashboard/summary`           | ADMIN (`analytics:view`) | KPI cards: users, vendors by status, RFQs, quotations, pending approvals, PO spend, invoice outstanding |
| `GET`  | `/dashboard/trends?months=6`   | ADMIN (`analytics:view`) | Monthly RFQ/PO/invoice counts for last N months (1–24, default 6) |
| `GET`  | `/dashboard/vendor-performance`| ADMIN (`analytics:view`) | Vendors ranked by PO spend with order count |

Money values (spend, outstanding) are Decimal and returned as strings — never as floats.

## Seed data

`npm run prisma:seed` (backend) creates demo users, categories, 3 vendors with contacts, 2 RFQs
with items and invited vendors, 2 quotations (one under review + pending approval, one selected +
approved), a purchase order, an invoice, notifications, and audit entries — enough to populate the
dashboard immediately. The seed is idempotent and safe to re-run.

## Architecture & Conventions

- Each feature owns its routes: `backend/src/modules/<feature>/<feature>.routes.ts`.
- Route handlers are thin: parsing -> validation -> controller/service -> response.
- Auth/RBAC: `backend/src/core/auth/guards.ts` and `backend/src/core/rbac/guards.ts`.
  Permissions are defined in `backend/src/core/rbac/roles.ts` (`ROLE_PERMISSIONS`).
- Centralized errors handled through `backend/src/core/errors/AppError.ts` and the centralized error middleware (`backend/src/core/middleware/error.middleware.ts`).
- Standard API response structure defined in `backend/src/core/http/response.ts`.
- Endpoint documentation is kept in sync with this file as features land.
