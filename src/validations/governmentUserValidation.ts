import { z } from "zod";

export const governmentUserIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const createGovernmentUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    mobile: z.string().min(5),
    email: z.string().email(),
    address: z.string().min(5),
    password: z.string().min(6),
  }),
});

export const updateGovernmentUserSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      mobile: z.string().min(5).optional(),
      email: z.string().email().optional(),
      address: z.string().min(5).optional(),
      password: z.string().min(6).optional(),
    })
    .partial(),
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const governmentUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
  params: z.object({
    userId: z.string().uuid(),
  }),
});
