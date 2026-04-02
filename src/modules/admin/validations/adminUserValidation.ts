import { z } from "zod";

const permissionSchema = z.object({
  moduleId: z.string().uuid(),
  canView: z.boolean().optional(),
  canAdd: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export const adminIdParamsSchema = z.object({
  params: z.object({
    adminId: z.string().uuid(),
  }),
});

export const createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    roleId: z.string().uuid(),
    permissions: z.array(permissionSchema).optional(),
  }),
});

export const updateAdminSchema = z.object({
  params: z.object({
    adminId: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
      roleId: z.string().uuid().nullable().optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      permissions: z.array(permissionSchema).optional(),
    })
    .partial(),
});
