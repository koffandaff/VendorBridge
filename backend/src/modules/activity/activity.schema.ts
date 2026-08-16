import { z } from "zod";

export const activityQuerySchema = z.object({
  entityType: z.string().trim().max(50).optional(),
  action: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});