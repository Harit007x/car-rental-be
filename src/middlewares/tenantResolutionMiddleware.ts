import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/AppError";
import { globalPrisma } from "../lib/prisma";
import { tenantPrismaManager } from "../lib/tenantPrisma";

const TENANT_SUBDOMAIN_HEADER = "x-tenant-subdomain";

type TenantContextOptions = {
  required?: boolean;
};

const getHeaderSubdomain = (req: Request): string | null => {
  const rawHeader =
    req.get(TENANT_SUBDOMAIN_HEADER) ?? req.headers[TENANT_SUBDOMAIN_HEADER];
  const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
};

export const tenantContext =
  (options: TenantContextOptions = {}) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const headerSubdomain = getHeaderSubdomain(req);
      const userSubdomain = req.user?.tenantSubdomain ?? null;

      if (
        headerSubdomain &&
        userSubdomain &&
        headerSubdomain !== userSubdomain
      ) {
        return next(new AppError("Tenant mismatch", 403));
      }

      const effectiveSubdomain = headerSubdomain;

      if (!effectiveSubdomain) {
        if (options.required) {
          return next(new AppError("Tenant association required", 403));
        }
        return next();
      }

      if (headerSubdomain) {
        const tenant = await globalPrisma.tenant.findUnique({
          where: { subdomain: effectiveSubdomain },
        });

        if (!tenant) {
          return next(new AppError("Tenant not found", 404));
        }
      }

      req.tenantSubdomain = effectiveSubdomain;
      req.tenantPrisma = tenantPrismaManager.getClient(effectiveSubdomain);
      next();
    } catch (error) {
      next(error);
    }
  };
