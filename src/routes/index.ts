import express, { Router } from "express";
import adminRoutes from "../modules/admin/routes";
import governmentAuthRoutes from "../modules/government/routes";

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

router.use("/admin", adminRoutes);
router.use("/government", governmentAuthRoutes);

export default router;
