import type { PrismaClient } from "../src/generated/prisma/client";

const MODULES = [
  { key: "admin_users", name: "Admin Users" },
  { key: "government_users", name: "Government Users" },
  { key: "subscriptions", name: "Subscriptions" },
  { key: "car_rental_companies", name: "Car Rental Companies" },
  { key: "cms_pages", name: "CMS Pages" },
];

export const seedModules = async (prisma: PrismaClient) => {
  for (const moduleItem of MODULES) {
    await prisma.module.upsert({
      where: { key: moduleItem.key },
      update: {
        name: moduleItem.name,
      },
      create: moduleItem,
    });
  }
};
