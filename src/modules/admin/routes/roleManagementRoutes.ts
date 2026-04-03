import express, { Router } from "express";
import {
  authenticate,
  authorizeModuleAction,
} from "../../../middlewares/authMiddleware";
import { validate } from "../../../middlewares/validateMiddleware";
import { paginationWithSearchQuerySchema } from "../validations/paginationValidation";
import {
  createRoleSchema,
  roleIdParamsSchema,
  updateRoleSchema,
  updateRoleStatusSchema,
} from "../validations/roleManagementValidation";
import * as roleController from "../controllers/roleManagementController";

const router: Router = express.Router();

router.get(
  "/permission-modules",
  authenticate,
  roleController.getPermissionModules,
);

router.post(
  "/",
  authenticate,
  authorizeModuleAction("admin_users", "add"),
  validate(createRoleSchema),
  roleController.createRole,
);

router.get(
  "/",
  authenticate,
  authorizeModuleAction("admin_users", "view"),
  validate(paginationWithSearchQuerySchema),
  roleController.getAllRoles,
);

router.get(
  "/:roleId",
  authenticate,
  authorizeModuleAction("admin_users", "view"),
  validate(roleIdParamsSchema),
  roleController.getRoleById,
);

router.patch(
  "/:roleId",
  authenticate,
  authorizeModuleAction("admin_users", "edit"),
  validate(updateRoleSchema),
  roleController.updateRole,
);

router.patch(
  "/:roleId/status",
  authenticate,
  authorizeModuleAction("admin_users", "edit"),
  validate(updateRoleStatusSchema),
  roleController.updateRoleStatus,
);

router.delete(
  "/:roleId",
  authenticate,
  authorizeModuleAction("admin_users", "delete"),
  validate(roleIdParamsSchema),
  roleController.deleteRole,
);

export default router;
