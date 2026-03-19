import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/AppError";
import { tenantPrismaManager } from "../lib/tenantPrisma";

export const requireTenant = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (
      req.tenantSubdomain &&
      req.user.tenantSubdomain &&
      req.tenantSubdomain !== req.user.tenantSubdomain
    ) {
      return next(new AppError("Tenant mismatch", 403));
    }

    const tenantSubdomain =
      req.tenantSubdomain ?? req.user.tenantSubdomain;

    if (!tenantSubdomain) {
      return next(new AppError("Tenant association required", 403));
    }

    req.tenantPrisma = tenantPrismaManager.getClient(
      tenantSubdomain
    );
    next();
  } catch (error) {
    next(error);
  }
};
