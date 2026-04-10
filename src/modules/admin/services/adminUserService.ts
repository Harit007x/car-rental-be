import { AppError } from "../../../lib/AppError";
import { globalPrisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/password";
import { generateTemporaryPassword } from "../../../lib/temporaryPassword";
import type {
  PaginationParams,
  PaginatedResult,
} from "../../../lib/pagination";

interface RegisterSuperAdminInput {
  name: string;
  email: string;
  password: string;
}

interface CreateAdminInput {
  name: string;
  email: string;
  roleId: string;
  permissions: Array<{
    moduleId: string;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
}

interface UpdateAdminInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string | null;
  permissions?: Array<{
    moduleId: string;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
}

interface UpdateAdminProfileInput {
  name?: string;
  email?: string;
}

type AdminListFilters = {
  search?: string;
};

type PermissionInput = {
  moduleId: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

const selectAdminListItem = {
  id: true,
  name: true,
  email: true,
  isSuperAdmin: true,
  roleId: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  status: true,
  createdAt: true,
};

const ensureActorIsActiveAdmin = async (actorAdminId: string) => {
  const actor = await globalPrisma.admin.findFirst({
    where: { id: actorAdminId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, isSuperAdmin: true },
  });

  if (!actor) {
    throw new AppError("Admin not found", 404);
  }

  return actor;
};

const normalizePermission = (permission: PermissionInput) => ({
  moduleId: permission.moduleId,
  canView: permission.canView,
  canAdd: permission.canAdd,
  canEdit: permission.canEdit,
  canDelete: permission.canDelete,
});

const hasAnyPermissionEnabled = (permission: PermissionInput) =>
  permission.canView ||
  permission.canAdd ||
  permission.canEdit ||
  permission.canDelete;

const sanitizePermissions = (permissions: PermissionInput[]) => {
  const map = new Map<string, ReturnType<typeof normalizePermission>>();

  for (const permission of permissions) {
    map.set(permission.moduleId, normalizePermission(permission));
  }

  return [...map.values()].filter(hasAnyPermissionEnabled);
};

export const registerSuperAdmin = async (data: RegisterSuperAdminInput) => {
  const existingSuperAdmin = await globalPrisma.admin.findFirst({
    where: { isSuperAdmin: true, deletedAt: null },
  });

  if (existingSuperAdmin) {
    throw new AppError("Super admin already exists", 409);
  }

  const existingUser = await globalPrisma.admin.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await globalPrisma.admin.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      isSuperAdmin: true,
      status: "ACTIVE",
    },
  });

  return {
    user: { id: user.id, email: user.email, isSuperAdmin: user.isSuperAdmin },
  };
};

export const getAdminProfile = async (adminId: string) => {
  const admin = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, status: "ACTIVE" },
    select: selectAdminListItem,
  });

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  return admin;
};

export const updateAdminProfile = async (
  adminId: string,
  data: UpdateAdminProfileInput,
) => {
  const existing = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, status: "ACTIVE" },
  });

  if (!existing) {
    throw new AppError("Admin not found", 404);
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await globalPrisma.admin.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw new AppError("Email already in use", 409);
    }
  }

  return globalPrisma.admin.update({
    where: { id: adminId },
    data: {
      name: data.name,
      email: data.email,
    },
    select: selectAdminListItem,
  });
};

export const getCurrentAdminUser = async (adminId: string) => {
  const admin = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, status: "ACTIVE" },
    include: {
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
    },
  });

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (
    !admin.isSuperAdmin &&
    admin.roleId &&
    (!admin.role || admin.role.deletedAt || admin.role.status !== "ACTIVE")
  ) {
    throw new AppError(
      "Your role has been deactivated. Please contact the super admin.",
      403,
    );
  }

  return {
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      userType: "ADMIN" as const,
      isSuperAdmin: admin.isSuperAdmin,
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
    },
  };
};

export const createAdmin = async (
  actorAdminId: string,
  data: CreateAdminInput,
) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const existingUser = await globalPrisma.admin.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  if (data.roleId) {
    const role = await globalPrisma.role.findFirst({
      where: { id: data.roleId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });

    if (!role) {
      throw new AppError("Role not found", 404);
    }
  }

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(temporaryPassword);

  return globalPrisma.$transaction(async (tx) => {
    const effectivePermissions = sanitizePermissions(data.permissions ?? []);

    const admin = await tx.admin.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        roleId: data.roleId,
        isSuperAdmin: false,
        status: "ACTIVE",
      },
      select: selectAdminListItem,
    });

    if (effectivePermissions.length > 0) {
      await tx.adminPermission.createMany({
        data: effectivePermissions.map((permission) => ({
          adminId: admin.id,
          moduleId: permission.moduleId,
          canView: permission.canView,
          canAdd: permission.canAdd,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
        })),
      });
    }

    return admin;
  });
};

export const getAllAdmins = async (
  actorAdminId: string,
  pagination: PaginationParams,
  filters: AdminListFilters = {},
): Promise<PaginatedResult<any>> => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const where: any = {
    deletedAt: null,
    isSuperAdmin: false,
  };

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }
  }

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.admin.findMany({
      where,
      select: selectAdminListItem,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.admin.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const getAdminById = async (actorAdminId: string, adminId: string) => {
  const actor = await ensureActorIsActiveAdmin(actorAdminId);

  const admin = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null },
    select: {
      ...selectAdminListItem,
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
      },
    },
  });

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (!actor.isSuperAdmin && admin.isSuperAdmin) {
    throw new AppError("You do not have permission to view super admin", 403);
  }

  return admin;
};

export const updateAdmin = async (
  actorAdminId: string,
  adminId: string,
  data: UpdateAdminInput,
) => {
  const actor = await ensureActorIsActiveAdmin(actorAdminId);

  const existing = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null },
    select: { id: true, email: true, isSuperAdmin: true, roleId: true },
  });

  if (!existing) {
    throw new AppError("Admin not found", 404);
  }

  if (!actor.isSuperAdmin && existing.isSuperAdmin) {
    throw new AppError("You do not have permission to update super admin", 403);
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await globalPrisma.admin.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw new AppError("Email already in use", 409);
    }
  }

  if (data.roleId) {
    const role = await globalPrisma.role.findFirst({
      where: { id: data.roleId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });

    if (!role) {
      throw new AppError("Role not found", 404);
    }
  }

  return globalPrisma.$transaction(async (tx) => {
    const updateData: any = {
      name: data.name,
      email: data.email,
      roleId: data.roleId,
    };

    const updated = await tx.admin.update({
      where: { id: adminId },
      data: updateData,
      select: selectAdminListItem,
    });

    const isRoleUpdated = typeof data.roleId !== "undefined";
    if (isRoleUpdated || data.permissions) {
      await tx.adminPermission.deleteMany({
        where: { adminId },
      });

      const targetRoleId =
        typeof data.roleId === "undefined" ? existing.roleId : data.roleId;

      const rolePermissions = targetRoleId
        ? await tx.rolePermission.findMany({
            where: { roleId: targetRoleId },
            select: {
              moduleId: true,
              canView: true,
              canAdd: true,
              canEdit: true,
              canDelete: true,
            },
          })
        : [];

      const effectivePermissions = data.permissions
        ? sanitizePermissions(data.permissions)
        : rolePermissions.map(normalizePermission);

      if (effectivePermissions.length > 0) {
        await tx.adminPermission.createMany({
          data: effectivePermissions.map((permission) => ({
            adminId,
            moduleId: permission.moduleId,
            canView: permission.canView,
            canAdd: permission.canAdd,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete,
          })),
        });
      }
    }

    return updated;
  });
};

export const updateAdminStatus = async (
  actorAdminId: string,
  adminId: string,
  status: "ACTIVE" | "INACTIVE",
) => {
  await ensureActorIsActiveAdmin(actorAdminId);

  const existing = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null },
    select: { id: true, isSuperAdmin: true },
  });

  if (!existing) {
    throw new AppError("Admin not found", 404);
  }

  if (existing.isSuperAdmin) {
    throw new AppError("Super admin status cannot be updated", 403);
  }

  return globalPrisma.admin.update({
    where: { id: adminId },
    data: { status },
    select: selectAdminListItem,
  });
};

export const deleteAdmin = async (actorAdminId: string, adminId: string) => {
  const actor = await ensureActorIsActiveAdmin(actorAdminId);

  if (!actor.isSuperAdmin) {
    throw new AppError("Only super admin can delete team members", 403);
  }

  const existing = await globalPrisma.admin.findFirst({
    where: { id: adminId, deletedAt: null },
    select: { id: true, isSuperAdmin: true },
  });

  if (!existing) {
    throw new AppError("Admin not found", 404);
  }

  if (existing.isSuperAdmin) {
    throw new AppError("Super admin cannot be deleted", 403);
  }

  return globalPrisma.admin.update({
    where: { id: adminId },
    data: { status: "DELETED", deletedAt: new Date() },
    select: selectAdminListItem,
  });
};
