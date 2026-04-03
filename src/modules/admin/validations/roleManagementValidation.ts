import { z } from "zod";

const permissionSchema = z.object({
  moduleId: z.string().uuid(),
  canView: z.boolean().optional(),
  canAdd: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export const roleIdParamsSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    permissions: z.array(permissionSchema).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(2).optional(),
      permissions: z.array(permissionSchema).optional(),
    })
    .refine(
      (value) =>
        typeof value.name !== "undefined" ||
        typeof value.permissions !== "undefined",
      {
        message: "At least one field is required",
      },
    ),
});

export const updateRoleStatusSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
});
