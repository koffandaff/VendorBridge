import type { Request, Response, NextFunction } from "express";
import { RfqService } from "./rfq.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../core/http/response.js";
import type {
  CreateRfqInput,
  UpdateRfqInput,
  UpdateRfqStatusInput,
  RfqQueryFilters,
} from "./rfq.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class RfqController {
  constructor(private readonly service: RfqService = new RfqService()) {}

  createRfq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rfq = await this.service.createRfq(
        req.body as CreateRfqInput,
        req.user!.id
      );
      sendCreated(res, rfq, "RFQ created successfully");
    } catch (error) {
      next(error);
    }
  };

  listRfqs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as RfqQueryFilters;
      const { items, pagination } = await this.service.listRfqs(filters, req.user!);
      sendPaginated(res, items, pagination, "RFQs retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getRfqById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rfq = await this.service.getRfqById(getParam(req, "id"));
      sendSuccess(res, rfq, "RFQ details retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateRfq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rfq = await this.service.updateRfq(
        getParam(req, "id"),
        req.body as UpdateRfqInput
      );
      sendSuccess(res, rfq, "RFQ updated successfully");
    } catch (error) {
      next(error);
    }
  };

  updateRfqStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rfq = await this.service.updateRfqStatus(
        getParam(req, "id"),
        req.body as UpdateRfqStatusInput
      );
      sendSuccess(res, rfq, "RFQ status updated successfully");
    } catch (error) {
      next(error);
    }
  };
}