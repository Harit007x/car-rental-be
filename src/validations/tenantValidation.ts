import { z } from "zod";
import { BusinessType } from "../generated/prisma/client";

export const onboardTenantSchema = z.object({
  body: z.object({
    // Tenant Details
    businessName: z.string().min(1, "Business Name is required"),
    registrationNumber: z.string().min(1, "Registration Number is required"),
    ownerName: z.string().min(1, "Owner Name is required"),
    ownerPhone: z.string().min(10, "Owner Phone is required"),
    ownerEmail: z.string().email("Invalid owner email format"),
    subdomain: z
      .string()
      .min(1, "Subdomain is required")
      .regex(
        /^[a-z0-9-]+$/,
        "Subdomain must be lowercase alphanumeric or hyphen",
      ),
    businessAddress: z.string().min(1, "Business Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    businessType: z.nativeEnum(BusinessType, {
      errorMap: () => ({ message: "Invalid business type" }),
    }),
    fleetSize: z
      .number()
      .int()
      .nonnegative("Fleet size must be a positive integer"),
    bankAccount: z
      .object({
        accountName: z.string().min(1, "Account name is required"),
        accountNo: z.string().min(1, "Account number is required"),
        bankName: z.string().min(1, "Bank name is required"),
        ifscCode: z.string().min(1, "IFSC code is required"),
      })
      .optional(),

    // Rental Admin Credentials
    adminPassword: z
      .string()
      .min(6, "Admin password must be at least 6 characters"),
  }),
});

export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>["body"];

export const tenantDataParamsSchema = z.object({
  params: z.object({
    subdomain: z
      .string()
      .min(1, "Subdomain is required")
      .regex(
        /^[a-z0-9-]+$/,
        "Subdomain must be lowercase alphanumeric or hyphen",
      ),
  }),
});

export const tenantIdParamsSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid(),
  }),
});

export const tenantProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
});

export const tenantStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "ACCOUNT_DELETED"]),
  }),
  params: z.object({
    tenantId: z.string().uuid(),
  }),
});
