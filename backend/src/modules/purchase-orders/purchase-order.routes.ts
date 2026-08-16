import { Router } from "express";
import { PurchaseOrderController } from "./purchase-order.controller.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  purchaseOrderQuerySchema,
  uuidParamSchema,
} from "./purchase-order.schema.js";

export const purchaseOrderRouter: Router = Router();
const controller = new PurchaseOrderController();

purchaseOrderRouter.post(
  "/",
  validateRequest({ body: createPurchaseOrderSchema }),
  controller.createPurchaseOrder
);

purchaseOrderRouter.get(
  "/",
  validateRequest({ query: purchaseOrderQuerySchema }),
  controller.listPurchaseOrders
);

purchaseOrderRouter.get(
  "/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.getPurchaseOrderById
);

purchaseOrderRouter.patch(
  "/:id/status",
  validateRequest({ params: uuidParamSchema, body: updatePurchaseOrderStatusSchema }),
  controller.updatePurchaseOrderStatus
);