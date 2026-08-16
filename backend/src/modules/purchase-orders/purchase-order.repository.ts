import { Prisma, type PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import type { PurchaseOrderQueryFilters } from "./purchase-order.types.js";

export interface PurchaseOrderItemDraft {
  quotationItemId: string;
  description: string;
  quantity: Prisma.Decimal;
  unit: string;
  unitPrice: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

export interface CreatePurchaseOrderData {
  poNumber: string;
  quotationId: string;
  vendorId: string;
  createdById: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  subtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  notes?: string | null;
}

const purchaseOrderDetailInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
  },
  vendor: true,
  quotation: {
    include: {
      rfq: {
        select: { id: true, rfqNumber: true, title: true },
      },
    },
  },
  invoice: true,
};

export class PurchaseOrderRepository {
  async findQuotationForPo(quotationId: string) {
    return prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            rfqItem: {
              select: { unit: true },
            },
          },
        },
        vendor: true,
      },
    });
  }

  async findPoByQuotationId(quotationId: string) {
    return prisma.purchaseOrder.findUnique({
      where: { quotationId },
    });
  }

  async createWithItems(data: CreatePurchaseOrderData, items: PurchaseOrderItemDraft[]) {
    return prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          poNumber: data.poNumber,
          quotationId: data.quotationId,
          vendorId: data.vendorId,
          createdById: data.createdById,
          status: "APPROVED",
          orderDate: data.orderDate,
          expectedDeliveryDate: data.expectedDeliveryDate,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          notes: data.notes ?? null,
        },
      });

      await tx.purchaseOrderItem.createMany({
        data: items.map((item) => ({
          purchaseOrderId: purchaseOrder.id,
          quotationItemId: item.quotationItemId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
        })),
      });

      return tx.purchaseOrder.findUniqueOrThrow({
        where: { id: purchaseOrder.id },
        include: purchaseOrderDetailInclude,
      });
    });
  }

  async findById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: purchaseOrderDetailInclude,
    });
  }

  async list(filters: PurchaseOrderQueryFilters) {
    const {
      status,
      vendorId,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.PurchaseOrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.poNumber = { contains: search, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          vendor: {
            select: { id: true, name: true, code: true },
          },
          quotation: {
            select: { id: true, quotationNumber: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { items, totalItems };
  }

  async updateStatus(id: string, status: PurchaseOrderStatus) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: purchaseOrderDetailInclude,
    });
  }

  async findLatestPoNumber(prefix: string): Promise<{ number: string } | null> {
    const latest = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: prefix } },
      orderBy: { poNumber: "desc" },
      select: { poNumber: true },
    });
    return latest ? { number: latest.poNumber } : null;
  }
}