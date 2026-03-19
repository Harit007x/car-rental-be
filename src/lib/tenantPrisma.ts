import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as TenantPrismaClient } from "../generated/prisma-tenant/client";
import { env } from "../config/env";

class TenantPrismaManager {
  private clients: Map<string, TenantPrismaClient> = new Map();

  getClient(schemaName: string): TenantPrismaClient {
    const existing = this.clients.get(schemaName);
    if (existing) {
      return existing;
    }

    const databaseUrl = new URL(env.DATABASE_URL);

    // Ensure Prisma targets the tenant schema explicitly.
    databaseUrl.searchParams.set("schema", schemaName);

    // Also set search_path for safety with raw SQL / extensions.
    const searchPathOption = `-c search_path=${schemaName}`;
    databaseUrl.searchParams.set("options", searchPathOption);

    const connectionString = databaseUrl.toString();

    const adapter = new PrismaPg({ connectionString }, { schema: schemaName });
    const client = new TenantPrismaClient({ adapter });

    this.clients.set(schemaName, client);
    return client;
  }

  async disconnectAll(): Promise<void> {
    const disconnects = Array.from(this.clients.values()).map((client) =>
      client.$disconnect(),
    );
    await Promise.all(disconnects);
    this.clients.clear();
  }
}

export const tenantPrismaManager = new TenantPrismaManager();
export type { TenantPrismaClient };
