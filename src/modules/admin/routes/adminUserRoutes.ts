import express, { Router } from "express";
import { validate } from "../../../middlewares/validateMiddleware";
import { superAdminRegisterSchema } from "../../auth/validations/authValidation";
import { adminProfileUpdateSchema } from "../validations/adminProfileValidation";
import { paginationWithSearchQuerySchema } from "../validations/paginationValidation";
import {
  adminStatusSchema,
  adminIdParamsSchema,
  createAdminSchema,
  updateAdminSchema,
} from "../validations/adminUserValidation";
import * as adminController from "../controllers/adminUserController";
import {
  authenticate,
  requireSuperAdmin,
  authorizeModuleAction,
} from "../../../middlewares/authMiddleware";

const router: Router = express.Router();

router.post(
  "/register",
  validate(superAdminRegisterSchema),
  adminController.registerSuperAdmin,
);

router.get("/me", authenticate, adminController.me);

router.put(
  "/profile",
  authenticate,
  requireSuperAdmin(),
  validate(adminProfileUpdateSchema),
  adminController.updateProfile,
);

router.post(
  "/users",
  authenticate,
  authorizeModuleAction("admin_users", "add"),
  validate(createAdminSchema),
  adminController.createAdmin,
);

router.get(
  "/users",
  authenticate,
  authorizeModuleAction("admin_users", "view"),
  validate(paginationWithSearchQuerySchema),
  adminController.getAllAdmins,
);

router.get(
  "/users/:adminId",
  authenticate,
  authorizeModuleAction("admin_users", "view"),
  validate(adminIdParamsSchema),
  adminController.getAdminById,
);

router.put(
  "/users/:adminId",
  authenticate,
  authorizeModuleAction("admin_users", "edit"),
  validate(updateAdminSchema),
  adminController.updateAdmin,
);

router.patch(
  "/users/:adminId/status",
  authenticate,
  authorizeModuleAction("admin_users", "edit"),
  validate(adminStatusSchema),
  adminController.updateAdminStatus,
);

router.delete(
  "/users/:adminId",
  authenticate,
  authorizeModuleAction("admin_users", "delete"),
  validate(adminIdParamsSchema),
  adminController.deleteAdmin,
);

export default router;
