import express, { Router } from "express";
import { validate } from "../middlewares/validateMiddleware";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import {
  onboardTenantSchema,
  tenantIdParamsSchema,
  tenantDataParamsSchema,
  tenantProfileUpdateSchema,
  tenantStatusSchema,
} from "../validations/tenantValidation";
import { listQuerySchema } from "../validations/listQueryValidation";
import * as tenantController from "../controllers/tenantController";
import { tenantContext } from "../middlewares/tenantResolutionMiddleware";

const router: Router = express.Router();

/**
 * @openapi
 * /api/tenants:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: Get all tenants
 *     description: Only accessible by SUPER_ADMIN or GOVERNMENT_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenants fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(listQuerySchema),
  tenantController.getAllTenants,
);

/**
 * @openapi
 * /api/tenants/{subdomain}/data:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: Get all tenant data by subdomain
 *     description: Only accessible by SUPER_ADMIN or GOVERNMENT_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant subdomain
 *     responses:
 *       200:
 *         description: Tenant data fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tenant not found
 */
router.get(
  "/:subdomain/data",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(tenantDataParamsSchema),
  tenantController.getTenantData,
);

/**
 * @openapi
 * /api/tenants:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Onboard a new tenant and provision their database schema
 *     description: Only accessible by SUPER_ADMIN. Creates the tenant in the global database, creates their initial RENTAL_ADMIN user, and provisions their dedicated PostgreSQL schema.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - registrationNumber
 *               - ownerName
 *               - ownerPhone
 *               - ownerEmail
 *               - subdomain
 *               - businessAddress
 *               - city
 *               - state
 *               - country
 *               - businessType
 *               - fleetSize
 *               - adminPassword
 *             # (Omitted full Swagger schema for brevity, relying on Zod validation primarily)
 *     responses:
 *       201:
 *         description: Tenant successfully onboarded
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a SUPER_ADMIN)
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Schema provisioning failed
 */
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(onboardTenantSchema),
  tenantController.onboardTenant,
);

router.put(
  "/profile",
  authenticate,
  authorize("RENTAL_ADMIN"),
  tenantContext({ required: true }),
  validate(tenantProfileUpdateSchema),
  tenantController.updateTenantProfile,
);

router.patch(
  "/:tenantId/status",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(tenantStatusSchema),
  tenantController.updateTenantStatus,
);

router.delete(
  "/:tenantId",
  authenticate,
  authorize("SUPER_ADMIN"),
  validate(tenantIdParamsSchema),
  tenantController.deleteTenant,
);

export default router;
