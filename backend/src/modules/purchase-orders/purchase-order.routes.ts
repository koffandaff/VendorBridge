import { Router } from "express";
import { PurchaseOrderController } from "./purchase-order.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
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
  authenticate,
  requirePermission("purchaseOrders:generate"),
  validateRequest({ body: createPurchaseOrderSchema }),
  controller.createPurchaseOrder
);

purchaseOrderRouter.get(
  "/",
  authenticate,
  requirePermission("purchaseOrders:generate", "purchaseOrders:view"),
  validateRequest({ query: purchaseOrderQuerySchema }),
  controller.listPurchaseOrders
);

purchaseOrderRouter.get(
  "/:id",
  authenticate,
  requirePermission("purchaseOrders:generate", "purchaseOrders:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.getPurchaseOrderById
);

purchaseOrderRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("purchaseOrders:generate"),
  validateRequest({ params: uuidParamSchema, body: updatePurchaseOrderStatusSchema }),
  controller.updatePurchaseOrderStatus
);

purchaseOrderRouter.post(
  "/:id/acknowledge",
  authenticate,
  requirePermission("purchaseOrders:acknowledge"),
  validateRequest({ params: uuidParamSchema }),
  controller.acknowledgePurchaseOrder
);