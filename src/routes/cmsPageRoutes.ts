import express, { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import * as cmsPageController from "../controllers/cmsPageController";
import {
  cmsPageIdParamsSchema,
  cmsPageListQuerySchema,
  createCmsPageSchema,
  updateCmsPageSchema,
} from "../validations/cmsPageValidation";

const router: Router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(createCmsPageSchema),
  cmsPageController.createCmsPage,
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(cmsPageListQuerySchema),
  cmsPageController.getCmsPages,
);

router.get(
  "/:pageId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(cmsPageIdParamsSchema),
  cmsPageController.getCmsPageById,
);

router.put(
  "/:pageId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(updateCmsPageSchema),
  cmsPageController.updateCmsPage,
);

router.delete(
  "/:pageId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(cmsPageIdParamsSchema),
  cmsPageController.deleteCmsPage,
);

export default router;
