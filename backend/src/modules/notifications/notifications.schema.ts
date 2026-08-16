import { z } from "zod";

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  unread: z.enum(["true", "false"]).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
});