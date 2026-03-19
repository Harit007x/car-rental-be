import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "tenant-schema.prisma",
  migrations: {
    path: "tenant-migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
