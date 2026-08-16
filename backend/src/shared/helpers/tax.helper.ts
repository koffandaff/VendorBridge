import { Prisma } from "@prisma/client";

export type DecimalValue = number | string | Prisma.Decimal;

export interface ItemCalculationInput {
  quantity: DecimalValue;
  unitPrice: DecimalValue;
  taxRate?: DecimalValue | null; // GST Rate in % (e.g. 18 for 18%)
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

function toDecimal(val: DecimalValue | null | undefined): Prisma.Decimal {
  if (val === null || val === undefined) {
    return new Prisma.Decimal(0);
  }
  if (val instanceof Prisma.Decimal) {
    return val;
  }
  return new Prisma.Decimal(val.toString());
}

/**
 * Calculates item subtotal, auto-calculates GST tax amount based on taxRate %, and total amount.
 * Source of Truth per docs/Schema.md §36 (Calculation Rules).
 */
export function calculateLineTotals(input: ItemCalculationInput): LineItemTotals {
  const qty = toDecimal(input.quantity);
  const price = toDecimal(input.unitPrice);
  const rate = toDecimal(input.taxRate);

  // lineSubtotal = quantity * unitPrice
  const subtotal = qty.mul(price);

  // taxAmount = lineSubtotal * taxRate / 100
  const taxAmount = subtotal.mul(rate).div(100);

  // totalAmount = lineSubtotal + taxAmount
  const totalAmount = subtotal.add(taxAmount);

  return {
    subtotal: subtotal.toDecimalPlaces(2),
    taxAmount: taxAmount.toDecimalPlaces(2),
    totalAmount: totalAmount.toDecimalPlaces(2),
  };
}

/**
 * Auto-calculates document-level subtotal, total GST tax amount, and final total amount.
 */
export function calculateDocumentTotals(
  items: { subtotal: DecimalValue; taxAmount: DecimalValue }[]
): DocumentTotals {
  let docSubtotal = new Prisma.Decimal(0);
  let docTax = new Prisma.Decimal(0);

  for (const item of items) {
    const itemSub = toDecimal(item.subtotal);
    const itemTax = toDecimal(item.taxAmount);

    docSubtotal = docSubtotal.add(itemSub);
    docTax = docTax.add(itemTax);
  }

  const docTotal = docSubtotal.add(docTax);

  return {
    subtotal: docSubtotal.toDecimalPlaces(2),
    taxAmount: docTax.toDecimalPlaces(2),
    totalAmount: docTotal.toDecimalPlaces(2),
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
