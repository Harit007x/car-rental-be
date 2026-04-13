import { AppError } from "../../../lib/AppError";
import { globalPrisma } from "../../../lib/prisma";
import type {
  PaginationParams,
  PaginatedResult,
} from "../../../lib/pagination";

interface CreateRoleInput {
  name: string;
  permissions?: Array<{
    moduleId: string;
    canView?: boolean;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  }>;
}

type RoleListFilters = {
  search?: string;
};

type PermissionInput = {
  moduleId: string;
  canView?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

const selectRoleFields = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
};

const ensureActorIsActiveAdmin = async (actorAdminId: string) => {
  const actor = await globalPrisma.admin.findFirst({
    where: { id: actorAdminId, deletedAt: null, status: "ACTIVE" },
    select: { id: true },
  });

  if (!actor) {
    throw new AppError("Admin not found", 404);
  }
};

const normalizePermission = (permission: PermissionInput) => ({
  moduleId: permission.moduleId,
  canView: permission.canView ?? false,
  canAdd: permission.canAdd ?? false,
  canEdit: permission.canEdit ?? false,
  canDelete: permission.canDelete ?? false,
});

const hasAnyPermissionEnabled = (
  permission: ReturnType<typeof normalizePermission>,
) =>
  permission.canView ||
  permission.canAdd ||
  permission.canEdit ||
  permission.canDelete;

const ensurePermissionModulesExist = async (moduleIds: string[]) => {
  if (moduleIds.length === 0) {
    return;
  }

  const uniqueModuleIds = [...new Set(moduleIds)];
  const modules = await globalPrisma.module.findMany({
    where: { id: { in: uniqueModuleIds } },
    select: { id: true },
  });

  if (modules.length !== uniqueModuleIds.length) {
    throw new AppError("One or more modules do not exist", 400);
  }
};

export const getPermissionModules = async () => {
  return globalPrisma.module.findMany({
    select: {
      id: true,
      key: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const createRole = async (
  actorAdminId: string,
  data: CreateRoleInput,
) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const normalizedPermissions = (data.permissions ?? []).map(
    normalizePermission,
  );
  const moduleIds = normalizedPermissions.map(
    (permission) => permission.moduleId,
  );
  if (moduleIds.length !== new Set(moduleIds).size) {
    throw new AppError("Duplicate module permissions are not allowed", 400);
  }
  await ensurePermissionModulesExist(moduleIds);

  return globalPrisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: {
        name: data.name,
        status: "ACTIVE",
      },
      select: selectRoleFields,
    });

    if (normalizedPermissions.length > 0) {
      await tx.rolePermission.createMany({
        data: normalizedPermissions.map((permission) => ({
          roleId: role.id,
          moduleId: permission.moduleId,
          canView: permission.canView,
          canAdd: permission.canAdd,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
        })),
      });
    }

    return role;
  });
};

export const getAllRoles = async (
  actorAdminId: string,
  pagination: PaginationParams,
  filters: RoleListFilters = {},
): Promise<PaginatedResult<any>> => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const where: any = {
    deletedAt: null,
    status: { not: "DELETED" },
  };

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      where.name = { contains: term, mode: "insensitive" };
    }
  }

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.role.findMany({
      where,
      select: selectRoleFields,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.role.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const getRoleById = async (actorAdminId: string, roleId: string) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const role = await globalPrisma.role.findFirst({
    where: {
      id: roleId,
      deletedAt: null,
      status: { not: "DELETED" },
    },
    select: {
      ...selectRoleFields,
      permissions: {
        where: {
          OR: [
            { canView: true },
            { canAdd: true },
            { canEdit: true },
            { canDelete: true },
          ],
        },
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
        orderBy: {
          module: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  return {
    id: role.id,
    name: role.name,
    status: role.status,
    createdAt: role.createdAt,
    permissions: role.permissions.map((permission) => ({
      moduleId: permission.moduleId,
      moduleKey: permission.module.key,
      moduleName: permission.module.name,
      canView: permission.canView,
      canAdd: permission.canAdd,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
    })),
  };
};

export const updateRole = async (
  actorAdminId: string,
  roleId: string,
  data: { name?: string; permissions?: PermissionInput[] },
) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const role = await globalPrisma.role.findFirst({
    where: { id: roleId, deletedAt: null, status: { not: "DELETED" } },
    select: { id: true },
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  await globalPrisma.$transaction(async (tx) => {
    if (typeof data.name !== "undefined") {
      await tx.role.update({
        where: { id: roleId },
        data: {
          name: data.name,
        },
      });
    }

    if (typeof data.permissions !== "undefined") {
      const normalizedPermissions = data.permissions.map(normalizePermission);
      const moduleIds = normalizedPermissions.map(
        (permission) => permission.moduleId,
      );
      if (moduleIds.length !== new Set(moduleIds).size) {
        throw new AppError("Duplicate module permissions are not allowed", 400);
      }
      await ensurePermissionModulesExist(moduleIds);

      const previousRolePermissions = await tx.rolePermission.findMany({
        where: { roleId },
        select: {
          moduleId: true,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        },
      });

      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (normalizedPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: normalizedPermissions.map((permission) => ({
            roleId,
            moduleId: permission.moduleId,
            canView: permission.canView,
            canAdd: permission.canAdd,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete,
          })),
        });
      }

      const roleAdmins = await tx.admin.findMany({
        where: {
          roleId,
          deletedAt: null,
          status: { not: "DELETED" },
        },
        select: { id: true },
      });

      if (roleAdmins.length > 0) {
        const adminIds = roleAdmins.map((admin) => admin.id);
        const previousRoleModuleIds = previousRolePermissions.map(
          (permission) => permission.moduleId,
        );
        const syncModuleIds = [
          ...new Set([...previousRoleModuleIds, ...moduleIds]),
        ];

        const previousRolePermissionMap = new Map(
          previousRolePermissions.map((permission) => [
            permission.moduleId,
            permission,
          ]),
        );
        const updatedRolePermissionMap = new Map(
          normalizedPermissions.map((permission) => [
            permission.moduleId,
            permission,
          ]),
        );

        const existingAdminPermissions = await tx.adminPermission.findMany({
          where: {
            adminId: { in: adminIds },
            moduleId: { in: syncModuleIds },
          },
          select: {
            adminId: true,
            moduleId: true,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
          },
        });

        const existingAdminPermissionMap = new Map(
          existingAdminPermissions.map((permission) => [
            `${permission.adminId}:${permission.moduleId}`,
            permission,
          ]),
        );

        await tx.adminPermission.deleteMany({
          where: {
            adminId: { in: adminIds },
            moduleId: { in: syncModuleIds },
          },
        });

        const effectivePermissions = adminIds.flatMap((adminId) =>
          syncModuleIds
            .map((moduleId) => {
              const previousRolePermission =
                previousRolePermissionMap.get(moduleId) ??
                normalizePermission({ moduleId });
              const updatedRolePermission =
                updatedRolePermissionMap.get(moduleId) ??
                normalizePermission({ moduleId });
              const existingAdminPermission =
                existingAdminPermissionMap.get(`${adminId}:${moduleId}`) ??
                normalizePermission({ moduleId });

              const adminExtras = {
                canView:
                  existingAdminPermission.canView &&
                  !previousRolePermission.canView,
                canAdd:
                  existingAdminPermission.canAdd &&
                  !previousRolePermission.canAdd,
                canEdit:
                  existingAdminPermission.canEdit &&
                  !previousRolePermission.canEdit,
                canDelete:
                  existingAdminPermission.canDelete &&
                  !previousRolePermission.canDelete,
              };

              const mergedPermission = {
                adminId,
                moduleId,
                canView: updatedRolePermission.canView || adminExtras.canView,
                canAdd: updatedRolePermission.canAdd || adminExtras.canAdd,
                canEdit: updatedRolePermission.canEdit || adminExtras.canEdit,
                canDelete:
                  updatedRolePermission.canDelete || adminExtras.canDelete,
              };

              return hasAnyPermissionEnabled(mergedPermission)
                ? mergedPermission
                : null;
            })
            .filter(
              (
                permission,
              ): permission is {
                adminId: string;
                moduleId: string;
                canView: boolean;
                canAdd: boolean;
                canEdit: boolean;
                canDelete: boolean;
              } => permission !== null,
            ),
        );

        if (effectivePermissions.length > 0) {
          await tx.adminPermission.createMany({
            data: effectivePermissions,
          });
        }
      }
    }
  });

  return getRoleById(actorAdminId, roleId);
};

export const updateRoleStatus = async (
  actorAdminId: string,
  roleId: string,
  status: "ACTIVE" | "INACTIVE",
) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const role = await globalPrisma.role.findFirst({
    where: { id: roleId, deletedAt: null, status: { not: "DELETED" } },
    select: { id: true },
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  return await globalPrisma.role.update({
    where: { id: roleId },
    data: { status },
    select: selectRoleFields,
  });
};

export const deleteRole = async (actorAdminId: string, roleId: string) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const role = await globalPrisma.role.findFirst({
    where: { id: roleId, deletedAt: null, status: { not: "DELETED" } },
    select: { id: true },
  });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  const deletedAt = new Date();

  return globalPrisma.$transaction(async (tx) => {
    await tx.admin.updateMany({
      where: {
        roleId,
        deletedAt: null,
        status: { not: "DELETED" },
      },
      data: {
        status: "DELETED",
        deletedAt,
      },
    });

    return tx.role.update({
      where: { id: roleId },
      data: {
        status: "DELETED",
        deletedAt,
      },
      select: selectRoleFields,
    });
  });
};
