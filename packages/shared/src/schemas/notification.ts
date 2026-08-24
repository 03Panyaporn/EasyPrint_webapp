import { z } from "zod";

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  typeId: z.number().int().positive(),
  title: z.string().min(1),
  message: z.string().min(1),
  category: z.string(),
  isRead: z.boolean(),
  link: z.string().nullable(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  typeId: z.number().int().positive(),
  title: z.string().min(1),
  message: z.string().min(1),
  category: z.string(),
  link: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
