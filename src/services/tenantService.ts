import { randomUUID } from "crypto";
import { globalPrisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { hashPassword } from "../lib/password";
import { provisionTenantSchema } from "./tenantProvisioningService";
import { TenantPrismaClient, tenantPrismaManager } from "../lib/tenantPrisma";
import type { OnboardTenantInput } from "../validations/tenantValidation";
import type { PaginationParams, PaginatedResult } from "../lib/pagination";
import type { CompanyStatus, Prisma } from "../generated/prisma/client";

type TenantListFilters = {
  search?: string;
  fromDate?: string;
  toDate?: string;
};

const selectTenantWithBankAccount = {
  id: true,
  subdomain: true,
  businessName: true,
  registrationNumber: true,
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  businessAddress: true,
  city: true,
  state: true,
  country: true,
  businessType: true,
  fleetSize: true,
  status: true,
  bankAccount: {
    select: {
      id: true,
      accountName: true,
      accountNo: true,
      bankName: true,
      ifscCode: true,
    },
  },
};

export const onboardTenant = async (data: OnboardTenantInput) => {
  const subdomain = data.subdomain.toLowerCase();
  const existingTenant = await globalPrisma.tenant.findUnique({
    where: { subdomain },
  });

  if (existingTenant) {
    throw new AppError("Subdomain already in use", 409);
  }

  // 2. Perform the global DB inserts inside a transaction
  const hashedPassword = await hashPassword(data.adminPassword);
  const tenantId = randomUUID();

  const { newTenant } = await globalPrisma.$transaction(async (prisma) => {
    // Create Tenant metadata
    const newTenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        subdomain,
        businessName: data.businessName,
        registrationNumber: data.registrationNumber,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail,
        businessAddress: data.businessAddress,
        city: data.city,
        state: data.state,
        country: data.country,
        businessType: data.businessType,
        fleetSize: data.fleetSize,
        bankAccount: data.bankAccount
          ? {
              create: {
                accountName: data.bankAccount.accountName,
                accountNo: data.bankAccount.accountNo,
                bankName: data.bankAccount.bankName,
                ifscCode: data.bankAccount.ifscCode,
              },
            }
          : undefined,
        status: "INACTIVE",
      },
    });

    return { newTenant };
  });

  // 3. Provision the PostgreSQL schema dynamically
  // We do this outside the Prisma transaction because it involves raw DDL (CREATE SCHEMA, CREATE TABLE)
  // DDL statements generally cannot be rolled back in Postgres the same way DML can.
  try {
    await provisionTenantSchema(newTenant.subdomain);
  } catch (error) {
    // If provisioning fails, we should ideally compensate and clean up the global tenant records.
    // For simplicity, we just surface the error, but in production, you might implement a saga / rollback here.
    console.error(
      `Failed to provision schema for tenant ${newTenant.id}:`,
      error,
    );
    throw new AppError("Failed to provision tenant database schema", 500);
  }

  const tenantPrisma = tenantPrismaManager.getClient(newTenant.subdomain);
  await tenantPrisma.user.create({
    data: {
      name: data.ownerName,
      email: data.ownerEmail,
      password: hashedPassword,
      role: "RENTAL_ADMIN",
      mustChangePassword: true,
    },
  });

  return {
    tenant: newTenant,
  };
};

export const getAllTenants = async (
  pagination: PaginationParams,
  filters: TenantListFilters = {},
): Promise<PaginatedResult<any>> => {
  const where: any = {};
  let parsedFromDate: Date | undefined;
  let parsedToDate: Date | undefined;

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      where.OR = [
        { businessName: { contains: term, mode: "insensitive" } },
        { ownerEmail: { contains: term, mode: "insensitive" } },
        { ownerPhone: { contains: term } },
      ];
    }
  }

  if (filters.fromDate) {
    parsedFromDate = new Date(filters.fromDate);
    if (Number.isNaN(parsedFromDate.getTime())) {
      throw new AppError("Invalid fromDate", 400);
    }
  }

  if (filters.toDate) {
    parsedToDate = new Date(filters.toDate);
    if (Number.isNaN(parsedToDate.getTime())) {
      throw new AppError("Invalid toDate", 400);
    }
  }

  if (parsedFromDate && parsedToDate && parsedToDate < parsedFromDate) {
    throw new AppError("toDate should not be less than fromDate", 400);
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (parsedFromDate) {
      where.createdAt.gte = parsedFromDate;
    }
    if (parsedToDate) {
      where.createdAt.lte = parsedToDate;
    }
  }

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.tenant.findMany({
      where,
      select: selectTenantWithBankAccount,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.tenant.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const updateTenantStatus = async (
  tenantId: string,
  status: CompanyStatus,
) => {
  const existing = await globalPrisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!existing) {
    throw new AppError("Tenant not found", 404);
  }

  return globalPrisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  });
};

export const getTenantData = async (subdomain: string) => {
  const normalizedSubdomain = subdomain.toLowerCase();
  const tenant = await globalPrisma.tenant.findUnique({
    where: { subdomain: normalizedSubdomain },
    select: selectTenantWithBankAccount,
  });

  if (!tenant) {
    throw new AppError("Tenant not found", 404);
  }

  const tenantPrisma = tenantPrismaManager.getClient(tenant.subdomain);

  const [
    users,
    deliveryPartners,
    deliveryPartnerDocuments,
    customers,
    customerDocuments,
    serviceLocations,
  ] = await tenantPrisma.$transaction([
    tenantPrisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    tenantPrisma.deliveryPartner.findMany(),
    tenantPrisma.deliveryPartnerDocument.findMany(),
    tenantPrisma.customer.findMany(),
    tenantPrisma.customerDocument.findMany(),
    tenantPrisma.serviceLocation.findMany(),
  ]);

  return {
    tenant,
    data: {
      users,
      deliveryPartners,
      deliveryPartnerDocuments,
      customers,
      customerDocuments,
      serviceLocations,
    },
  };
};

export const updateTenantProfile = async (
  tenantPrisma: TenantPrismaClient,
  userId: string,
  data: { name?: string; email?: string },
) => {
  const existing = await tenantPrisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await tenantPrisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new AppError("Email already in use", 409);
    }
  }

  return tenantPrisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
