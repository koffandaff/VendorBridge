# Database

## Stack

- **Database**: PostgreSQL
- **ORM**: Prisma 6 (`@prisma/client`)
- **Location**: `backend/prisma/`

## Current state: intentionally empty

The Prisma schema (`backend/prisma/schema.prisma`) contains only the generated client and the
PostgreSQL datasource. No models, relations, indexes, migrations, or seed data exist:

- The database schema is a deliberate design decision and is being worked on separately.
- Adding features before the schema is designed would create throwaway models.

## Why Prisma 6

Prisma 7 is the current major line, but it requires a different setup (driver adapters,
`prisma.config.ts`, generated-client output). Prisma 6 was chosen to keep the foundation simple
and dependency-free until the first real query exists. Upgrading to Prisma 7 is a deliberate,
documented step once the schema is designed.

## Working with the schema (once it exists)

```bash
# from backend/
npx prisma migrate dev --name <migration-name>   # create schema changes + apply
npx prisma generate                              # regenerate the client
npx prisma studio                                # browse data in the browser
```

All commands above require `DATABASE_URL` in `backend/.env` (see `backend/.env.example`).

Environment variables are private to the backend. The frontend never touches the database directly.
