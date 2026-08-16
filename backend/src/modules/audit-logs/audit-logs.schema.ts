import { z } from "zod";

export const auditLogQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID format").optional(),
  entityType: z.string().trim().min(1).max(50).optional(),
  action: z.string().trim().min(1).max(100).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});