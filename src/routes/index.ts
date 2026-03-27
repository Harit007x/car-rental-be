import express, { Router } from "express";
import authRoutes from "./authRoutes";
import superAdminAuthRoutes from "./superAdminAuthRoutes";
import tenantRoutes from "./tenantRoutes";
import vehicleRoutes from "./vehicleRoutes";
import governmentUserRoutes from "./governmentUserRoutes";
import subscriptionRoutes from "./subscriptionRoutes";
import cmsPageRoutes from "./cmsPageRoutes";

const router: Router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/health", (req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/super-admin", superAdminAuthRoutes);
router.use("/tenants", tenantRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/government-users", governmentUserRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/cms-pages", cmsPageRoutes);

export default router;
