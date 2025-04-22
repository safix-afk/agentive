import { Router } from 'express';
import { UsageController } from '../../controllers/v1/usageController';
import { apiKeyAuth } from '../../middleware/securityMiddleware';
import { metricsMiddleware } from '../../middleware/metricsMiddleware';

const router = Router();
const usageController = new UsageController();

/**
 * GET /v1/usage
 * Get bot usage statistics
 */
router.get(
  '/usage',
  apiKeyAuth,
  metricsMiddleware,
  usageController.getUsage
);

/**
 * GET /v1/usage/history
 * Get detailed usage history
 */
router.get(
  '/usage/history',
  apiKeyAuth,
  metricsMiddleware,
  usageController.getUsageHistory
);

/**
 * GET /v1/usage/endpoints
 * Get endpoint usage breakdown
 */
router.get(
  '/usage/endpoints',
  apiKeyAuth,
  metricsMiddleware,
  usageController.getEndpointUsage
);

export default router;
