import express, { Router } from 'express';
import { validate } from '../middlewares/validateMiddleware';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { tenantContext } from "../middlewares/tenantResolutionMiddleware";
import { createVehicleSchema } from '../validations/vehicleValidation';
import * as vehicleController from '../controllers/vehicleController';

const router: Router = express.Router();

/**
 * @openapi
 * /api/vehicles:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Add a new vehicle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleInput'
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a tenant admin or missing tenantId)
 */
router.post(
  '/',
  authenticate,
  authorize('RENTAL_ADMIN'),
  tenantContext({ required: true }),
  validate(createVehicleSchema),
  vehicleController.createVehicle
);

/**
 * @openapi
 * /api/vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get all vehicles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vehicles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  authenticate,
  authorize('RENTAL_ADMIN', 'DELIVERY_PARTNER'),
  tenantContext({ required: true }),
  vehicleController.getAllVehicles
);

export default router;
