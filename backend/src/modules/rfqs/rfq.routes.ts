import { Router } from "express";
import { RfqController } from "./rfq.controller.js";
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

rfqRouter.post("/", validateRequest({ body: createRfqSchema }), controller.createRfq);

rfqRouter.get("/", validateRequest({ query: rfqQuerySchema }), controller.listRfqs);

rfqRouter.get("/:id", validateRequest({ params: uuidParamSchema }), controller.getRfqById);

rfqRouter.put("/:id", validateRequest({ params: uuidParamSchema, body: updateRfqSchema }), controller.updateRfq);

rfqRouter.patch(
  "/:id/status",
  validateRequest({ params: uuidParamSchema, body: updateRfqStatusSchema }),
  controller.updateRfqStatus
);