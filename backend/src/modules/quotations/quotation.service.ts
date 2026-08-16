import type { QuotationStatus } from "@prisma/client";
import { QuotationRepository } from "./quotation.repository.js";
import { ConflictError, NotFoundError } from "../../core/errors/AppError.js";
import type { PaginationMeta } from "../../core/http/response.js";
import type { QuotationQueryFilters } from "./quotation.types.js";

const SELECTABLE_STATUSES: QuotationStatus[] = ["SUBMITTED", "UNDER_REVIEW"];

export class QuotationService {
  constructor(private readonly repository: QuotationRepository = new QuotationRepository()) {}

  async getQuotationById(id: string) {
    const quotation = await this.repository.findById(id);
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }
    return quotation;
  }

  async listQuotations(filters: QuotationQueryFilters) {
    const { items, totalItems } = await this.repository.list(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
    };

    return { items, pagination };
  }

  async compareQuotations(rfqId: string) {
    return this.repository.compareByRfqId(rfqId);
  }

  async selectQuotation(id: string) {
    const quotation = await this.getQuotationById(id);

    if (!SELECTABLE_STATUSES.includes(quotation.status)) {
      throw new ConflictError(
        `Quotation with status '${quotation.status}' cannot be selected`
      );
    }

    return this.repository.updateStatus(id, "SELECTED");
  }

  async rejectQuotation(id: string) {
    const quotation = await this.getQuotationById(id);

    if (!SELECTABLE_STATUSES.includes(quotation.status)) {
      throw new ConflictError(
        `Quotation with status '${quotation.status}' cannot be rejected`
      );
    }

    return this.repository.updateStatus(id, "REJECTED");
  }
}