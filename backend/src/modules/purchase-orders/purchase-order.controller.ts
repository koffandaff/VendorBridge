import type { Request, Response, NextFunction } from "express";
import { PurchaseOrderService } from "./purchase-order.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../core/http/response.js";
import type {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderStatusInput,
  PurchaseOrderQueryFilters,
} from "./purchase-order.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService = new PurchaseOrderService()) {}

  createPurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const purchaseOrder = await this.service.createPurchaseOrder(
        req.body as CreatePurchaseOrderInput
      );
      sendCreated(res, purchaseOrder, "Purchase order generated successfully");
    } catch (error) {
      next(error);
    }
  };

  listPurchaseOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as PurchaseOrderQueryFilters;
      const { items, pagination } = await this.service.listPurchaseOrders(filters);
      sendPaginated(res, items, pagination, "Purchase orders retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getPurchaseOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const purchaseOrder = await this.service.getPurchaseOrderById(getParam(req, "id"));
      sendSuccess(res, purchaseOrder, "Purchase order details retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updatePurchaseOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const purchaseOrder = await this.service.updatePurchaseOrderStatus(
        getParam(req, "id"),
        req.body as UpdatePurchaseOrderStatusInput
      );
      sendSuccess(res, purchaseOrder, "Purchase order status updated successfully");
    } catch (error) {
      next(error);
    }
  };
}