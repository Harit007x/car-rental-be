import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    make: z.string().min(2),
    model: z.string().min(2),
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    regNumber: z.string().min(3),
    category: z.string().min(2),
  }),
});
