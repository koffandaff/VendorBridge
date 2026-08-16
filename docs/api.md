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

## Architecture & Conventions

- Each feature owns its routes: `backend/src/modules/<feature>/<feature>.routes.ts`.
- Route handlers are thin: parsing -> validation -> controller/service -> response.
- Auth/RBAC: `backend/src/core/auth/guards.ts` and `backend/src/core/rbac/guards.ts`.
- Centralized errors handled through `backend/src/core/errors/AppError.ts` and the centralized error middleware (`backend/src/core/errors/error.middleware.ts` / `backend/src/core/middleware/error.middleware.ts`).
- Standard API response structure defined in `backend/src/core/http/response.ts`.
- Endpoint documentation is kept in sync with this file as features land.
