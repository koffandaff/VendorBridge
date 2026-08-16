import { Prisma, type InvoiceStatus } from "@prisma/client";
import PDFDocument from "pdfkit";
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
import { notify, notifyRole } from "../../shared/helpers/notification.helper.js";
import { sendInvoiceEmail } from "../../shared/email.js";
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

type InvoiceWithRelations = NonNullable<Awaited<ReturnType<InvoiceRepository["findById"]>>>;

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
    await Promise.all([
      notifyRole("APPROVER", {
        type: "INVOICE_GENERATED",
        title: "Invoice generated",
        message: `Invoice ${invoice.invoiceNumber} for ${invoice.totalAmount} was generated and is awaiting payment.`,
        entityType: "Invoice",
        entityId: invoice.id,
      }),
      notify({
        userId: createdById,
        type: "INVOICE_GENERATED",
        title: "Invoice generated",
        message: `Invoice ${invoice.invoiceNumber} was generated successfully.`,
        entityType: "Invoice",
        entityId: invoice.id,
      }),
    ]);

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

  async updateInvoiceStatus(id: string, input: UpdateInvoiceStatusInput, actorId: string) {
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

    const updated = await this.repository.updateStatus(id, input.status, timestamps);
    await recordAudit({
      userId: actorId,
      action: "INVOICE_STATUS_UPDATED",
      entityType: "Invoice",
      entityId: id,
      oldValue: { status: invoice.status },
      newValue: { status: updated.status, invoiceNumber: invoice.invoiceNumber },
    });
    return updated;
  }

  async generateInvoicePdf(id: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await this.getInvoiceById(id);
    const buffer = await this.buildInvoicePdf(invoice);
    return { buffer, invoiceNumber: invoice.invoiceNumber };
  }

  async emailInvoice(id: string, userId: string) {
    const invoice = await this.getInvoiceById(id);

    if (invoice.status !== "ISSUED" && invoice.status !== "SENT") {
      throw new ConflictError(`Invoice with status '${invoice.status}' cannot be emailed`);
    }

    const pdfBuffer = await this.buildInvoicePdf(invoice);

    await sendInvoiceEmail(
      {
        to: invoice.vendor.email,
        vendorName: invoice.vendor.name,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: this.formatAmount(invoice.totalAmount),
        dueDate: invoice.dueDate,
        itemCount: invoice.items.length,
      },
      pdfBuffer
    );

    const updated = await this.repository.updateStatus(id, "SENT", { sentAt: new Date() });

    await recordAudit({
      userId,
      action: "INVOICE_EMAILED",
      entityType: "Invoice",
      entityId: id,
      newValue: { invoiceNumber: invoice.invoiceNumber, status: "SENT" },
    });

    return updated;
  }

  private formatAmount(value: Prisma.Decimal | string | number): string {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildInvoicePdf(invoice: InvoiceWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const amount = (value: Prisma.Decimal | string | number) => this.formatAmount(value);

      doc.fontSize(20).text("VendorBridge", 50, 50);
      doc.fontSize(24).text("INVOICE", 50, 70);
      doc.fontSize(9).fillColor("#555555");
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, 110);
      doc.text(`Invoice Date: ${this.formatDate(invoice.invoiceDate)}`, 50, 122);
      doc.text(`Due Date: ${this.formatDate(invoice.dueDate)}`, 50, 134);
      doc.text(`Status: ${invoice.status}`, 50, 146);
      doc.fillColor("#000000");

      doc.moveTo(50, 170).lineTo(50 + pageWidth, 170).lineWidth(1).strokeColor("#dddddd").stroke();

      doc.fontSize(10).text("Bill From", 50, 185);
      doc.fontSize(9);
      doc.text("VendorBridge", 50, 200);
      doc.text("Organization HQ", 50, 212);
      doc.text("GSTIN: 253834384FB", 50, 224);

      doc.fontSize(10).text("Bill To", 300, 185);
      doc.fontSize(9);
      doc.text(invoice.vendor.name, 300, 200);
      const vendorAddress = [
        invoice.vendor.address,
        [invoice.vendor.city, invoice.vendor.state, invoice.vendor.postalCode]
          .filter(Boolean)
          .join(", "),
        invoice.vendor.country,
      ]
        .filter(Boolean)
        .join("\n");
      if (vendorAddress) {
        doc.text(vendorAddress, 300, 212);
      }
      doc.text(`GSTIN: ${invoice.vendor.gstNumber ?? "—"}`, 300, 212 + (vendorAddress ? vendorAddress.split("\n").length * 12 : 0));

      const tableTop = 280;
      type ColumnKey =
        | "description"
        | "quantity"
        | "unit"
        | "unitPrice"
        | "taxRate"
        | "taxAmount"
        | "totalAmount";
      const columns: Array<{ key: ColumnKey; x: number; width: number; align: "left" | "right" }> = [
        { key: "description", x: 50, width: 180, align: "left" },
        { key: "quantity", x: 230, width: 40, align: "right" },
        { key: "unit", x: 270, width: 40, align: "left" },
        { key: "unitPrice", x: 310, width: 60, align: "right" },
        { key: "taxRate", x: 370, width: 45, align: "right" },
        { key: "taxAmount", x: 415, width: 60, align: "right" },
        { key: "totalAmount", x: 475, width: 70, align: "right" },
      ];

      doc.fontSize(9).fillColor("#ffffff");
      doc.rect(50, tableTop, pageWidth, 18).fill("#334155");
      doc.fillColor("#ffffff");
      const headers: Record<ColumnKey, string> = {
        description: "Description",
        quantity: "Qty",
        unit: "Unit",
        unitPrice: "Unit Price",
        taxRate: "Tax %",
        taxAmount: "Tax Amt",
        totalAmount: "Total",
      };
      for (const column of columns) {
        doc.text(headers[column.key], column.x, tableTop + 4, {
          width: column.width,
          align: column.align,
        });
      }
      doc.fillColor("#000000");

      let rowY = tableTop + 18;
      doc.fontSize(9);
      for (const item of invoice.items) {
        const rowValues: Record<ColumnKey, string> = {
          description: item.description,
          quantity: this.formatAmount(item.quantity),
          unit: item.unit,
          unitPrice: amount(item.unitPrice),
          taxRate: `${this.formatAmount(item.taxRate)}%`,
          taxAmount: amount(item.taxAmount),
          totalAmount: amount(item.totalAmount),
        };
        for (const column of columns) {
          doc.text(rowValues[column.key], column.x, rowY + 2, {
            width: column.width,
            align: column.align,
          });
        }
        doc
          .moveTo(50, rowY + 16)
          .lineTo(50 + pageWidth, rowY + 16)
          .lineWidth(0.5)
          .strokeColor("#eeeeee")
          .stroke();
        rowY += 18;
      }

      const totalsY = Math.max(rowY + 10, 480);
      const totals = [
        { label: "Subtotal", value: amount(invoice.subtotal), bold: false },
        { label: "Tax Amount", value: amount(invoice.taxAmount), bold: false },
        { label: "Total Amount", value: amount(invoice.totalAmount), bold: true },
      ];
      doc.fontSize(9);
      totals.forEach((total, index) => {
        const y = totalsY + index * 16;
        doc.font("Helvetica-Bold").text(total.label, 380, y, { width: 90, align: "right" });
        doc.font(total.bold ? "Helvetica-Bold" : "Helvetica").text(total.value, 470, y, {
          width: 75,
          align: "right",
        });
      });
      doc.font("Helvetica").fontSize(9);

      if (invoice.notes) {
        doc.text(`Notes: ${invoice.notes}`, 50, totalsY + 60, { width: pageWidth });
      }

      doc.end();
    });
  }
}