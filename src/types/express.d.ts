import type { PrismaClient as TenantPrismaClient } from "../generated/prisma-tenant/client";
import type { AuthRole } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: AuthRole;
        tenantSubdomain: string | null;
      };
      tenantSubdomain?: string | null;
      tenantPrisma?: TenantPrismaClient;
    }
  }
}
