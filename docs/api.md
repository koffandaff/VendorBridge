# API

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

## Conventions (to be followed as endpoints are added)

- Each feature owns its routes: `backend/src/modules/<feature>/<feature>.routes.ts`.
- Route handlers are thin: parsing -> validation -> controller/service -> response.
- Auth/RBAC: `backend/src/core/auth/guards.ts` and `backend/src/core/rbac/guards.ts`.
- Errors are handled centrally by `backend/src/core/errors/error.middleware.ts`.
- Response/error shapes come from `backend/src/core/http/response.ts` and the error middleware.
- Endpoint documentation is kept in sync with this file as features land.