import { Prisma, type QuotationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
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
}