import { randomUUID } from "crypto";
import { globalPrisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { hashPassword } from "../lib/password";
import { provisionTenantSchema } from "./tenantProvisioningService";
import { tenantPrismaManager } from "../lib/tenantPrisma";
import type { OnboardTenantInput } from "../validations/tenantValidation";

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
  const adminUser = await tenantPrisma.user.create({
    data: {
      email: data.ownerEmail,
      password: hashedPassword,
      role: "RENTAL_ADMIN",
      isEmailVerified: false,
      mustChangePassword: true,
    },
  });

  return {
    tenant: newTenant,
    adminUser: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    },
  };
};

export const getAllTenants = async () => {
  const tenants = await globalPrisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { tenants };
};

export const getTenantData = async (subdomain: string) => {
  const normalizedSubdomain = subdomain.toLowerCase();
  const tenant = await globalPrisma.tenant.findUnique({
    where: { subdomain: normalizedSubdomain },
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
        isEmailVerified: true,
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
