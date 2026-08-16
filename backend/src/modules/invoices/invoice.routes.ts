import { Router } from "express";
import { InvoiceController } from "./invoice.controller.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  invoiceQuerySchema,
  uuidParamSchema,
} from "./invoice.schema.js";

export const invoiceRouter: Router = Router();
const controller = new InvoiceController();

invoiceRouter.post("/", validateRequest({ body: createInvoiceSchema }), controller.createInvoice);

invoiceRouter.get("/", validateRequest({ query: invoiceQuerySchema }), controller.listInvoices);

invoiceRouter.get("/:id", validateRequest({ params: uuidParamSchema }), controller.getInvoiceById);

invoiceRouter.patch(
  "/:id/status",
  validateRequest({ params: uuidParamSchema, body: updateInvoiceStatusSchema }),
  controller.updateInvoiceStatus
);