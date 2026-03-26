import express, { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import * as governmentUserController from "../controllers/governmentUserController";
import {
  createGovernmentUserSchema,
  governmentUserIdParamsSchema,
  governmentUserStatusSchema,
  updateGovernmentUserSchema,
} from "../validations/governmentUserValidation";
import { listQuerySchema } from "../validations/listQueryValidation";

const router: Router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(createGovernmentUserSchema),
  governmentUserController.createGovernmentUser,
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(listQuerySchema),
  governmentUserController.getGovernmentUsers,
);

router.get(
  "/:userId",
  authenticate,
  authorize("SUPER_ADMIN", "GOVERNMENT_ADMIN"),
  validate(governmentUserIdParamsSchema),
  governmentUserController.getGovernmentUserById,
);

router.put(
  "/:userId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(updateGovernmentUserSchema),
  governmentUserController.updateGovernmentUser,
);

router.patch(
  "/:userId/status",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(governmentUserStatusSchema),
  governmentUserController.updateGovernmentUserStatus,
);

router.delete(
  "/:userId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(governmentUserIdParamsSchema),
  governmentUserController.deleteGovernmentUser,
);

export default router;
