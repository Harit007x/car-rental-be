import express, { Router } from "express";
import {
  authenticate,
  authorizeModuleAction,
} from "../../../middlewares/authMiddleware";
import { validate } from "../../../middlewares/validateMiddleware";
import * as cmsPageController from "../controllers/cmsPageController";
import { paginationQuerySchema } from "../validations/paginationValidation";
import {
  cmsPageIdParamsSchema,
  createCmsPageSchema,
  updateCmsPageSchema,
} from "../validations/cmsPageValidation";

const router: Router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeModuleAction("cms_pages", "add"),
  validate(createCmsPageSchema),
  cmsPageController.createCmsPage,
);

router.get(
  "/",
  authenticate,
  authorizeModuleAction("cms_pages", "view"),
  validate(paginationQuerySchema),
  cmsPageController.getCmsPages,
);

router.get(
  "/:pageId",
  authenticate,
  authorizeModuleAction("cms_pages", "view"),
  validate(cmsPageIdParamsSchema),
  cmsPageController.getCmsPageById,
);

router.put(
  "/:pageId",
  authenticate,
  authorizeModuleAction("cms_pages", "edit"),
  validate(updateCmsPageSchema),
  cmsPageController.updateCmsPage,
);

router.delete(
  "/:pageId",
  authenticate,
  authorizeModuleAction("cms_pages", "delete"),
  validate(cmsPageIdParamsSchema),
  cmsPageController.deleteCmsPage,
);

export default router;
