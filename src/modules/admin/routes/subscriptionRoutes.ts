import express, { Router } from "express";
import {
  authenticate,
  authorizeModuleAction,
} from "../../../middlewares/authMiddleware";
import { validate } from "../../../middlewares/validateMiddleware";
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
  authorizeModuleAction("subscriptions", "add"),
  validate(createSubscriptionSchema),
  subscriptionController.createSubscription,
);

router.get(
  "/",
  authenticate,
  authorizeModuleAction("subscriptions", "view"),
  validate(subscriptionListQuerySchema),
  subscriptionController.getSubscriptions,
);

router.get(
  "/:subscriptionId",
  authenticate,
  authorizeModuleAction("subscriptions", "view"),
  validate(subscriptionIdParamsSchema),
  subscriptionController.getSubscriptionById,
);

router.put(
  "/:subscriptionId",
  authenticate,
  authorizeModuleAction("subscriptions", "edit"),
  validate(updateSubscriptionSchema),
  subscriptionController.updateSubscription,
);

router.patch(
  "/:subscriptionId/status",
  authenticate,
  authorizeModuleAction("subscriptions", "edit"),
  validate(subscriptionStatusSchema),
  subscriptionController.updateSubscriptionStatus,
);

router.delete(
  "/:subscriptionId",
  authenticate,
  authorizeModuleAction("subscriptions", "delete"),
  validate(subscriptionIdParamsSchema),
  subscriptionController.deleteSubscription,
);

export default router;
