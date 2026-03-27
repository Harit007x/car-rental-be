import { z } from "zod";

export const subscriptionIdParamsSchema = z.object({
  params: z.object({
    subscriptionId: z.string().uuid(),
  }),
});

export const subscriptionListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    features: z.array(z.string().min(1)).min(1),
    price: z.number().min(0),
  }),
});

export const updateSubscriptionSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      description: z.string().min(2).optional(),
      features: z.array(z.string().min(1)).min(1).optional(),
      price: z.number().min(0).optional(),
    })
    .partial(),
  params: z.object({
    subscriptionId: z.string().uuid(),
  }),
});

export const subscriptionStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ENABLED", "DISABLED"]),
  }),
  params: z.object({
    subscriptionId: z.string().uuid(),
  }),
});
