import "dotenv/config";
import { globalPrisma } from "../src/lib/prisma";
import { tenantPrismaManager } from "../src/lib/tenantPrisma";
import { hashPassword } from "../src/lib/password";
import { provisionTenantSchema } from "../src/services/tenantProvisioningService";

const resolveSubdomain = () => {
  const arg = process.argv.find((value) => value.startsWith("--domain="));

  if (arg) {
    const value = arg.split("=", 2)[1]?.trim();
    if (value) {
      return value.toLowerCase();
    }
  }

  const positional = process.argv[2]?.trim();
  if (positional) {
    return positional.toLowerCase();
  }

  return "acme";
};

const ensureTenant = async () => {
  const subdomain = resolveSubdomain();

  const existing = await globalPrisma.tenant.findUnique({
    where: { subdomain },
  });

  if (existing) {
    return existing;
  }

  const tenantId = crypto.randomUUID();

  const tenant = await globalPrisma.tenant.create({
    data: {
      id: tenantId,
      subdomain,
      businessName: "Acme Rentals",
      registrationNumber: "REG-12345",
      ownerName: "Alex Owner",
      ownerPhone: "9999999999",
      ownerEmail: "owner@acme.com",
      businessAddress: "221B Baker Street",
      city: "Mumbai",
      state: "MH",
      country: "India",
      businessType: "COMPANY",
      fleetSize: 25,
    },
  });

  await provisionTenantSchema(tenant.subdomain);

  const tenantPrisma = tenantPrismaManager.getClient(
    tenant.subdomain,
  );
  const adminPassword = await hashPassword("Admin@1234");
  await tenantPrisma.user.create({
    data: {
      email: "owner@acme.com",
      password: adminPassword,
      role: "RENTAL_ADMIN",
      isEmailVerified: false,
      mustChangePassword: true,
    },
  });

  return tenant;
};

const seed = async () => {
  await ensureTenant();
};

seed()
  .then(async () => {
    await tenantPrismaManager.disconnectAll();
    await globalPrisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await tenantPrismaManager.disconnectAll();
    await globalPrisma.$disconnect();
    process.exit(1);
  });
