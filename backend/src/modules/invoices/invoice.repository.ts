import { Prisma, type InvoiceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { InvoiceQueryFilters } from "./invoice.types.js";

export interface InvoiceItemDraft {
  purchaseOrderItemId: string;
  description: string;
  quantity: Prisma.Decimal;
  unit: string;
  unitPrice: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  notes?: string | null;
}

const invoiceDetailInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
  },
  vendor: true,
  purchaseOrder: {
    include: {
      quotation: {
        select: { id: true, quotationNumber: true },
      },
    },
  },
};

export class InvoiceRepository {
  async findPoForInvoice(purchaseOrderId: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        vendor: true,
      },
    });
  }

  async findInvoiceByPoId(purchaseOrderId: string) {
    return prisma.invoice.findUnique({
      where: { purchaseOrderId },
    });
  }

  async createWithItems(data: CreateInvoiceData, items: InvoiceItemDraft[]) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          purchaseOrderId: data.purchaseOrderId,
          vendorId: data.vendorId,
          status: "ISSUED",
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          notes: data.notes ?? null,
        },
      });

      await tx.invoiceItem.createMany({
        data: items.map((item) => ({
          invoiceId: invoice.id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
        })),
      });

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: invoiceDetailInclude,
      });
    });
  }

  async findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: invoiceDetailInclude,
    });
  }

  async list(filters: InvoiceQueryFilters) {
    const {
      status,
      vendorId,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.InvoiceWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.invoiceNumber = { contains: search, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          vendor: {
            select: { id: true, name: true, code: true },
          },
          purchaseOrder: {
            select: { id: true, poNumber: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { items, totalItems };
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus,
    timestamps?: { sentAt?: Date; paidAt?: Date }
  ) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(timestamps?.sentAt !== undefined && { sentAt: timestamps.sentAt }),
        ...(timestamps?.paidAt !== undefined && { paidAt: timestamps.paidAt }),
      },
      include: invoiceDetailInclude,
    });
  }

  async findLatestInvoiceNumber(prefix: string): Promise<{ number: string } | null> {
    const latest = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    return latest ? { number: latest.invoiceNumber } : null;
  }
}