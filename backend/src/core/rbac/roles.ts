import type { UserRole } from "@prisma/client";

export type Permission =
  | "users:manage"
  | "vendors:manage"
  | "auditLogs:view"
  | "notifications:view"
  | "analytics:view"
  | "procurement:view"
  | "rfqs:create"
  | "rfqs:edit"
  | "vendors:assign"
  | "quotations:view"
  | "quotations:compare"
  | "quotations:select"
  | "purchaseOrders:generate"
  | "purchaseOrders:acknowledge"
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
  ADMIN: [
    "users:manage",
    "vendors:manage",
    "auditLogs:view",
    "notifications:view",
    "analytics:view",
    "procurement:view",
    "quotations:view",
    "quotations:compare",
    "purchaseOrders:view",
    "invoices:view",
  ],
  PROCUREMENT_OFFICER: [
    "notifications:view",
    "analytics:view",
    "procurement:view",
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
    "notifications:view",
    "analytics:view",
    "approvals:view",
    "approvals:approve",
    "approvals:reject",
    "approvals:remarks",
    "workflow:view",
    "purchaseOrders:view",
    "invoices:view",
  ],
  VENDOR: [
    "notifications:view",
    "analytics:view",
    "rfqs:viewAssigned",
    "rfqs:viewDetails",
    "quotations:submit",
    "quotations:editDraft",
    "rfqs:trackStatus",
    "purchaseOrders:view",
    "purchaseOrders:acknowledge",
    "invoices:view",
  ],
};