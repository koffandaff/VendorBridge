import type { Request, Response, NextFunction } from "express";
import { QuotationService } from "./quotation.service.js";
import { sendSuccess, sendPaginated } from "../../core/http/response.js";
import type {
  CreateQuotationInput,
  QuotationQueryFilters,
  UpdateQuotationInput,
} from "./quotation.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class QuotationController {
  constructor(private readonly service: QuotationService = new QuotationService()) {}

  createQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isDraft = (req.body as CreateQuotationInput).isDraft ?? false;
      const quotation = await this.service.createQuotation(
        req.body as CreateQuotationInput,
        req.user!.id
      );
      sendSuccess(
        res,
        quotation,
        isDraft ? "Draft quotation saved successfully" : "Quotation submitted successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  updateQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isDraft = (req.body as UpdateQuotationInput).isDraft ?? false;
      const quotation = await this.service.updateQuotation(
        getParam(req, "id"),
        req.body as UpdateQuotationInput,
        req.user!.id
      );
      sendSuccess(
        res,
        quotation,
        isDraft ? "Draft quotation saved successfully" : "Quotation submitted successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  listQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as QuotationQueryFilters;
      const { items, pagination } = await this.service.listQuotations(filters, req.user!);
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
      const quotation = await this.service.selectQuotation(getParam(req, "id"), req.user!.id);
      sendSuccess(res, quotation, "Quotation selected successfully");
    } catch (error) {
      next(error);
    }
  };

  rejectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quotation = await this.service.rejectQuotation(getParam(req, "id"), req.user!.id);
      sendSuccess(res, quotation, "Quotation rejected successfully");
    } catch (error) {
      next(error);
    }
  };
}