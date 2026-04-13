import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env";

const connectionString = env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const globalPrisma = new PrismaClient({ adapter });

export { globalPrisma };
