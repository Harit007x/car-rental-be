import express, { Router } from "express";
import adminUserRoutes from "./adminUserRoutes";
import governmentUserRoutes from "./governmentUserRoutes";
import subscriptionRoutes from "./subscriptionRoutes";
import cmsPageRoutes from "./cmsPageRoutes";
import adminAuthRoutes from "./adminAuthRoutes";

const router: Router = express.Router();

router.use("/auth", adminAuthRoutes);
router.use("/", adminUserRoutes);
router.use("/government-users", governmentUserRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/cms-pages", cmsPageRoutes);

export default router;
