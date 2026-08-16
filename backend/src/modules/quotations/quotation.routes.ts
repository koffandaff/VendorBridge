import { Router } from "express";
import { QuotationController } from "./quotation.controller.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  quotationQuerySchema,
  quotationCompareQuerySchema,
  uuidParamSchema,
} from "./quotation.schema.js";

export const quotationRouter: Router = Router();
const controller = new QuotationController();

quotationRouter.get(
  "/compare",
  validateRequest({ query: quotationCompareQuerySchema }),
  controller.compareQuotations
);

quotationRouter.get(
  "/",
  validateRequest({ query: quotationQuerySchema }),
  controller.listQuotations
);

quotationRouter.get(
  "/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.getQuotationById
);

quotationRouter.patch(
  "/:id/select",
  validateRequest({ params: uuidParamSchema }),
  controller.selectQuotation
);

quotationRouter.patch(
  "/:id/reject",
  validateRequest({ params: uuidParamSchema }),
  controller.rejectQuotation
);