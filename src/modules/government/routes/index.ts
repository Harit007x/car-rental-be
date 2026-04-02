import express, { Router } from "express";
import { validate } from "../../../middlewares/validateMiddleware";
import {
  loginSchema,
  refreshSchema,
} from "../../auth/validations/authValidation";
import * as authController from "../controllers/authController";

const router: Router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(refreshSchema), authController.logout);

export default router;
