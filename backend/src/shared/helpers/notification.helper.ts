import type { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
}

export function notify(input: NotifyInput): Promise<void> {
  return prisma.notification
    .create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    })
    .then(() => undefined);
}

export async function notifyRole(
  role: UserRole,
  input: Omit<NotifyInput, "userId">
): Promise<void> {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  await Promise.all(users.map((user) => notify({ ...input, userId: user.id })));
}
