import express from 'express';
import { validate } from '../middlewares/validateMiddleware';
import { createVehicleSchema } from '../validations/vehicleValidation';
import * as vehicleController from '../controllers/vehicleController';

const router = express.Router();

/**
 * @openapi
 * /vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, make, model, year, regNumber, category]
 *             properties:
 *               name: { type: string }
 *               make: { type: string }
 *               model: { type: string }
 *               year: { type: number }
 *               regNumber: { type: string }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 */
router.post('/', validate(createVehicleSchema), vehicleController.createVehicle);

/**
 * @openapi
 * /vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehiles]
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get('/', vehicleController.getAllVehicles);

export default router;
