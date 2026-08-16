# API Documentation

## General

- **Base URL (development)**: `http://localhost:4000`
- Content type: `application/json`

## Endpoints

### System

| Method | Path      | Description                                |
| ------ | --------- | ------------------------------------------ |
| `GET`  | `/health` | Liveness check. Returns `{"status":"ok"}`. |

### Users & Managers (`/api/v1/users`)

| Method   | Path                       | Description                                                     |
| -------- | -------------------------- | --------------------------------------------------------------- |
| `POST`   | `/api/v1/users`            | Create manager/user account (ADMIN, PROCUREMENT_OFFICER, APPROVER, VENDOR) |
| `GET`    | `/api/v1/users`            | List users/managers (filter by role, isActive, search, pagination) |
| `GET`    | `/api/v1/users/:id`        | Get user details by ID (sanitized, excludes passwordHash)        |
| `PUT`    | `/api/v1/users/:id`        | Update user/manager profile                                     |
| `PATCH`  | `/api/v1/users/:id/status`  | Activate or deactivate user (`isActive = true/false`)           |
| `PATCH`  | `/api/v1/users/:id/password`| Reset user password (bcrypt hashed)                             |
| `DELETE` | `/api/v1/users/:id`        | Safe soft-delete user (sets `isActive = false`)                 |

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
- Centralized errors handled through `backend/src/core/errors/AppError.ts` and `backend/src/core/middleware/error.middleware.ts`.
- Standard API response structure defined in `backend/src/core/http/response.ts`.
