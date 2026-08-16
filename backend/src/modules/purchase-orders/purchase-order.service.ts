import { Prisma, type PurchaseOrderStatus } from "@prisma/client";
import { PurchaseOrderRepository } from "./purchase-order.repository.js";
import {
  ConflictError,
  NotFoundError,
} from "../../core/errors/app-error.js";
import {
  buildYearPrefix,
  generateSequentialNumber,
} from "../../shared/helpers/number.helper.js";
import { recordAudit } from "../../shared/helpers/audit.helper.js";
import { calculateDocumentTotals, calculateLineTotals } from "../../shared/helpers/tax.helper.js";
import type { PaginationMeta } from "../../core/http/response.js";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderQueryFilters,
  UpdatePurchaseOrderStatusInput,
} from "./purchase-order.types.js";

const PO_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "APPROVED", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "CANCELLED"],
  APPROVED: ["SENT", "CANCELLED"],
  SENT: ["ACKNOWLEDGED", "CANCELLED"],
  ACKNOWLEDGED: ["PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export class PurchaseOrderService {
  constructor(
    private readonly repository: PurchaseOrderRepository = new PurchaseOrderRepository()
  ) {}

  /**
   * Generates a purchase order from a SELECTED quotation (docs/Schema.md §29).
   * Copies quotation items, recalculates all amounts server-side, and creates
   * the PO in APPROVED status within a single transaction.
   */
  async createPurchaseOrder(input: CreatePurchaseOrderInput, createdById: string) {
    const quotation = await this.repository.findQuotationForPo(input.quotationId);
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status !== "SELECTED") {
      throw new ConflictError(
        `Only a SELECTED quotation can generate a purchase order (current: '${quotation.status}')`
      );
    }

    const existing = await this.repository.findPoByQuotationId(input.quotationId);
    if (existing) {
      throw new ConflictError("A purchase order already exists for this quotation");
    }

    const poNumber = await generateSequentialNumber(
      buildYearPrefix("PO"),
      (prefix) => this.repository.findLatestPoNumber(prefix)
    );

    const lineResults = quotation.items.map((item) => ({
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

    const purchaseOrder = await this.repository.createWithItems(
      {
        poNumber,
        quotationId: quotation.id,
        vendorId: quotation.vendorId,
        createdById,
        orderDate: input.orderDate ?? new Date(),
        expectedDeliveryDate: input.expectedDeliveryDate,
        subtotal: docTotals.subtotal,
        taxAmount: docTotals.taxAmount,
        totalAmount: docTotals.totalAmount,
        notes: input.notes ?? null,
      },
      lineResults.map(({ lineTotals, item }) => ({
        quotationItemId: item.id,
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity.toString()),
        unit: item.rfqItem.unit,
        unitPrice: new Prisma.Decimal(item.unitPrice.toString()),
        taxRate: new Prisma.Decimal(item.taxRate.toString()),
        taxAmount: lineTotals.taxAmount,
        totalAmount: lineTotals.totalAmount,
      }))
    );

    await recordAudit({
      userId: createdById,
      action: "PO_CREATED",
      entityType: "PurchaseOrder",
      entityId: purchaseOrder.id,
      newValue: { poNumber: purchaseOrder.poNumber, totalAmount: purchaseOrder.totalAmount },
    });

    return purchaseOrder;
  }

  async getPurchaseOrderById(id: string) {
    const purchaseOrder = await this.repository.findById(id);
    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order not found");
    }
    return purchaseOrder;
  }

  async listPurchaseOrders(filters: PurchaseOrderQueryFilters) {
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

  async updatePurchaseOrderStatus(id: string, input: UpdatePurchaseOrderStatusInput) {
    const purchaseOrder = await this.getPurchaseOrderById(id);

    const allowed = PO_TRANSITIONS[purchaseOrder.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new ConflictError(
        `Cannot transition purchase order from '${purchaseOrder.status}' to '${input.status}'`
      );
    }

    return this.repository.updateStatus(id, input.status);
  }

  async acknowledgePurchaseOrder(id: string, userId: string) {
    const purchaseOrder = await this.getPurchaseOrderById(id);

    if (purchaseOrder.status !== "SENT") {
      throw new ConflictError(
        `Purchase order with status '${purchaseOrder.status}' cannot be acknowledged`
      );
    }

    const acknowledged = await this.repository.updateStatus(id, "ACKNOWLEDGED");

    await recordAudit({
      userId,
      action: "PO_ACKNOWLEDGED",
      entityType: "PurchaseOrder",
      entityId: id,
      newValue: { poNumber: purchaseOrder.poNumber, status: "ACKNOWLEDGED" },
    });

    return acknowledged;
  }
}