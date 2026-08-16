# Hackathon Monorepo Dhruvil07@23

Foundational monorepo for the hackathon application. Clean and ready for feature development.

## Stack

| Layer    | Tech                                 | Location            |
| -------- | ------------------------------------ | ------------------- |
| Frontend | Next.js 16 (App Router) + TypeScript | `frontend/`       |
| Backend  | Express 5 + TypeScript               | `backend/`        |
| Database | PostgreSQL                           | via Prisma (6)      |
| ORM      | Prisma (schema intentionally empty)  | `backend/prisma/` |
| Shared   | `packages/shared-types`            | TS types            |
| Tooling  | `packages/eslint-config`           | ESLint flat config  |

## Getting started

Requirements: Node.js >= 20.9.0, npm.

```bash
npm install
```

Copy example environment files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## Scripts (run from the root)

| Command                  | Description                               |
| ------------------------ | ----------------------------------------- |
| `npm run dev`          | Run backend + frontend together           |
| `npm run dev:backend`  | Run backend only (http://localhost:4000)  |
| `npm run dev:frontend` | Run frontend only (http://localhost:3000) |
| `npm run build`        | Build all workspaces                      |
| `npm run lint`         | Lint all workspaces                       |
| `npm run format`       | Format the repository (Prettier)          |
| `npm run typecheck`    | Type-check all workspaces                 |

## Repository layout

```
backend/        Express API (src/app.ts, src/server.ts, core/, modules/, shared/)
frontend/       Next.js app (app/, components/, features/, hooks/, lib/, types/)
packages/       shared-types + eslint-config
docs/           architecture, API, and database documentation
```

- `backend/src/modules/` - feature modules (intentionally empty until features land).
- `backend/src/core/` - cross-cutting infrastructure (auth, errors, http, logger, middleware, rbac).
- `frontend/features/` - frontend feature modules (intentionally empty).
- `docs/database.md` - why the Prisma schema is empty; how to evolve it.

## Documentation

- `docs/architecture.md` - architecture and conventions
- `docs/api.md` - API documentation and conventions
- `docs/database.md` - database/ORM notes
- `context.md` - engineering context and rules (populated separately)
