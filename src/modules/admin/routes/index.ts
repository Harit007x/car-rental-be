import express, { Router } from "express";
import adminUserRoutes from "./adminUserRoutes";
import governmentUserRoutes from "./governmentUserRoutes";
import subscriptionRoutes from "./subscriptionRoutes";
import cmsPageRoutes from "./cmsPageRoutes";
import adminAuthRoutes from "./adminAuthRoutes";
import carRentalCompanyRoutes from "./carRentalCompanyRoutes";
import roleManagementRoutes from "./roleManagementRoutes";

const router: Router = express.Router();

router.use("/auth", adminAuthRoutes);
router.use("/", adminUserRoutes);
router.use("/government-users", governmentUserRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/cms-pages", cmsPageRoutes);
router.use("/car-rental-companies", carRentalCompanyRoutes);
router.use("/roles", roleManagementRoutes);

export default router;
