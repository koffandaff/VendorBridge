import { Prisma, type InvoiceStatus } from "@prisma/client";
import { InvoiceRepository } from "./invoice.repository.js";
import {
  ConflictError,
  NotFoundError,
} from "../../core/errors/app-error.js";
import {
  buildYearPrefix,
  generateSequentialNumber,
} from "../../shared/helpers/number.helper.js";
import { calculateDocumentTotals, calculateLineTotals } from "../../shared/helpers/tax.helper.js";
import { recordAudit } from "../../shared/helpers/audit.helper.js";
import type { PaginationMeta } from "../../core/http/response.js";
import type {
  CreateInvoiceInput,
  InvoiceQueryFilters,
  UpdateInvoiceStatusInput,
} from "./invoice.types.js";

const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["SENT", "CANCELLED"],
  SENT: ["PAID", "CANCELLED"],
  PAID: [],
  OVERDUE: ["CANCELLED"],
  CANCELLED: [],
};

export class InvoiceService {
  constructor(private readonly repository: InvoiceRepository = new InvoiceRepository()) {}

  /**
   * Generates an invoice from a purchase order (docs/Schema.md §30).
   * Copies PO items, recalculates all amounts server-side, and creates the
   * invoice in ISSUED status within a single transaction.
   */
  async createInvoice(input: CreateInvoiceInput, createdById: string) {
    const purchaseOrder = await this.repository.findPoForInvoice(input.purchaseOrderId);
    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order not found");
    }

    if (purchaseOrder.status === "CANCELLED") {
      throw new ConflictError("Cannot generate an invoice for a cancelled purchase order");
    }

    const existing = await this.repository.findInvoiceByPoId(input.purchaseOrderId);
    if (existing) {
      throw new ConflictError("An invoice already exists for this purchase order");
    }

    const invoiceNumber = await generateSequentialNumber(
      buildYearPrefix("INV"),
      (prefix) => this.repository.findLatestInvoiceNumber(prefix)
    );

    const lineResults = purchaseOrder.items.map((item) => ({
      lineTotals: calculateLineTotals({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      }),
      item,
    }));

    const docTotals = calculateDocumentTotals(
      lineResults.map((result) => ({
        subtotal: result.lineTotals.subtotal,
        taxAmount: result.lineTotals.taxAmount,
      }))
    );

    const invoice = await this.repository.createWithItems(
      {
        invoiceNumber,
        purchaseOrderId: purchaseOrder.id,
        vendorId: purchaseOrder.vendorId,
        invoiceDate: input.invoiceDate ?? new Date(),
        dueDate: input.dueDate,
        subtotal: docTotals.subtotal,
        taxAmount: docTotals.taxAmount,
        totalAmount: docTotals.totalAmount,
        notes: input.notes ?? null,
      },
      lineResults.map(({ lineTotals, item }) => ({
        purchaseOrderItemId: item.id,
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity.toString()),
        unit: item.unit,
        unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
        taxRate: new Prisma.Decimal(item.taxRate.toString()),
        taxAmount: lineTotals.taxAmount,
        totalAmount: lineTotals.totalAmount,
      }))
    );

    await recordAudit({
      userId: createdById,
      action: "INVOICE_GENERATED",
      entityType: "Invoice",
      entityId: invoice.id,
      newValue: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
    });

    return invoice;
  }

  async getInvoiceById(id: string) {
    const invoice = await this.repository.findById(id);
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }
    return invoice;
  }

  async listInvoices(filters: InvoiceQueryFilters) {
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

  async updateInvoiceStatus(id: string, input: UpdateInvoiceStatusInput) {
    const invoice = await this.getInvoiceById(id);

    const allowed = INVOICE_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new ConflictError(
        `Cannot transition invoice from '${invoice.status}' to '${input.status}'`
      );
    }

    const timestamps =
      input.status === "SENT"
        ? { sentAt: new Date() }
        : input.status === "PAID"
          ? { paidAt: new Date() }
          : undefined;

    return this.repository.updateStatus(id, input.status, timestamps);
  }
}