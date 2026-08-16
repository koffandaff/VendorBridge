import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

export interface AuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
}

/**
 * Append-only audit logging (docs/Schema.md §41).
 * Failures must never break the primary flow, so errors are swallowed.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        oldValue: input.oldValue as Prisma.InputJsonValue | undefined,
        newValue: input.newValue as Prisma.InputJsonValue | undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Audit logging must never break the primary flow.
  }
}