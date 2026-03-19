import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/AppError";
import { env } from "../config/env";
import { globalPrisma } from "../lib/prisma";
import { tenantPrismaManager } from "../lib/tenantPrisma";
import net from "net";

const MAIN_DOMAIN = env.MAIN_DOMAIN.toLowerCase();
const IGNORED_SUBDOMAINS = new Set(["www"]);

const getSubdomain = (host: string): string | null => {
  const hostname = host.toLowerCase();

  if (!hostname || net.isIP(hostname)) {
    return null;
  }

  if (hostname === MAIN_DOMAIN) {
    return null;
  }

  if (!hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    return null;
  }

  const sub = hostname.slice(0, -(MAIN_DOMAIN.length + 1));
  if (!sub || IGNORED_SUBDOMAINS.has(sub)) {
    return null;
  }

  return sub;
};

export const resolveTenantFromSubdomain = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const host = req.hostname;
    const subdomain = getSubdomain(host);
    if (!subdomain) {
      return next();
    }

    const tenant = await globalPrisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    req.tenantSubdomain = tenant.subdomain;
    req.tenantPrisma = tenantPrismaManager.getClient(tenant.subdomain);
    next();
  } catch (error) {
    next(error);
  }
};
