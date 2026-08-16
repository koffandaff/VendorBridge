import { Prisma, type RFQStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import type {
  CreateRfqItemInput,
  RfqQueryFilters,
  UpdateRfqInput,
} from "./rfq.types.js";

const rfqDetailInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
  },
  invitedVendors: {
    include: {
      vendor: {
        select: { id: true, name: true, code: true },
      },
    },
  },
};

export class RfqRepository {
  async createWithItems(
    data: {
      title: string;
      description: string;
      deadline: Date;
      createdById: string;
      rfqNumber: string;
    },
    items: CreateRfqItemInput[],
    invitedVendorIds: string[]
  ) {
    return prisma.$transaction(async (tx) => {
      const rfq = await tx.rFQ.create({
        data: {
          title: data.title,
          description: data.description,
          deadline: data.deadline,
          createdById: data.createdById,
          rfqNumber: data.rfqNumber,
          status: "DRAFT",
        },
      });

      if (items.length > 0) {
        await tx.rFQItem.createMany({
          data: items.map((item) => ({
            rfqId: rfq.id,
            name: item.name,
            description: item.description ?? null,
            itemType: item.itemType,
            quantity: new Prisma.Decimal(item.quantity),
            unit: item.unit,
            estimatedUnitPrice:
              item.estimatedUnitPrice !== undefined && item.estimatedUnitPrice !== null
                ? new Prisma.Decimal(item.estimatedUnitPrice)
                : null,
            notes: item.notes ?? null,
          })),
        });
      }

      if (invitedVendorIds.length > 0) {
        await tx.rFQVendor.createMany({
          data: invitedVendorIds.map((vendorId) => ({
            rfqId: rfq.id,
            vendorId,
          })),
        });
      }

      return tx.rFQ.findUniqueOrThrow({
        where: { id: rfq.id },
        include: rfqDetailInclude,
      });
    });
  }

  async findById(id: string) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: {
        ...rfqDetailInclude,
        quotations: {
          select: {
            id: true,
            quotationNumber: true,
            vendorId: true,
            status: true,
            totalAmount: true,
            submittedAt: true,
          },
          orderBy: { submittedAt: "asc" },
        },
      },
    });
  }

  async findVendorsByIds(ids: string[]): Promise<{ id: string }[]> {
    return prisma.vendor.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }

  async list(filters: RfqQueryFilters) {
    const {
      search,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.RFQWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { rfqNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { items: true, invitedVendors: true, quotations: true },
          },
        },
      }),
      prisma.rFQ.count({ where }),
    ]);

    return { items, totalItems };
  }

  async updateMetadata(id: string, data: UpdateRfqInput) {
    return prisma.rFQ.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline !== undefined && { deadline: data.deadline }),
      },
      include: rfqDetailInclude,
    });
  }

  async replaceItems(rfqId: string, items: CreateRfqItemInput[]) {
    return prisma.$transaction(async (tx) => {
      await tx.rFQItem.deleteMany({ where: { rfqId } });

      await tx.rFQItem.createMany({
        data: items.map((item) => ({
          rfqId,
          name: item.name,
          description: item.description ?? null,
          itemType: item.itemType,
          quantity: new Prisma.Decimal(item.quantity),
          unit: item.unit,
          estimatedUnitPrice:
            item.estimatedUnitPrice !== undefined && item.estimatedUnitPrice !== null
              ? new Prisma.Decimal(item.estimatedUnitPrice)
              : null,
          notes: item.notes ?? null,
        })),
      });

      return tx.rFQItem.findMany({
        where: { rfqId },
        orderBy: { createdAt: "asc" },
      });
    });
  }

  async replaceInvitedVendors(rfqId: string, vendorIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.rFQVendor.deleteMany({ where: { rfqId } });

      if (vendorIds.length > 0) {
        await tx.rFQVendor.createMany({
          data: vendorIds.map((vendorId) => ({ rfqId, vendorId })),
        });
      }

      return tx.rFQVendor.findMany({
        where: { rfqId },
        include: { vendor: { select: { id: true, name: true, code: true } } },
      });
    });
  }

  async updateStatus(id: string, status: RFQStatus) {
    return prisma.rFQ.update({
      where: { id },
      data: { status },
      include: rfqDetailInclude,
    });
  }

  async findLatestRfqNumber(prefix: string): Promise<{ number: string } | null> {
    const latest = await prisma.rFQ.findFirst({
      where: { rfqNumber: { startsWith: prefix } },
      orderBy: { rfqNumber: "desc" },
      select: { rfqNumber: true },
    });
    return latest ? { number: latest.rfqNumber } : null;
  }
}