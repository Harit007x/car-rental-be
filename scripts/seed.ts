import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedModules } from "./moduleSeeder";
import { seedSuperAdmin } from "./superAdminSeeder";
import { seedFeatures } from "./featureSeeder";

const run = async () => {
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedModules(prisma);
    await seedSuperAdmin(prisma);
    await seedFeatures(prisma);
    console.log("Seeding completed successfully.");
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
