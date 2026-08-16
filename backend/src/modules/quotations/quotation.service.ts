import { Prisma, type QuotationStatus } from "@prisma/client";
import { QuotationRepository } from "./quotation.repository.js";
import {
  ConflictError,
  AuthorizationError,
  NotFoundError,
} from "../../core/errors/app-error.js";
import {
  buildYearPrefix,
  generateSequentialNumber,
} from "../../shared/helpers/number.helper.js";
import {
  calculateDocumentTotals,
  calculateLineTotals,
} from "../../shared/helpers/tax.helper.js";
import { recordAudit } from "../../shared/helpers/audit.helper.js";
import { notifyRole } from "../../shared/helpers/notification.helper.js";
import type { PaginationMeta } from "../../core/http/response.js";
import type {
  CreateQuotationInput,
  QuotationQueryFilters,
  UpdateQuotationInput,
} from "./quotation.types.js";

const SELECTABLE_STATUSES: QuotationStatus[] = ["SUBMITTED", "UNDER_REVIEW"];
const DEFAULT_VALID_UNTIL_DAYS = 30;

export class QuotationService {
  constructor(private readonly repository: QuotationRepository = new QuotationRepository()) {}

  async getQuotationById(id: string) {
    const quotation = await this.repository.findById(id);
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }
    return quotation;
  }

  async listQuotations(filters: QuotationQueryFilters, user: { id: string; role: string }) {
    if (user.role === "VENDOR") {
      const userRecord = await this.repository.findUserWithVendor(user.id);
      if (!userRecord?.vendorId) {
        return { items: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 } };
      }
      filters.vendorId = userRecord.vendorId;
    }

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

  async selectQuotation(id: string, userId: string) {
    const quotation = await this.getQuotationById(id);

    if (!SELECTABLE_STATUSES.includes(quotation.status)) {
      throw new ConflictError(
        `Quotation with status '${quotation.status}' cannot be selected`
      );
    }

    const selected = await this.repository.updateStatus(id, "SELECTED");

    await recordAudit({
      userId,
      action: "QUOTATION_SELECTED",
      entityType: "Quotation",
      entityId: id,
      newValue: { status: "SELECTED", totalAmount: selected.totalAmount },
    });

    return selected;
  }

  async rejectQuotation(id: string, userId: string) {
    const quotation = await this.getQuotationById(id);

    if (!SELECTABLE_STATUSES.includes(quotation.status)) {
      throw new ConflictError(
        `Quotation with status '${quotation.status}' cannot be rejected`
      );
    }

    const rejected = await this.repository.updateStatus(id, "REJECTED");

    await recordAudit({
      userId,
      action: "QUOTATION_REJECTED",
      entityType: "Quotation",
      entityId: id,
      newValue: { status: "REJECTED" },
    });

    return rejected;
  }

  /**
   * Creates a quotation (DRAFT when isDraft, otherwise SUBMITTED) for the
   * vendor linked to the authenticated user. A vendor may hold at most one
   * quotation per RFQ; an existing draft is updated instead of duplicated.
   */
  async createQuotation(input: CreateQuotationInput, userId: string) {
    const vendorId = await this.resolveVendorId(userId);
    const rfq = await this.resolveOpenRfq(input.rfqId);
    await this.assertInvited(rfq.id, vendorId);

    const existing = await this.repository.findQuotationByRfqAndVendor(rfq.id, vendorId);
    if (existing && existing.status !== "DRAFT") {
      throw new ConflictError("A quotation has already been submitted for this vendor on this RFQ");
    }

    const saved = await this.saveQuotation(
      existing ? existing.id : undefined,
      input,
      vendorId,
      rfq
    );

    const isDraft = input.isDraft ?? false;
    await recordAudit({
      userId,
      action: isDraft ? "QUOTATION_DRAFT_SAVED" : "QUOTATION_SUBMITTED",
      entityType: "Quotation",
      entityId: saved.id,
      newValue: {
        status: saved.status,
        quotationNumber: saved.quotationNumber,
        totalAmount: saved.totalAmount,
      },
    });
    if (!isDraft) {
      await notifyRole("ADMIN", {
        type: "QUOTATION_SUBMITTED",
        title: "Quotation submitted",
        message: `Quotation ${saved.quotationNumber} for ${saved.totalAmount} was submitted for review.`,
        entityType: "Quotation",
        entityId: saved.id,
      });
    }

    return saved;
  }

  /**
   * Edits a vendor's own DRAFT quotation. Passing isDraft=false submits it.
   */
  async updateQuotation(id: string, input: UpdateQuotationInput, userId: string) {
    const vendorId = await this.resolveVendorId(userId);

    const quotation = await this.repository.findOwnedDraftById(id, vendorId);
    if (!quotation) {
      throw new NotFoundError("Draft quotation not found for this vendor");
    }

    if (quotation.status !== "DRAFT") {
      throw new ConflictError("Only DRAFT quotations can be edited");
    }

    const rfq = await this.resolveOpenRfq(quotation.rfqId);

    const resolvedItems =
      input.items ??
      quotation.items.map((item) => ({
        rfqItemId: item.rfqItemId,
        unitPrice: Number(item.unitPrice),
        notes: item.notes,
      }));

    const saved = await this.saveQuotation(
      quotation.id,
      { ...input, rfqId: quotation.rfqId, items: resolvedItems },
      vendorId,
      rfq
    );

    const isDraft = input.isDraft ?? false;
    await recordAudit({
      userId,
      action: isDraft ? "QUOTATION_DRAFT_SAVED" : "QUOTATION_SUBMITTED",
      entityType: "Quotation",
      entityId: saved.id,
      newValue: {
        status: saved.status,
        quotationNumber: saved.quotationNumber,
        totalAmount: saved.totalAmount,
      },
    });

    return saved;
  }

  private async resolveVendorId(userId: string): Promise<string> {
    const user = await this.repository.findUserWithVendor(userId);
    if (!user?.vendorId) {
      throw new AuthorizationError("No vendor profile is linked to this account");
    }
    return user.vendorId;
  }

  private async resolveOpenRfq(rfqId: string) {
    const rfq = await this.repository.findRfqForSubmission(rfqId);
    if (!rfq) {
      throw new NotFoundError("RFQ not found");
    }
    if (rfq.status !== "OPEN") {
      throw new ConflictError(
        `Quotations can only be submitted for OPEN RFQs (current status: '${rfq.status}')`
      );
    }
    return rfq;
  }

  private async assertInvited(rfqId: string, vendorId: string): Promise<void> {
    const invitation = await this.repository.findInvitation(rfqId, vendorId);
    if (!invitation) {
      throw new AuthorizationError("This vendor is not invited to the RFQ");
    }
  }

  private async saveQuotation(
    id: string | undefined,
    input: CreateQuotationInput,
    vendorId: string,
    rfq: { id: string; items: { id: string; name: string; quantity: Prisma.Decimal }[] }
  ) {
    const rfqItemsById = new Map(rfq.items.map((item) => [item.id, item]));
    const taxPercentage = input.taxPercentage ?? 0;

    const lineResults = input.items.map((item) => {
      const rfqItem = rfqItemsById.get(item.rfqItemId);
      if (!rfqItem) {
        throw new NotFoundError(`RFQ item '${item.rfqItemId}' does not belong to this RFQ`);
      }
      const lineTotals = calculateLineTotals({
        quantity: rfqItem.quantity,
        unitPrice: item.unitPrice,
        taxRate: taxPercentage,
      });
      return { item, rfqItem, lineTotals };
    });

    const docTotals = calculateDocumentTotals(
      lineResults.map((result) => ({
        subtotal: result.lineTotals.subtotal,
        taxAmount: result.lineTotals.taxAmount,
      }))
    );

    const deliveryDays = lineResults.reduce(
      (max, result) => Math.max(max, result.item.deliveryDays ?? 0),
      0
    );

    const isDraft = input.isDraft ?? false;
    const status: "DRAFT" | "SUBMITTED" = isDraft ? "DRAFT" : "SUBMITTED";

    const data = {
      status,
      subtotal: docTotals.subtotal,
      taxAmount: docTotals.taxAmount,
      totalAmount: docTotals.totalAmount,
      deliveryDays,
      validUntil: input.validUntil ?? this.defaultValidUntil(),
      notes: input.notes ?? "",
      submittedAt: isDraft ? undefined : new Date(),
    };

    const items = lineResults.map(({ item, rfqItem, lineTotals }) => ({
      rfqItemId: item.rfqItemId,
      description: rfqItem.name,
      quantity: new Prisma.Decimal(rfqItem.quantity.toString()),
      unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
      taxRate: new Prisma.Decimal(taxPercentage.toString()),
      taxAmount: lineTotals.taxAmount,
      totalAmount: lineTotals.totalAmount,
      notes: item.notes ?? null,
    }));

    if (!id) {
      const quotationNumber = await generateSequentialNumber(
        buildYearPrefix("QT"),
        (prefix) => this.repository.findLatestQuotationNumber(prefix)
      );
      return this.repository.createWithItems(
        {
          quotationNumber,
          rfqId: input.rfqId,
          vendorId,
          ...data,
        },
        items
      );
    }

    return this.repository.updateQuotationWithItems(id, data, items);
  }

  private defaultValidUntil(): Date {
    const date = new Date();
    date.setDate(date.getDate() + DEFAULT_VALID_UNTIL_DAYS);
    return date;
  }
}