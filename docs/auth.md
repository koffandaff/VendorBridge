# Authentication (backend)

The auth module lives in `backend/src/modules/auth/` and is mounted at `/api/v1/auth`.

There is **no public signup**. Accounts are created by an administrator (ADMIN role) via the
invite endpoint; the invitee completes account setup through the OTP verification flow.

## How signup works (invite flow)

```text
ADMIN creates user (POST /register)
    ↓
User row created (no usable password) +
6-digit OTP once (sha256-hashed, 10 min, single use)
    ↓
Invite email delivered (SMTP, or console fallback in dev)
    ↓
User enters the code (POST /verify-otp)     → code consumed
    ↓
User sets a password (POST /reset-password) → password set, sessions revoked
    ↓
User can now log in
```

A lost/deleted invite email is recovered with `POST /forgot-password`, which issues a new OTP
(previous unused OTPs for the user are invalidated).

## Authentication design

| Concern        | Mechanism                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Access token   | JWT (HS256), 15 min default, payload `{ sub: userId, role }`, sent as `Authorization: Bearer ...`  |
| Refresh token  | Opaque 256-bit random hex; only its sha256 hash is stored in `Session.token` (30 days default)    |
| Session record | `Session` table (FK `userId`, cascade delete); expired entries are deleted on use                 |
| Rotations      | Every `POST /refresh` replaces the stored token hash with a new one (token reuse is not possible) |
| Logout         | `POST /logout` deletes the session; a logged-out refresh token can never be used again            |
| /me            | `GET /me` loads the user fresh from the database on every request (inactive users are rejected)   |
| Fresh guards   | Every authenticated request re-fetches the user; a disabled account is rejected immediately       |

Access tokens are short-lived and deliberately **not** revocable; revocation happens at the
refresh layer. If credentials change (`change-password`, `reset-password`), **all** of the user's
refresh sessions are revoked.

### OTP design

- 6 digits, generated with `crypto.randomInt`
- Valid for `OTP_EXPIRES_MINUTES` (default 10)
- Stored as a sha256 hash (`PasswordResetToken.token`), never in plain text
- Single use (`usedAt`); issuing a new OTP invalidates previous unused ones for the user
- Compared with `timingSafeEqual`
- Never logged in SMTP mode

## Endpoints

All routes below are prefixed with `/api/v1/auth`. `Bearer` = access token required via
`Authorization: Bearer <token>`.

| Method | Path             | Auth          | Body                                                                 | Success                          |
| ------ | ---------------- | ------------- | -------------------------------------------------------------------- | -------------------------------- |
| POST   | `/login`         | no            | `{ email, password }`                                                | `{ user, tokens }` (200)         |
| POST   | `/register`      | ADMIN         | `{ name, email, role, phone? }`                                      | user DTO (201) + invite email    |
| POST   | `/refresh`       | no            | `{ refreshToken }`                                                   | `{ accessToken, refreshToken }`  |
| POST   | `/logout`        | Bearer        | `{ refreshToken }`                                                   | `null`                           |
| GET    | `/me`            | Bearer        | –                                                                    | user DTO                         |
| POST   | `/change-password` | Bearer      | `{ currentPassword, newPassword }`                                   | `null` (sessions revoked)        |
| POST   | `/forgot-password` | no          | `{ email }`                                                          | `null` (always succeeds)         |
| POST   | `/verify-otp`    | no            | `{ email, otp }`                                                     | `null` (OTP consumed)            |
| POST   | `/reset-password` | no           | `{ email, otp, newPassword }`                                        | `null` (password set + sessions revoked) |

`role` is one of `ADMIN | PROCUREMENT_OFFICER | APPROVER | VENDOR`.

New-password rules: 8–72 characters, at least one letter and one number (bcrypt limits input to
72 bytes).

### Possible errors

| Status | Code                   | When                                                            |
| ------ | ---------------------- | --------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`     | Zod validation failed (details carry the fields) or bad OTP     |
| 401    | `AUTHENTICATION_ERROR` | Missing/invalid/expired token, bad credentials, disabled account|
| 403    | `AUTHORIZATION_ERROR`  | Authenticated user lacks `users:manage` on `/register`          |
| 404    | `NOT_FOUND`            | Unknown route                                                    |
| 409    | `CONFLICT`             | Registering an email that already exists                         |
| 429    | `RATE_LIMIT_EXCEEDED`  | Too many requests (see below)                                    |

`/forgot-password` intentionally returns success even for unknown/inactive emails to avoid
account enumeration.

## Rate limits

15-minute sliding windows, keyed by client IP (the `keyGenerator` default), via
`express-rate-limit`:

| Route(s)                        | Max requests |
| ------------------------------- | ------------ |
| `/login`, `/register`           | 10           |
| `/forgot-password`, `/verify-otp`, `/reset-password` | 5 |

Responses include `Retry-After` and `RateLimit-*` headers. Note: when running behind a reverse
proxy, enable Express's `trust proxy` setting so the true client IP is used.

## Response envelope

Success: `{ "success": true, "data": ... }`
Error: `{ "success": false, "error": { "code", "message", "details?" } }`

Every request/response carries the `x-request-id` header (generated when absent) so requests can
be traced in the logs. `GET /health` is the only non-envelope endpoint.

## Security notes

- Passwords hashed with bcrypt, cost 12.
- OTPs, refresh tokens, and password hashes are never returned in API responses.
- The console email fallback is only active outside production; SMTP is mandatory in production
  (startup fails otherwise).
- Emails are sent via nodemailer with 10s connect/greeting/socket timeouts; failures surface as
  `EXTERNAL_SERVICE_ERROR` (502) and are logged without sensitive detail.

## Environment variables

See `backend/.env.example` for the full annotated list. Auth-relevant ones:

| Variable                     | Default              | Purpose                                   |
| ---------------------------- | -------------------- | ----------------------------------------- |
| `JWT_ACCESS_SECRET`          | *required* (≥32)     | HMAC secret for access tokens             |
| `JWT_ACCESS_EXPIRES_IN`      | `15m`                | Access token lifetime (jsonwebtoken)      |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `30`                 | Refresh session lifetime                  |
| `OTP_EXPIRES_MINUTES`        | `10`                 | OTP lifetime                              |
| `CORS_ORIGINS`               | `http://localhost:3000` | Comma-separated allowed origins        |
| `CLIENT_URL`                 | `http://localhost:3000` | Frontend base URL                      |
| `SMTP_HOST` / `SMTP_PORT`    | *unset*              | SMTP server (console fallback when unset) |
| `SMTP_USER` / `SMTP_PASS`    | *unset*              | SMTP credentials                          |
| `SMTP_FROM`                  | *unset*              | Sender address                            |

## Demo accounts (development seed only — never use in production)

| Email                          | Password     | Role                  |
| ------------------------------ | ------------ | --------------------- |
| `admin@gmail.com`              | `Admin@123`  | ADMIN                 |
| `procurement.officer@gmail.com`| `Procure@123`| PROCUREMENT_OFFICER   |
| `approver@gmail.com`           | `Approve@123`| APPROVER              |
| `vendor.user@gmail.com`        | `Vendor@123` | VENDOR                |

A demo vendor (`ACME-IT-001`, category "IT & Software") is seeded alongside so the VENDOR
account has data to work with.

## Authorization model

Permissions are centralized in `backend/src/core/rbac/roles.ts` (mapped from Schema.md §45).
Routes declare permissions (`requirePermission("users:manage")`) instead of hardcoded role
checks. `Role → Permission` lookup lives in one place.