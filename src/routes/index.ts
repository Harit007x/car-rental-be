import express from 'express';
import vehicleRoutes from './vehicleRoutes';

const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/vehicles', vehicleRoutes);

export default router;
