import type { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const DEFAULT_SUPER_ADMIN = {
  name: process.env.SEED_SUPER_ADMIN_NAME || "Super Admin",
  email: process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@demo.com",
  password: process.env.SEED_SUPER_ADMIN_PASSWORD || "Admin@123",
};

export const seedSuperAdmin = async (prisma: PrismaClient) => {
  const existingSuperAdmin = await prisma.admin.findFirst({
    where: {
      isSuperAdmin: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existingSuperAdmin) {
    return;
  }

  const existingByEmail = await prisma.admin.findUnique({
    where: { email: DEFAULT_SUPER_ADMIN.email },
    select: { id: true },
  });

  if (existingByEmail) {
    await prisma.admin.update({
      where: { id: existingByEmail.id },
      data: {
        name: DEFAULT_SUPER_ADMIN.name,
        isSuperAdmin: true,
        roleId: null,
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    return;
  }

  const passwordHash = await hashPassword(DEFAULT_SUPER_ADMIN.password);

  await prisma.admin.create({
    data: {
      name: DEFAULT_SUPER_ADMIN.name,
      email: DEFAULT_SUPER_ADMIN.email,
      passwordHash,
      isSuperAdmin: true,
      roleId: null,
      status: "ACTIVE",
      mustChangePassword: true,
    },
  });
};
