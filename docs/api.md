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

### Users & Managers (`/api/v1/users`)

| Method   | Path                       | Description                                                     |
| -------- | -------------------------- | --------------------------------------------------------------- |
| `POST`   | `/api/v1/users`            | Create manager/user account (ADMIN, PROCUREMENT_OFFICER, APPROVER, VENDOR) |
| `GET`    | `/api/v1/users`            | List users/managers (filter by role, isActive, search, pagination) |
| `GET`    | `/api/v1/users/:id`        | Get user details by ID (sanitized, excludes passwordHash)        |
| `PUT`    | `/api/v1/users/:id`        | Update user/manager profile                                     |
| `PATCH`  | `/api/v1/users/:id/status`  | Activate or deactivate user (`isActive = true/false`)           |
| `PATCH`  | `/api/v1/users/:id/password`| Reset user password (bcrypt hashed)                             |
| `DELETE` | `/api/v1/users/:id`        | Safe soft-delete user (sets `isActive = false`)                 |

### Vendor Categories (`/api/v1/vendors/categories`)

| Method   | Path                         | Description                                      |
| -------- | ---------------------------- | ------------------------------------------------ |
| `POST`   | `/api/v1/vendors/categories`     | Create a vendor category                         |
| `GET`    | `/api/v1/vendors/categories`     | List all vendor categories                       |
| `GET`    | `/api/v1/vendors/categories/:id` | Get vendor category details by ID                |
| `PUT`    | `/api/v1/vendors/categories/:id` | Update a vendor category                         |
| `DELETE` | `/api/v1/vendors/categories/:id` | Delete vendor category (fails if vendors exist)  |

### Vendors (`/api/v1/vendors`)

| Method   | Path                             | Description                                      |
| -------- | -------------------------------- | ------------------------------------------------ |
| `POST`   | `/api/v1/vendors`                | Create a vendor (auto-generates code if omitted) |
| `GET`    | `/api/v1/vendors`                | List vendors with search, filter, pagination     |
| `GET`    | `/api/v1/vendors/:id`            | Get vendor details by ID                         |
| `PUT`    | `/api/v1/vendors/:id`            | Update vendor details                            |
| `PATCH`  | `/api/v1/vendors/:id/status`     | Update vendor status                             |
| `PATCH`  | `/api/v1/vendors/:id/rating`     | Update vendor rating (0.00 - 5.00)               |
| `DELETE` | `/api/v1/vendors/:id`            | Soft-delete vendor (sets status to INACTIVE)     |

### Vendor Contacts (`/api/v1/vendors/:vendorId/contacts`)

| Method   | Path                                       | Description                              |
| -------- | ------------------------------------------ | ---------------------------------------- |
| `POST`   | `/api/v1/vendors/:vendorId/contacts`       | Add contact to vendor                    |
| `GET`    | `/api/v1/vendors/:vendorId/contacts`       | List all contacts for a vendor           |
| `PUT`    | `/api/v1/vendors/:vendorId/contacts/:id`   | Update a vendor contact                  |
| `DELETE` | `/api/v1/vendors/:vendorId/contacts/:id`   | Delete a vendor contact                  |

### RFQs (`/api/v1/rfqs`)

All procurement endpoints require `Authorization: Bearer <access-token>`.
Permissions per route: create/edit `rfqs:create`/`rfqs:edit`, list `rfqs:create` (officer) / `procurement:view` (admin), details also `rfqs:viewDetails` (vendor).

| Method   | Path                | Description                                                            |
| -------- | ------------------- | ---------------------------------------------------------------------- |
| `POST`   | `/api/v1/rfqs`      | Create an RFQ (DRAFT) with items and invited vendors; number auto-generated (`RFQ-YYYY-0001`) |
| `GET`    | `/api/v1/rfqs`      | List RFQs with search, status filter, pagination                       |
| `GET`    | `/api/v1/rfqs/:id`  | Get RFQ details with items, invited vendors, quotations                |
| `PUT`    | `/api/v1/rfqs/:id`  | Update RFQ metadata/items/invited vendors (DRAFT only)                 |
| `PATCH`  | `/api/v1/rfqs/:id/status` | Transition status (DRAFT→OPEN/CANCELLED, OPEN→CLOSED/CANCELLED)  |

### Quotations (`/api/v1/quotations`)

Permissions: view `quotations:view`, compare `quotations:compare`, select/reject `quotations:select`.

| Method   | Path                          | Description                                                    |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/v1/quotations`          | List quotations (filter by `rfqId`, `vendorId`, `status`)       |
| `GET`    | `/api/v1/quotations/compare?rfqId=:id` | Compare quotations for an RFQ (sorted by total, lowest first) |
| `GET`    | `/api/v1/quotations/:id`      | Get quotation details with vendor, RFQ, and items               |
| `PATCH`  | `/api/v1/quotations/:id/select` | Mark quotation SELECTED (from SUBMITTED/UNDER_REVIEW)         |
| `PATCH`  | `/api/v1/quotations/:id/reject` | Mark quotation REJECTED (from SUBMITTED/UNDER_REVIEW)         |

### Purchase Orders (`/api/v1/purchase-orders`)

Permissions: generate/transition `purchaseOrders:generate`, view `purchaseOrders:generate` or `purchaseOrders:view`.

| Method   | Path                          | Description                                                    |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| `POST`   | `/api/v1/purchase-orders`     | Generate a PO from a SELECTED quotation (APPROVED, number auto-generated `PO-YYYY-0001`) |
| `GET`    | `/api/v1/purchase-orders`     | List POs with status/vendor filter, search, pagination          |
| `GET`    | `/api/v1/purchase-orders/:id` | Get PO details with items, vendor, quotation, invoice           |
| `PATCH`  | `/api/v1/purchase-orders/:id/status` | Transition PO status (APPROVED→SENT→ACKNOWLEDGED→PARTIALLY_RECEIVED→COMPLETED, →CANCELLED) |

### Invoices (`/api/v1/invoices`)

Permissions: generate/transition `invoices:generate`, view `invoices:generate` or `invoices:view`.

| Method   | Path                     | Description                                                    |
| -------- | ------------------------ | -------------------------------------------------------------- |
| `POST`   | `/api/v1/invoices`       | Generate an invoice from a PO (ISSUED, number auto-generated `INV-YYYY-0001`) |
| `GET`    | `/api/v1/invoices`       | List invoices with status/vendor filter, search, pagination    |
| `GET`    | `/api/v1/invoices/:id`   | Get invoice details with items, vendor, purchase order         |
| `PATCH`  | `/api/v1/invoices/:id/status` | Transition invoice status (ISSUED→SENT→PAID, →CANCELLED)  |

## Architecture & Conventions

- Each feature owns its routes: `backend/src/modules/<feature>/<feature>.routes.ts`.
- Route handlers are thin: parsing -> validation -> controller/service -> response.
- Auth/RBAC: `backend/src/core/auth/guards.ts` and `backend/src/core/rbac/guards.ts`.
- Centralized errors handled through `backend/src/core/errors/AppError.ts` and the centralized error middleware (`backend/src/core/errors/error.middleware.ts` / `backend/src/core/middleware/error.middleware.ts`).
- Standard API response structure defined in `backend/src/core/http/response.ts`.
- Endpoint documentation is kept in sync with this file as features land.
