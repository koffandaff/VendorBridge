import { prisma } from "../../shared/prisma.js";
import type { QuotationStatus, RFQStatus } from "@prisma/client";

const ACTIVE_RFQ_STATUSES: RFQStatus[] = ["OPEN", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED"];
const PENDING_APPROVAL_STATUSES: QuotationStatus[] = ["SUBMITTED", "UNDER_REVIEW"];
const TREND_MONTHS = 6;

export class AnalyticsRepository {
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeRfqs, pendingApprovals, posThisMonth, overdueInvoices] = await Promise.all([
      prisma.rFQ.count({ where: { status: { in: ACTIVE_RFQ_STATUSES } } }),
      prisma.quotation.count({ where: { status: { in: PENDING_APPROVAL_STATUSES } } }),
      prisma.purchaseOrder.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.invoice.count({ where: { status: "OVERDUE", dueDate: { lt: now } } }),
    ]);

    return { activeRfqs, pendingApprovals, posThisMonth, overdueInvoices };
  }

  async getReportsOverview() {
    const now = new Date();
    const startOfWindow = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1), 1);

    const [purchaseOrders, vendors, recentPos] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { createdAt: { gte: startOfWindow } },
        select: {
          createdAt: true,
          totalAmount: true,
          vendor: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.vendor.findMany({
        select: { status: true },
      }),
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          poNumber: true,
          orderDate: true,
          totalAmount: true,
          status: true,
          vendor: { select: { name: true } },
        },
      }),
    ]);

    const spendingTrend = this.buildSpendingTrend(purchaseOrders, now, startOfWindow);

    const spendByCategory = this.aggregateSpend(purchaseOrders, (po) => {
      const name = po.vendor.category?.name;
      return name ? name : "Uncategorized";
    });

    const topVendors = this.aggregateSpend(purchaseOrders, (po) => po.vendor.name).slice(0, 5);

    const vendorStatusCounts = vendors.reduce<Record<string, number>>((acc, vendor) => {
      acc[vendor.status] = (acc[vendor.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      spendingTrend,
      spendByCategory,
      topVendors,
      vendorStatusCounts,
      recentPos: recentPos.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        vendor: po.vendor.name,
        amount: Number(po.totalAmount) || 0,
        status: po.status,
        orderDate: po.orderDate,
      })),
    };
  }

  private buildSpendingTrend(
    purchaseOrders: { createdAt: Date; totalAmount: unknown }[],
    now: Date,
    startOfWindow: Date
  ): { name: string; spend: number }[] {
    const months: { name: string; spend: number }[] = [];

    for (let i = TREND_MONTHS - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: date.toLocaleString("en-US", { month: "short" }),
        spend: 0,
      });
    }

    const windowMonthIndex = startOfWindow.getFullYear() * 12 + startOfWindow.getMonth();

    for (const po of purchaseOrders) {
      const monthIndex = po.createdAt.getFullYear() * 12 + po.createdAt.getMonth();
      const offset = monthIndex - windowMonthIndex;
      if (offset >= 0 && offset < months.length) {
        const month = months[offset];
        if (month) {
          month.spend += Number(po.totalAmount) || 0;
        }
      }
    }

    return months;
  }

  private aggregateSpend(
    purchaseOrders: { totalAmount: unknown; vendor: { name: string; category?: { name: string | null } | null } }[],
    keyOf: (po: { vendor: { name: string; category?: { name: string | null } | null } }) => string
  ): { name: string; spend: number }[] {
    const totals = new Map<string, number>();

    for (const po of purchaseOrders) {
      const key = keyOf(po);
      totals.set(key, (totals.get(key) ?? 0) + (Number(po.totalAmount) || 0));
    }

    return [...totals.entries()]
      .map(([name, spend]) => ({ name, spend }))
      .sort((a, b) => b.spend - a.spend);
  }
}