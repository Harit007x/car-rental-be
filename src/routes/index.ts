import express, { Router } from "express";
import authRoutes from "./authRoutes";
import tenantRoutes from "./tenantRoutes";
import vehicleRoutes from "./vehicleRoutes";

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
router.use("/tenants", tenantRoutes);
router.use("/vehicles", vehicleRoutes);

export default router;
