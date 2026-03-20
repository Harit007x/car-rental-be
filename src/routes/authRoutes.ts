import express, { Router } from "express";
import { validate } from "../middlewares/validateMiddleware";
import {
  superAdminRegisterSchema,
  governmentAdminRegisterSchema,
  loginSchema,
  refreshSchema,
} from "../validations/authValidation";
import * as authController from "../controllers/authController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { tenantContext } from "../middlewares/tenantResolutionMiddleware";

const router: Router = express.Router();

/**
 * @openapi
 * /auth/register-super-admin:
 *   post:
 *     summary: Register the super admin (one-time setup)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Super admin registered successfully
 *       409:
 *         description: Super admin already exists
 */
router.post(
  "/register-super-admin",
  validate(superAdminRegisterSchema),
  authController.registerSuperAdmin
);

/**
 * @openapi
 * /auth/register-government-admin:
 *   post:
 *     summary: Register a government admin (super admin only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Government admin registered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a SUPER_ADMIN)
 *       409:
 *         description: Email already in use
 */
router.post(
  "/register-government-admin",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(governmentAdminRegisterSchema),
  authController.registerGovernmentAdmin
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login for all user roles
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid email or password
 */
router.post(
  "/login",
  tenantContext(),
  validate(loginSchema),
  authController.login
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  "/refresh",
  tenantContext(),
  validate(refreshSchema),
  authController.refresh
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", validate(refreshSchema), authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get("/me", authenticate, tenantContext(), authController.me);

export default router;
