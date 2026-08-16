import { Router } from "express";
import { InvoiceController } from "./invoice.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  invoiceQuerySchema,
  uuidParamSchema,
} from "./invoice.schema.js";

export const invoiceRouter: Router = Router();
const controller = new InvoiceController();

invoiceRouter.post(
  "/",
  authenticate,
  requirePermission("invoices:generate"),
  validateRequest({ body: createInvoiceSchema }),
  controller.createInvoice
);

invoiceRouter.get(
  "/",
  authenticate,
  requirePermission("invoices:generate", "invoices:view"),
  validateRequest({ query: invoiceQuerySchema }),
  controller.listInvoices
);

invoiceRouter.get(
  "/:id",
  authenticate,
  requirePermission("invoices:generate", "invoices:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.getInvoiceById
);

invoiceRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("invoices:generate"),
  validateRequest({ params: uuidParamSchema, body: updateInvoiceStatusSchema }),
  controller.updateInvoiceStatus
);

invoiceRouter.get(
  "/:id/pdf",
  authenticate,
  requirePermission("invoices:generate", "invoices:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.downloadInvoicePdf
);

invoiceRouter.post(
  "/:id/email",
  authenticate,
  requirePermission("invoices:generate"),
  validateRequest({ params: uuidParamSchema }),
  controller.emailInvoice
);