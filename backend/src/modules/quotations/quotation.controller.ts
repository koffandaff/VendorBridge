import type { Request, Response, NextFunction } from "express";
import { QuotationService } from "./quotation.service.js";
import { sendSuccess, sendPaginated } from "../../core/http/response.js";
import type { QuotationQueryFilters } from "./quotation.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class QuotationController {
  constructor(private readonly service: QuotationService = new QuotationService()) {}

  listQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as QuotationQueryFilters;
      const { items, pagination } = await this.service.listQuotations(filters);
      sendPaginated(res, items, pagination, "Quotations retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  compareQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rfqId } = req.query as { rfqId: string };
      const quotations = await this.service.compareQuotations(rfqId);
      sendSuccess(res, quotations, "Quotations compared successfully");
    } catch (error) {
      next(error);
    }
  };

  getQuotationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quotation = await this.service.getQuotationById(getParam(req, "id"));
      sendSuccess(res, quotation, "Quotation details retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  selectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quotation = await this.service.selectQuotation(getParam(req, "id"));
      sendSuccess(res, quotation, "Quotation selected successfully");
    } catch (error) {
      next(error);
    }
  };

  rejectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quotation = await this.service.rejectQuotation(getParam(req, "id"));
      sendSuccess(res, quotation, "Quotation rejected successfully");
    } catch (error) {
      next(error);
    }
  };
}