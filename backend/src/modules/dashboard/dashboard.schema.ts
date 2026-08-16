import { z } from "zod";

export const dashboardTrendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});