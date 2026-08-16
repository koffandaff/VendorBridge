import {
  InvoiceStatus,
  QuotationStatus,
  RFQStatus,
  VendorStatus,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  DashboardSummaryDto,
  DashboardTrendPoint,
  VendorPerformanceDto,
} from "./dashboard.types.js";

type StatusMap<T extends string> = Record<T, number>;

function buildStatusMap<T extends string>(statuses: readonly T[]): StatusMap<T> {
  return Object.fromEntries(statuses.map((status) => [status, 0])) as StatusMap<T>;
}

function mergeGroupCounts<T extends string>(
  map: StatusMap<T>,
  grouped: { status: T; _count: { _all: number } }[]
): StatusMap<T> {
  for (const row of grouped) {
    map[row.status] = row._count._all;
  }
  return map;
}

export class DashboardRepository {
  async getSummary(): Promise<DashboardSummaryDto> {
    const [groupedVendors, groupedRfqs, groupedQuotations, groupedInvoices] =
      await Promise.all([
        prisma.vendor.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.rFQ.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.quotation.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.invoice.groupBy({ by: ["status"], _count: { _all: true } }),
      ]);

    const [
      totalUsers,
      activeUsers,
      totalVendors,
      totalCategories,
      totalRfqs,
      totalQuotations,
      pendingApprovals,
      totalPos,
      totalInvoices,
      posAggregate,
      invoicesOutstanding,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.vendor.count(),
      prisma.vendorCategory.count(),
      prisma.rFQ.count(),
      prisma.quotation.count(),
      prisma.approval.count({ where: { status: "PENDING" } }),
      prisma.purchaseOrder.count(),
      prisma.invoice.count(),
      prisma.purchaseOrder.aggregate({
        where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ["SENT", "ISSUED", "OVERDUE"] } },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      vendors: {
        total: totalVendors,
        byStatus: mergeGroupCounts(
          buildStatusMap<VendorStatus>(Object.values(VendorStatus)),
          groupedVendors
        ),
      },
      categories: totalCategories,
      rfqs: {
        total: totalRfqs,
        byStatus: mergeGroupCounts(
          buildStatusMap<RFQStatus>(Object.values(RFQStatus)),
          groupedRfqs
        ),
      },
      quotations: {
        total: totalQuotations,
        byStatus: mergeGroupCounts(
          buildStatusMap<QuotationStatus>(Object.values(QuotationStatus)),
          groupedQuotations
        ),
      },
      pendingApprovals,
      purchaseOrders: {
        total: totalPos,
        totalSpend: (posAggregate._sum.totalAmount ?? 0).toString(),
      },
      invoices: {
        total: totalInvoices,
        byStatus: mergeGroupCounts(
          buildStatusMap<InvoiceStatus>(Object.values(InvoiceStatus)),
          groupedInvoices
        ),
        outstanding: (invoicesOutstanding._sum.totalAmount ?? 0).toString(),
      },
    };
  }

  async getTrends(months: number): Promise<DashboardTrendPoint[]> {
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const [rfqs, purchaseOrders, invoices] = await Promise.all([
      prisma.$queryRaw<{ month: Date; count: number }[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "RFQ"
        WHERE "createdAt" >= ${start}
        GROUP BY 1
        ORDER BY 1`,
      prisma.$queryRaw<{ month: Date; count: number }[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "PurchaseOrder"
        WHERE "createdAt" >= ${start}
        GROUP BY 1
        ORDER BY 1`,
      prisma.$queryRaw<{ month: Date; count: number }[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "Invoice"
        WHERE "createdAt" >= ${start}
        GROUP BY 1
        ORDER BY 1`,
    ]);

    const points: DashboardTrendPoint[] = [];
    const cursor = new Date(start);
    const now = new Date();

    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 7);
      points.push({
        month: key,
        rfqs: this.countForMonth(rfqs, key),
        purchaseOrders: this.countForMonth(purchaseOrders, key),
        invoices: this.countForMonth(invoices, key),
        spend: "0",
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return points;
  }

  async getVendorPerformance(): Promise<VendorPerformanceDto[]> {
    const groups = await prisma.purchaseOrder.groupBy({
      by: ["vendorId"],
      where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    if (groups.length === 0) {
      return [];
    }

    const vendors = await prisma.vendor.findMany({
      where: { id: { in: groups.map((group) => group.vendorId) } },
      select: { id: true, name: true, code: true, status: true, rating: true },
    });

    const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));

    return groups
      .map((group) => {
        const vendor = vendorById.get(group.vendorId);
        return {
          vendorId: group.vendorId,
          name: vendor?.name ?? "Unknown vendor",
          code: vendor?.code ?? "",
          status: vendor?.status ?? VendorStatus.INACTIVE,
          rating: vendor?.rating ? vendor.rating.toString() : null,
          orderCount: group._count._all,
          totalSpend: (group._sum.totalAmount ?? 0).toString(),
        };
      })
      .sort((a, b) => Number(b.totalSpend) - Number(a.totalSpend));
  }

  private countForMonth(rows: { month: Date; count: number }[], key: string): number {
    const row = rows.find((item) => item.month.toISOString().slice(0, 7) === key);
    return row?.count ?? 0;
  }
}