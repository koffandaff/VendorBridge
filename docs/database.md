# Database

## Stack

- **Database**: PostgreSQL on Supabase (connection-pooled via Supavisor)
- **ORM**: Prisma 6 (`@prisma/client`)
- **Location**: `backend/prisma/` — schema, migrations, seed
- **Schema design**: `docs/Schema.md` (VendorBridge database schema & implementation guide)

## Current state

The Prisma schema (`backend/prisma/schema.prisma`) implements the full `docs/Schema.md` design:

- **19 entities** (docs/Schema.md lists 19 entities; its "18 tables" count is a typo):
  Authentication (`User`, `Session`, `PasswordResetToken`), Vendor management
  (`Vendor`, `VendorCategory`, `VendorContact`), Procurement (`RFQ`, `RFQItem`,
  `RFQVendor`, `Attachment`, `Quotation`, `QuotationItem`), Approval & fulfillment
  (`Approval`, `PurchaseOrder`, `PurchaseOrderItem`, `Invoice`, `InvoiceItem`),
  System (`Notification`, `AuditLog`).
- **10 enums** for all workflow states and roles (never arbitrary strings).
- **Conventions** (docs/Schema.md §42): UUID PKs (`@db.Uuid`), `createdAt @default(now())`,
  `updatedAt @updatedAt`, money as `Decimal(15,2)`, tax rates as `Decimal(5,2)`,
  vendor rating as `Decimal(3,2)` (range 0.00–5.00), `BigInt` for file sizes.
- **Delete/cascade rules** (docs/Schema.md §39): session/token, vendor contacts, and
  document children (RFQ items, quotation/PO/invoice items, join rows) cascade;
  cross-document references (`Quotation → PurchaseOrder`, `PurchaseOrder → Invoice`)
  are restrictive so historical financial records cannot disappear.
- **Uniqueness**: `Quotation.purchaseOrder` is unique (one PO per quotation) and
  `Invoice.purchaseOrderId` is unique (one invoice per PO for this implementation),
  per docs/Schema.md §47 invariants.
- **Indexes** follow docs/Schema.md §40, plus index coverage for all FKs.

### Minor interpretations (not explicit in docs/Schema.md)

- `VendorContact.designation`, `Approval.remarks`, `PurchaseOrder.notes` /
  `Invoice.notes` - treated as nullable where drafts are normal
  (`PurchaseOrder.notes`, `Invoice.notes`), required where the doc is explicit
  (`Quotation.notes`). `AuditLog` JSON/metadata fields and `entityId` are nullable so
  append-only auditing never fails on missing context.
- `status` fields default to the initial workflow state (`PENDING`/`DRAFT`/`INVITED`).

## Connection (Supabase)

- `DATABASE_URL` - transaction-mode pooler (port 6543, `?pgbouncer=true`) for the app.
- `DIRECT_URL` - session-mode pooler (port 5432) that Prisma Migrate uses (DDL support).
  Both are wired in the Prisma datasource block.
- Real credentials live only in `backend/.env` (git-ignored); see `backend/.env.example`.
- Special characters in the DB password are percent-encoded in the connection URLs.

## Migrations

No migration exists yet. Creating and applying the initial migration
(`prisma migrate dev --name init`) requires explicit approval (backend/rules.md §14)
because it writes to the live database.

```bash
# from backend/
npx prisma migrate dev --name init   # create + apply initial migration
npx prisma generate                  # regenerate the client
npx prisma studio                    # browse data in the browser
```

Seed data is planned for the demo (docs/Schema.md §49) after the migration exists.

Environment variables are private to the backend. The frontend never touches the database directly.