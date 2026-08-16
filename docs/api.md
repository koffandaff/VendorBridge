# API Documentation

## General

- **Base URL (development)**: `http://localhost:4000`
- Content type: `application/json`

## Endpoints

### System

| Method | Path      | Description                                |
| ------ | --------- | ------------------------------------------ |
| `GET`  | `/health` | Liveness check. Returns `{"status":"ok"}`. |

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

| Method   | Path                | Description                                                            |
| -------- | ------------------- | ---------------------------------------------------------------------- |
| `POST`   | `/api/v1/rfqs`      | Create an RFQ (DRAFT) with items and invited vendors; number auto-generated (`RFQ-YYYY-0001`) |
| `GET`    | `/api/v1/rfqs`      | List RFQs with search, status filter, pagination                       |
| `GET`    | `/api/v1/rfqs/:id`  | Get RFQ details with items, invited vendors, quotations                |
| `PUT`    | `/api/v1/rfqs/:id`  | Update RFQ metadata/items/invited vendors (DRAFT only)                 |
| `PATCH`  | `/api/v1/rfqs/:id/status` | Transition status (DRAFT→OPEN/CANCELLED, OPEN→CLOSED/CANCELLED)  |

### Quotations (`/api/v1/quotations`)

| Method   | Path                          | Description                                                    |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/v1/quotations`          | List quotations (filter by `rfqId`, `vendorId`, `status`)       |
| `GET`    | `/api/v1/quotations/compare?rfqId=:id` | Compare quotations for an RFQ (sorted by total, lowest first) |
| `GET`    | `/api/v1/quotations/:id`      | Get quotation details with vendor, RFQ, and items               |
| `PATCH`  | `/api/v1/quotations/:id/select` | Mark quotation SELECTED (from SUBMITTED/UNDER_REVIEW)         |
| `PATCH`  | `/api/v1/quotations/:id/reject` | Mark quotation REJECTED (from SUBMITTED/UNDER_REVIEW)         |

### Purchase Orders (`/api/v1/purchase-orders`)

| Method   | Path                          | Description                                                    |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| `POST`   | `/api/v1/purchase-orders`     | Generate a PO from a SELECTED quotation (APPROVED, number auto-generated `PO-YYYY-0001`) |
| `GET`    | `/api/v1/purchase-orders`     | List POs with status/vendor filter, search, pagination          |
| `GET`    | `/api/v1/purchase-orders/:id` | Get PO details with items, vendor, quotation, invoice           |
| `PATCH`  | `/api/v1/purchase-orders/:id/status` | Transition PO status (APPROVED→SENT→ACKNOWLEDGED→PARTIALLY_RECEIVED→COMPLETED, →CANCELLED) |

### Invoices (`/api/v1/invoices`)

| Method   | Path                     | Description                                                    |
| -------- | ------------------------ | -------------------------------------------------------------- |
| `POST`   | `/api/v1/invoices`       | Generate an invoice from a PO (ISSUED, number auto-generated `INV-YYYY-0001`) |
| `GET`    | `/api/v1/invoices`       | List invoices with status/vendor filter, search, pagination    |
| `GET`    | `/api/v1/invoices/:id`   | Get invoice details with items, vendor, purchase order         |
| `PATCH`  | `/api/v1/invoices/:id/status` | Transition invoice status (ISSUED→SENT→PAID, →CANCELLED)  |

## Architecture & Conventions

- Each feature owns its routes: `backend/src/modules/<feature>/<feature>.routes.ts`.
- Route handlers are thin: parsing -> validation -> controller/service -> response.
- Centralized errors handled through `backend/src/core/errors/AppError.ts` and `backend/src/core/middleware/error.middleware.ts`.
- Standard API response structure defined in `backend/src/core/http/response.ts`.
