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
    server.ts       HTTP server bootstrap (reads PORT, listens)
    config/         runtime configuration loaders
    core/           cross-cutting infrastructure: auth, errors, http, logger, middleware, rbac
    modules/        feature modules (empty until features are introduced)
    shared/         constants, helpers, types, utils, validators
  prisma/           Prisma schema + migrations (no models yet)
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

## Frontend feature convention

Application features live in `frontend/features/<feature>/` (components, hooks, api, schemas,
types, constants). Cross-cutting concerns (api client, auth, validation) live in `frontend/lib/`.

## Deployment

No deployment/CI configuration is included yet. Vercel will render `frontend/` (and the backend
where compatible). Document decisions here as they are made.
