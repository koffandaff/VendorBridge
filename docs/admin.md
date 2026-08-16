# Admin Module Guide

The admin slice covers user management, notifications, audit logging, and the analytics
dashboard. It is built on the same conventions as the vendor module (class-based controllers,
centralized validation, standardized response helpers). See [api.md](api.md) for the endpoint
reference.

## Modules

| Feature   | Location                                          | Permission gate          |
| --------- | ------------------------------------------------- | ------------------------ |
| Users     | `backend/src/modules/users/`                      | ADMIN (`users:manage`)   |
| Notifications | `backend/src/modules/notifications/`           | any role (`notifications:view`) |
| Audit logs | `backend/src/modules/audit-logs/`              | ADMIN (`auditLogs:view`) |
| Dashboard | `backend/src/modules/dashboard/`                  | ADMIN (`analytics:view`) |

All new permissions live in `ROLE_PERMISSIONS` (`backend/src/core/rbac/roles.ts`):
`auditLogs:view` (ADMIN) and `notifications:view` (all roles).

## Shared helpers

- `backend/src/shared/helpers/audit.helper.ts` — `recordAudit({ userId, action, entityType,
  entityId?, oldValue?, newValue?, metadata?, ipAddress? })`. Append-only; failures are logged and
  swallowed so auditing can never break a business operation.
- `backend/src/shared/helpers/notification.helper.ts` — `notify({ userId, type, title, message,
  entityType?, entityId? })`. Intended for future modules (approvals, PO, invoice) to emit
  in-app notifications.

## Users module

- `GET /users` — search (`search`), filters (`role`, `isActive`), sorting (`sortBy`:
  `createdAt|name|email`, `sortOrder`), pagination (`page`, `limit`).
- `PATCH /users/:id` — name / phone / role only. An admin cannot change their own role.
- `PATCH /users/:id/status` — activate/deactivate. An admin cannot deactivate themselves.
- `POST /users/:id/resend-invite` — regenerates the OTP invite and re-sends the email, reusing the
  auth module's OTP machinery (`createOtpToken` + `sendInviteEmail`). Rejects deactivated users.

Never expose `passwordHash` — the repository select list (permission `userListItemSelect`) omits it.

## Audit coverage

| Action                  | Endpoint                          |
| ----------------------- | --------------------------------- |
| `AUTH.LOGIN` / `AUTH.LOGOUT` / `AUTH.REGISTER` | auth module |
| `USER.UPDATED` / `USER.ACTIVATED` / `USER.DEACTIVATED` / `USER.INVITE_RESENT` | users module |

A database-level `CREATE` trigger is not used: all writes go through the central `recordAudit`
helper so the log is consistent and testable.

## Dashboard

- `/dashboard/summary` — counts + per-status breakdowns (users, vendors, RFQs, quotations,
  invoices), pending approvals, PO spend, invoice outstanding.
- `/dashboard/trends?months=N` — per-month counts via raw SQL month bucketing (`date_trunc`).
- `/dashboard/vendor-performance` — POs grouped by vendor, ranked by total spend (non-draft).

Money aggregates flow through Prisma `Decimal` and are serialized as strings in responses;
`number` arithmetic is never applied to money.

## Testing notes

- Regression checks live in `backend/tests/` (import-level verification such as
  `verify-vendors.ts`).
- Live HTTP checks use the demo seeded accounts: `admin@gmail.com` / `Admin@123` (ADMIN),
  `procurement.officer@gmail.com` / `Procure@123`, `approver@gmail.com` / `Approve@123`.
- The seed (`backend/prisma/seed.ts`) is idempotent and populates procurement data end-to-end,
  which the dashboard aggregates rely on for demo purposes.