import { Prisma, type QuotationStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import type { QuotationQueryFilters } from "./quotation.types.js";

const quotationListInclude = {
  vendor: {
    select: { id: true, name: true, code: true, rating: true },
  },
  rfq: {
    select: { id: true, rfqNumber: true, title: true },
  },
  items: {
    orderBy: { createdAt: "asc" as const },
  },
};

export interface QuotationItemDraft {
  rfqItemId: string;
  description: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  notes?: string | null;
}

export interface CreateQuotationData {
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  status: "DRAFT" | "SUBMITTED";
  subtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  deliveryDays: number;
  validUntil: Date;
  notes: string;
}

export interface UpdateQuotationData {
  status: "DRAFT" | "SUBMITTED";
  subtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  deliveryDays: number;
  validUntil: Date;
  notes: string;
  submittedAt?: Date;
}

export class QuotationRepository {
  async list(filters: QuotationQueryFilters) {
    const {
      rfqId,
      vendorId,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.QuotationWhereInput = {};

    if (rfqId) {
      where.rfqId = rfqId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: quotationListInclude,
      }),
      prisma.quotation.count({ where }),
    ]);

    return { items, totalItems };
  }

  async compareByRfqId(rfqId: string) {
    return prisma.quotation.findMany({
      where: {
        rfqId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "SELECTED"] },
      },
      orderBy: [{ totalAmount: "asc" }, { deliveryDays: "asc" }],
      include: quotationListInclude,
    });
  }

  async findById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        vendor: true,
        rfq: {
          include: { items: true },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async updateStatus(id: string, status: QuotationStatus) {
    return prisma.quotation.update({
      where: { id },
      data: { status },
      include: quotationListInclude,
    });
  }

  async findUserWithVendor(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, vendorId: true },
    });
  }

  async findRfqForSubmission(rfqId: string) {
    return prisma.rFQ.findUnique({
      where: { id: rfqId },
      select: {
        id: true,
        status: true,
        deadline: true,
        items: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  async findInvitation(rfqId: string, vendorId: string) {
    return prisma.rFQVendor.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId } },
      select: { id: true, status: true },
    });
  }

  async findQuotationByRfqAndVendor(rfqId: string, vendorId: string) {
    return prisma.quotation.findFirst({
      where: { rfqId, vendorId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  async findOwnedDraftById(id: string, vendorId: string) {
    return prisma.quotation.findFirst({
      where: { id, vendorId },
      include: { items: true },
    });
  }

  async createWithItems(data: CreateQuotationData, items: QuotationItemDraft[]) {
    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          quotationNumber: data.quotationNumber,
          rfqId: data.rfqId,
          vendorId: data.vendorId,
          status: data.status,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          deliveryDays: data.deliveryDays,
          validUntil: data.validUntil,
          notes: data.notes,
          submittedAt: data.status === "SUBMITTED" ? new Date() : null,
        },
      });

      await tx.quotationItem.createMany({
        data: items.map((item) => ({
          quotationId: quotation.id,
          rfqItemId: item.rfqItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
          notes: item.notes ?? null,
        })),
      });

      return tx.quotation.findUniqueOrThrow({
        where: { id: quotation.id },
        include: quotationListInclude,
      });
    });
  }

  async updateQuotationWithItems(id: string, data: UpdateQuotationData, items: QuotationItemDraft[]) {
    return prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });

      await tx.quotation.update({
        where: { id },
        data: {
          status: data.status,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          deliveryDays: data.deliveryDays,
          validUntil: data.validUntil,
          notes: data.notes,
          ...(data.submittedAt !== undefined && { submittedAt: data.submittedAt }),
        },
      });

      await tx.quotationItem.createMany({
        data: items.map((item) => ({
          quotationId: id,
          rfqItemId: item.rfqItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
          notes: item.notes ?? null,
        })),
      });

      return tx.quotation.findUniqueOrThrow({
        where: { id },
        include: quotationListInclude,
      });
    });
  }

  async findLatestQuotationNumber(prefix: string): Promise<{ number: string } | null> {
    const latest = await prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: prefix } },
      orderBy: { quotationNumber: "desc" },
      select: { quotationNumber: true },
    });
    return latest ? { number: latest.quotationNumber } : null;
  }
}