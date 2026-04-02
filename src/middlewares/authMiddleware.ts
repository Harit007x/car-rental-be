import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { AppError } from "../lib/AppError";
import { globalPrisma } from "../lib/prisma";

type ModuleAction = "view" | "add" | "edit" | "delete";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Invalid or expired token", 401));
    }
  }
};

export const requireSuperAdmin = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const adminUser = await globalPrisma.admin.findFirst({
        where: {
          id: req.user.userId,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true, isSuperAdmin: true },
      });

      if (!adminUser?.isSuperAdmin) {
        return next(
          new AppError(
            "You do not have permission to perform this action",
            403,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const actionToPermissionField = (action: ModuleAction) => {
  if (action === "view") return "canView";
  if (action === "add") return "canAdd";
  if (action === "edit") return "canEdit";
  return "canDelete";
};

export const authorizeModuleAction = (
  moduleKey: string,
  action: ModuleAction,
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const admin = await globalPrisma.admin.findFirst({
        where: {
          id: req.user.userId,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: {
          id: true,
          isSuperAdmin: true,
          roleId: true,
          role: {
            select: {
              id: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!admin) {
        return next(
          new AppError(
            "You do not have permission to perform this action",
            403,
          ),
        );
      }

      if (admin.isSuperAdmin) {
        return next();
      }

      if (
        admin.roleId &&
        (!admin.role || admin.role.deletedAt || admin.role.status !== "ACTIVE")
      ) {
        return next(
          new AppError(
            "Your role has been deactivated. Please contact the super admin.",
            403,
          ),
        );
      }

      const moduleRecord = await globalPrisma.module.findUnique({
        where: { key: moduleKey },
        select: { id: true },
      });

      if (!moduleRecord) {
        return next(new AppError("Module access is not configured", 403));
      }

      const adminPermission = await globalPrisma.adminPermission.findUnique({
        where: {
          adminId_moduleId: {
            adminId: admin.id,
            moduleId: moduleRecord.id,
          },
        },
        select: {
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        },
      });

      const field = actionToPermissionField(action);
      const hasAccess = Boolean(adminPermission?.[field]);

      if (!hasAccess) {
        return next(
          new AppError(
            "You do not have permission to perform this action",
            403,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
