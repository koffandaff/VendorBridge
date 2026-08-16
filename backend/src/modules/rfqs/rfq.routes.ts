import { Router } from "express";
import { RfqController } from "./rfq.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  createRfqSchema,
  updateRfqSchema,
  updateRfqStatusSchema,
  rfqQuerySchema,
  uuidParamSchema,
} from "./rfq.schema.js";

export const rfqRouter: Router = Router();
const controller = new RfqController();

rfqRouter.post(
  "/",
  authenticate,
  requirePermission("rfqs:create"),
  validateRequest({ body: createRfqSchema }),
  controller.createRfq
);

rfqRouter.get(
  "/",
  authenticate,
  requirePermission("rfqs:create", "procurement:view"),
  validateRequest({ query: rfqQuerySchema }),
  controller.listRfqs
);

rfqRouter.get(
  "/:id",
  authenticate,
  requirePermission("rfqs:create", "rfqs:viewDetails", "procurement:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.getRfqById
);

rfqRouter.put(
  "/:id",
  authenticate,
  requirePermission("rfqs:edit"),
  validateRequest({ params: uuidParamSchema, body: updateRfqSchema }),
  controller.updateRfq
);

rfqRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("rfqs:edit"),
  validateRequest({ params: uuidParamSchema, body: updateRfqStatusSchema }),
  controller.updateRfqStatus
);