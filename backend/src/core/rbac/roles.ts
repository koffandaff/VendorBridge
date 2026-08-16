import type { UserRole } from "@prisma/client";

export type Permission =
  | "users:manage"
  | "vendors:manage"
  | "analytics:view"
  | "procurement:view"
  | "rfqs:create"
  | "rfqs:edit"
  | "vendors:assign"
  | "quotations:view"
  | "quotations:compare"
  | "quotations:select"
  | "purchaseOrders:generate"
  | "invoices:generate"
  | "approvals:view"
  | "approvals:approve"
  | "approvals:reject"
  | "approvals:remarks"
  | "workflow:view"
  | "rfqs:viewAssigned"
  | "rfqs:viewDetails"
  | "quotations:submit"
  | "quotations:editDraft"
  | "rfqs:trackStatus"
  | "purchaseOrders:view"
  | "invoices:view";

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ["users:manage", "vendors:manage", "analytics:view", "procurement:view"],
  PROCUREMENT_OFFICER: [
    "rfqs:create",
    "rfqs:edit",
    "vendors:assign",
    "quotations:view",
    "quotations:compare",
    "quotations:select",
    "purchaseOrders:generate",
    "invoices:generate",
  ],
  APPROVER: [
    "approvals:view",
    "approvals:approve",
    "approvals:reject",
    "approvals:remarks",
    "workflow:view",
  ],
  VENDOR: [
    "rfqs:viewAssigned",
    "rfqs:viewDetails",
    "quotations:submit",
    "quotations:editDraft",
    "rfqs:trackStatus",
    "purchaseOrders:view",
    "invoices:view",
  ],
};