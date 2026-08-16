import { Prisma } from "@prisma/client";

export interface ItemCalculationInput {
  quantity: number | Prisma.Decimal;
  unitPrice: number | Prisma.Decimal;
  taxRate?: number | Prisma.Decimal | null; // GST Rate in % (e.g. 18 for 18%)
}

export interface LineItemTotals {
  subtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  cgstAmount?: Prisma.Decimal;
  sgstAmount?: Prisma.Decimal;
  igstAmount?: Prisma.Decimal;
}

export interface DocumentTotals {
  subtotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

/**
 * Calculates item subtotal, auto-calculates GST tax amount based on taxRate %, and total amount.
 * Source of Truth per docs/Schema.md §36 (Calculation Rules).
 */
export function calculateLineTotals(input: ItemCalculationInput): LineItemTotals {
  const qty = new Prisma.Decimal(input.quantity.toString());
  const price = new Prisma.Decimal(input.unitPrice.toString());
  const rate = input.taxRate !== undefined && input.taxRate !== null
    ? new Prisma.Decimal(input.taxRate.toString())
    : new Prisma.Decimal(0);

  // lineSubtotal = quantity * unitPrice
  const subtotal = qty.mul(price);

  // taxAmount = lineSubtotal * taxRate / 100
  const taxAmount = subtotal.mul(rate).div(100);

  // totalAmount = lineSubtotal + taxAmount
  const totalAmount = subtotal.add(taxAmount);

  return {
    subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
    taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
    totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
  };
}

/**
 * Auto-calculates document-level subtotal, total GST tax amount, and final total amount.
 */
export function calculateDocumentTotals(
  items: { subtotal: number | Prisma.Decimal; taxAmount: number | Prisma.Decimal }[]
): DocumentTotals {
  let docSubtotal = new Prisma.Decimal(0);
  let docTax = new Prisma.Decimal(0);

  for (const item of items) {
    const itemSub = new Prisma.Decimal(item.subtotal.toString());
    const itemTax = new Prisma.Decimal(item.taxAmount.toString());

    docSubtotal = docSubtotal.add(itemSub);
    docTax = docTax.add(itemTax);
  }

  const docTotal = docSubtotal.add(docTax);

  return {
    subtotal: new Prisma.Decimal(docSubtotal.toFixed(2)),
    taxAmount: new Prisma.Decimal(docTax.toFixed(2)),
    totalAmount: new Prisma.Decimal(docTotal.toFixed(2)),
  };
}

/**
 * Extracts state code from a 15-digit GSTIN number (e.g., '27AAAAA0000A1Z5' -> '27').
 */
export function getStateCodeFromGst(gstNumber: string | null | undefined): string | null {
  if (!gstNumber || gstNumber.length !== 15) {
    return null;
  }
  const stateCode = gstNumber.substring(0, 2);
  return /^\d{2}$/.test(stateCode) ? stateCode : null;
}
