import express, { Router } from "express";
import {
  authenticate,
  authorizeModuleAction,
} from "../../../middlewares/authMiddleware";
import { validate } from "../../../middlewares/validateMiddleware";
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
  authorizeModuleAction("government_users", "add"),
  validate(createGovernmentUserSchema),
  governmentUserController.createGovernmentUser,
);

router.get(
  "/",
  authenticate,
  authorizeModuleAction("government_users", "view"),
  validate(listQuerySchema),
  governmentUserController.getGovernmentUsers,
);

router.get(
  "/:userId",
  authenticate,
  authorizeModuleAction("government_users", "view"),
  validate(governmentUserIdParamsSchema),
  governmentUserController.getGovernmentUserById,
);

router.put(
  "/:userId",
  authenticate,
  authorizeModuleAction("government_users", "edit"),
  validate(updateGovernmentUserSchema),
  governmentUserController.updateGovernmentUser,
);

router.patch(
  "/:userId/status",
  authenticate,
  authorizeModuleAction("government_users", "edit"),
  validate(governmentUserStatusSchema),
  governmentUserController.updateGovernmentUserStatus,
);

router.delete(
  "/:userId",
  authenticate,
  authorizeModuleAction("government_users", "delete"),
  validate(governmentUserIdParamsSchema),
  governmentUserController.deleteGovernmentUser,
);

export default router;
