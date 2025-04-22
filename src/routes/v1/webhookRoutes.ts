import { Router } from 'express';
import { WebhookController } from '../../controllers/v1/webhookController';
import { apiKeyAuth } from '../../middleware/securityMiddleware';
import { metricsMiddleware } from '../../middleware/metricsMiddleware';

const router = Router();
const webhookController = new WebhookController();

/**
 * POST /v1/webhooks
 * Register a webhook URL for a bot
 */
router.post(
  '/webhooks',
  apiKeyAuth,
  metricsMiddleware,
  webhookController.registerWebhook
);

/**
 * GET /v1/webhooks
 * Get all webhooks for a bot
 */
router.get(
  '/webhooks',
  apiKeyAuth,
  metricsMiddleware,
  webhookController.getWebhooks
);

/**
 * DELETE /v1/webhooks/:webhookId
 * Delete a webhook
 */
router.delete(
  '/webhooks/:webhookId',
  apiKeyAuth,
  metricsMiddleware,
  webhookController.deleteWebhook
);

/**
 * POST /v1/webhooks/:webhookId/test
 * Test a webhook
 */
router.post(
  '/webhooks/:webhookId/test',
  apiKeyAuth,
  metricsMiddleware,
  webhookController.testWebhook
);

export default router;
