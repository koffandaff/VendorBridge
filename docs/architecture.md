# Architecture

## Stack

- **Frontend**: Next.js 16 (App Router, TypeScript) - `frontend/`
- **Backend**: Express 5 + TypeScript - `backend/`
- **Database**: PostgreSQL
- **ORM**: Prisma 6 - `backend/prisma/` (schema intentionally empty, see `database.md`)
- **Shared code**: `packages/shared-types` (cross-stack types), `packages/eslint-config` (shared ESLint flat config)
- **Deployment**: Vercel is the expected platform (no deployment config added yet)

## Repository layout

```
backend/
  src/
    app.ts          Express app assembly (exported for tests/serverless reuse)
    server.ts       HTTP server bootstrap (reads env, listens)
    config/         env validation (zod, fail-fast) + app constants
    core/           cross-cutting infrastructure:
                      auth/    JWT, bcrypt, OTP, tokens, request guards
                      errors/  typed error classes + central error middleware
                      http/    response envelope helpers
                      logger/  structured JSON logging + request logger
                      middleware/ request-ID, zod validation
                      rbac/    role → permission map + permission guards
    modules/        feature modules: auth/ (login, register, OTP, sessions)
    shared/         Prisma client singleton, email (nodemailer + console fallback)
    types/          Express type augmentations (requestId, user)
  prisma/           Prisma schema + migrations
  tests/            backend tests (runner not chosen yet)
frontend/
  app/              Next.js App Router: route groups (auth), (dashboard), api route handlers
  components/       ui, layout, forms, shared components
  features/         feature modules (empty until features are introduced)
  hooks/            shared hooks
  lib/              api client, auth helpers, constants, utils, validation
  types/            app-level TypeScript types
packages/
  shared-types/     types shared between frontend and backend
  eslint-config/    shared ESLint flat config
```

## Backend feature module convention

When a feature is introduced, `backend/src/modules/<feature>/` contains all layers of that feature
(routes, controller, service, repository, schema, types, constants, index). Core infrastructure
(auth, errors, http, logger, middleware, rbac) stays in `backend/src/core/` and is framework-agnostic.

## Current backend capabilities

- **Configuration**: `src/config/env.ts` validates all env vars with zod at startup (fail-fast);
  secrets are never logged.
- **Security middleware**: helmet, explicit CORS origins, request body limit, rate limiting,
  request IDs, structured logs, centralized error handling.
- **Authentication**: invite-only accounts (ADMIN registers users + sends OTP email), JWT access
  tokens + opaque rotating refresh sessions, OTP flows (forgot/verify/reset), centralized in
  `core/auth` with the business logic in `modules/auth`. See **[auth.md](auth.md)**.
- **Authorization**: centralized `Role → Permission` map in `core/rbac` (Schema.md §45), enforced
  via reusable `requirePermission(...)` guards.
- **Observability**: single-line JSON logs with `requestId`, per-request duration and status.

## Authentication-related decisions

- Access tokens (JWT, ~15 min) are stateless; revocation happens at the refresh-session layer.
- Tokens/OTPs are transmitted in request bodies/headers, not cookies (no CSRF surface to manage).
- OTPs are sha256-hashed at rest, single use, and expire in 10 minutes.
- Email is delivered via nodemailer; when SMTP is unset (dev only) emails print to the console —
  SMTP is enforced in production at startup.

## Frontend feature convention

Application features live in `frontend/features/<feature>/` (components, hooks, api, schemas,
types, constants). Cross-cutting concerns (api client, auth, validation) live in `frontend/lib/`.

## Deployment

No deployment/CI configuration is included yet. Vercel will render `frontend/` (and the backend
where compatible). Document decisions here as they are made.
