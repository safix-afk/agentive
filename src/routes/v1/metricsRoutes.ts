import { Router } from 'express';
import { MetricsController } from '../../controllers/v1/metricsController';
import { apiKeyAuth } from '../../middleware/securityMiddleware';

const router = Router();
const metricsController = new MetricsController();

/**
 * GET /v1/metrics
 * Get Prometheus metrics
 */
router.get(
  '/metrics',
  apiKeyAuth, // Restrict metrics access to authenticated users
  metricsController.getMetrics
);

export default router;
