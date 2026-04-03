import { z } from "zod";

const businessTypeSchema = z.enum(["INDIVIDUAL", "COMPANY", "FLEET_OPERATOR"]);

const bankAccountSchema = z.object({
  accountName: z.string().min(2),
  accountNo: z.string().min(5),
  bankName: z.string().min(2),
  ifscCode: z.string().min(4),
});

export const carRentalCompanyIdParamsSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
  }),
});

export const createCarRentalCompanySchema = z.object({
  body: z.object({
    businessName: z.string().min(2),
    registrationNumber: z.string().min(2),
    ownerName: z.string().min(2),
    ownerPhone: z.string().min(5),
    ownerEmail: z.string().email(),
    businessAddress: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    businessType: businessTypeSchema,
    fleetSize: z.number().int().min(0),
    serviceOperationLocations: z.array(z.string().min(2)).min(1),
    bankAccount: bankAccountSchema,
  }),
});

export const updateCarRentalCompanySchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
  }),
  body: z
    .object({
      businessName: z.string().min(2).optional(),
      registrationNumber: z.string().min(2).optional(),
      ownerName: z.string().min(2).optional(),
      ownerPhone: z.string().min(5).optional(),
      businessAddress: z.string().min(5).optional(),
      city: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      country: z.string().min(2).optional(),
      businessType: businessTypeSchema.optional(),
      fleetSize: z.number().int().min(0).optional(),
      serviceOperationLocations: z.array(z.string().min(2)).min(1).optional(),
      bankAccount: bankAccountSchema.optional(),
    })
    .partial(),
});

export const carRentalCompanyListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().min(1).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
  }),
});

export const carRentalCompanyStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
  params: z.object({
    companyId: z.string().uuid(),
  }),
});
