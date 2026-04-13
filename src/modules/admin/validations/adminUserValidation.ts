import { z } from "zod";

const permissionSchema = z.object({
  moduleId: z.string().uuid(),
  canView: z.boolean(),
  canAdd: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
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
    roleId: z.string().uuid(),
    permissions: z.array(permissionSchema),
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
      roleId: z.string().uuid().nullable().optional(),
      permissions: z.array(permissionSchema).optional(),
    })
    .partial(),
});

export const adminStatusSchema = z.object({
  params: z.object({
    adminId: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});
