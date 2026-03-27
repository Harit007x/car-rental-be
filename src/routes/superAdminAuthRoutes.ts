import express, { Router } from "express";
import { validate } from "../middlewares/validateMiddleware";
import { superAdminRegisterSchema } from "../validations/authValidation";
import { adminProfileUpdateSchema } from "../validations/adminProfileValidation";
import * as superAdminAuthController from "../controllers/superAdminAuthController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router: Router = express.Router();

router.post(
  "/register",
  validate(superAdminRegisterSchema),
  superAdminAuthController.registerSuperAdmin,
);

router.get(
  "/profile",
  authenticate,
  authorize("SUPER_ADMIN"),
  superAdminAuthController.getSuperAdminProfile,
);

router.put(
  "/profile",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(adminProfileUpdateSchema),
  superAdminAuthController.updateSuperAdminProfile,
);

export default router;
