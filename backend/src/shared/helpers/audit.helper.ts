import { Prisma } from "@prisma/client";
import { logger } from "../../core/logger/logger.js";
import { prisma } from "../../lib/prisma.js";

export interface RecordAuditInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        oldValue: input.oldValue,
        newValue: input.newValue,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    logger.error("failed to record audit log", {
      action: input.action,
      entityType: input.entityType,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
