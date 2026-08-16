/**
 * Sequential document number generation (docs/Schema.md §37).
 *
 * Example: PO-2026-0001, PO-2026-0002
 * The database enforces uniqueness; the frontend must never generate these.
 */
export interface LatestDocumentNumber {
  number: string;
}

export async function generateSequentialNumber(
  prefix: string,
  findLatest: (prefix: string) => Promise<LatestDocumentNumber | null>
): Promise<string> {
  const latest = await findLatest(prefix);

  if (!latest) {
    return `${prefix}0001`;
  }

  const lastSequenceStr = latest.number.substring(prefix.length);
  const lastSequenceNum = parseInt(lastSequenceStr, 10);

  if (isNaN(lastSequenceNum)) {
    return `${prefix}0001`;
  }

  const nextSequenceNum = lastSequenceNum + 1;
  return `${prefix}${nextSequenceNum.toString().padStart(4, "0")}`;
}

export function buildYearPrefix(keyword: string): string {
  const currentYear = new Date().getFullYear();
  return `${keyword}-${currentYear}-`;
}