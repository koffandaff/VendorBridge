import type { Request, Response, NextFunction } from "express";
import { InvoiceService } from "./invoice.service.js";
import { sendSuccess, sendCreated, sendPaginated, ok } from "../../core/http/response.js";
import type {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
  InvoiceQueryFilters,
} from "./invoice.types.js";

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class InvoiceController {
  constructor(private readonly service: InvoiceService = new InvoiceService()) {}

  createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.service.createInvoice(
        req.body as CreateInvoiceInput,
        req.user!.id
      );
      sendCreated(res, invoice, "Invoice generated successfully");
    } catch (error) {
      next(error);
    }
  };

  listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as InvoiceQueryFilters;
      const { items, pagination } = await this.service.listInvoices(filters);
      sendPaginated(res, items, pagination, "Invoices retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.service.getInvoiceById(getParam(req, "id"));
      sendSuccess(res, invoice, "Invoice details retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.service.updateInvoiceStatus(
        getParam(req, "id"),
        req.body as UpdateInvoiceStatusInput
      );
      sendSuccess(res, invoice, "Invoice status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  downloadInvoicePdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { buffer, invoiceNumber } = await this.service.generateInvoicePdf(getParam(req, "id"));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${invoiceNumber}.pdf"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  emailInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.service.emailInvoice(getParam(req, "id"), req.user!.id);
      ok(res, invoice, 200);
    } catch (error) {
      next(error);
    }
  };
}