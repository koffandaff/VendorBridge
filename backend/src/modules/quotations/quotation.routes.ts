import { Router } from "express";
import { QuotationController } from "./quotation.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  quotationQuerySchema,
  quotationCompareQuerySchema,
  createQuotationSchema,
  updateQuotationSchema,
  uuidParamSchema,
} from "./quotation.schema.js";

export const quotationRouter: Router = Router();
const controller = new QuotationController();

quotationRouter.post(
  "/",
  authenticate,
  requirePermission("quotations:submit"),
  validateRequest({ body: createQuotationSchema }),
  controller.createQuotation
);

quotationRouter.get(
  "/compare",
  authenticate,
  requirePermission("quotations:compare"),
  validateRequest({ query: quotationCompareQuerySchema }),
  controller.compareQuotations
);

quotationRouter.get(
  "/",
  authenticate,
  requirePermission("quotations:view"),
  validateRequest({ query: quotationQuerySchema }),
  controller.listQuotations
);

quotationRouter.patch(
  "/:id",
  authenticate,
  requirePermission("quotations:editDraft"),
  validateRequest({ params: uuidParamSchema, body: updateQuotationSchema }),
  controller.updateQuotation
);

quotationRouter.get(
  "/:id",
  authenticate,
  requirePermission("quotations:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.getQuotationById
);

quotationRouter.patch(
  "/:id/select",
  authenticate,
  requirePermission("quotations:select"),
  validateRequest({ params: uuidParamSchema }),
  controller.selectQuotation
);

quotationRouter.patch(
  "/:id/reject",
  authenticate,
  requirePermission("quotations:select"),
  validateRequest({ params: uuidParamSchema }),
  controller.rejectQuotation
);