import express, { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import * as subscriptionController from "../controllers/subscriptionController";
import {
  createSubscriptionSchema,
  subscriptionIdParamsSchema,
  subscriptionListQuerySchema,
  subscriptionStatusSchema,
  updateSubscriptionSchema,
} from "../validations/subscriptionValidation";

const router: Router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(createSubscriptionSchema),
  subscriptionController.createSubscription,
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(subscriptionListQuerySchema),
  subscriptionController.getSubscriptions,
);

router.get(
  "/:subscriptionId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(subscriptionIdParamsSchema),
  subscriptionController.getSubscriptionById,
);

router.put(
  "/:subscriptionId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(updateSubscriptionSchema),
  subscriptionController.updateSubscription,
);

router.patch(
  "/:subscriptionId/status",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(subscriptionStatusSchema),
  subscriptionController.updateSubscriptionStatus,
);

router.delete(
  "/:subscriptionId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(subscriptionIdParamsSchema),
  subscriptionController.deleteSubscription,
);

export default router;
