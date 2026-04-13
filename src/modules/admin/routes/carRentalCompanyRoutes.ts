import express, { Router } from "express";
import {
  authenticate,
  authorizeModuleAction,
} from "../../../middlewares/authMiddleware";
import { validate } from "../../../middlewares/validateMiddleware";
import * as carRentalCompanyController from "../controllers/carRentalCompanyController";
import {
  carRentalCompanyIdParamsSchema,
  carRentalCompanyListQuerySchema,
  carRentalCompanyStatusSchema,
  createCarRentalCompanySchema,
  updateCarRentalCompanySchema,
} from "../validations/carRentalCompanyValidation";

const router: Router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeModuleAction("car_rental_companies", "add"),
  validate(createCarRentalCompanySchema),
  carRentalCompanyController.createCarRentalCompany,
);

router.get(
  "/",
  authenticate,
  authorizeModuleAction("car_rental_companies", "view"),
  validate(carRentalCompanyListQuerySchema),
  carRentalCompanyController.getCarRentalCompanies,
);

router.get(
  "/:companyId",
  authenticate,
  authorizeModuleAction("car_rental_companies", "view"),
  validate(carRentalCompanyIdParamsSchema),
  carRentalCompanyController.getCarRentalCompanyById,
);

router.put(
  "/:companyId",
  authenticate,
  authorizeModuleAction("car_rental_companies", "edit"),
  validate(updateCarRentalCompanySchema),
  carRentalCompanyController.updateCarRentalCompany,
);

router.patch(
  "/:companyId/status",
  authenticate,
  authorizeModuleAction("car_rental_companies", "edit"),
  validate(carRentalCompanyStatusSchema),
  carRentalCompanyController.updateCarRentalCompanyStatus,
);

router.delete(
  "/:companyId",
  authenticate,
  authorizeModuleAction("car_rental_companies", "delete"),
  validate(carRentalCompanyIdParamsSchema),
  carRentalCompanyController.deleteCarRentalCompany,
);

export default router;
