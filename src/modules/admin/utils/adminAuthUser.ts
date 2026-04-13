import { AppError } from "../../../lib/AppError";

export const adminAuthUserInclude = {
  role: {
    select: {
      id: true,
      name: true,
      status: true,
      deletedAt: true,
    },
  },
  permissions: {
    select: {
      moduleId: true,
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      module: {
        select: {
          id: true,
          key: true,
          name: true,
        },
      },
    },
  },
} as const;

type AdminRole = {
  id: string;
  name: string;
  status: string;
  deletedAt: Date | null;
};

type AdminPermission = {
  moduleId: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  module: {
    key: string;
    name: string;
  };
};

type AdminAuthUser = {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  status: string;
  roleId: string | null;
  role: AdminRole | null;
  permissions: AdminPermission[];
};

export const assertAdminRoleIsActive = (admin: {
  isSuperAdmin: boolean;
  roleId: string | null;
  role: { status: string; deletedAt: Date | null } | null;
}) => {
  if (admin.isSuperAdmin || !admin.roleId) {
    return;
  }

  if (!admin.role || admin.role.deletedAt || admin.role.status !== "ACTIVE") {
    throw new AppError(
      "Your role has been deactivated. Please contact the super admin.",
      403,
    );
  }
};

export const buildAdminAuthUser = (admin: AdminAuthUser) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  isSuperAdmin: admin.isSuperAdmin,
  status: admin.status,
  roleId: admin.roleId,
  role: admin.role
    ? {
        id: admin.role.id,
        name: admin.role.name,
      }
    : null,
  permissions: admin.isSuperAdmin
    ? []
    : admin.permissions
        .map((permission) => ({
          moduleId: permission.moduleId,
          moduleKey: permission.module.key,
          moduleName: permission.module.name,
          canView: permission.canView,
          canAdd: permission.canAdd,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
        }))
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName)),
});
