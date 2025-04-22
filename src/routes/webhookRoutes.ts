/**
 * Webhook Routes
 * Routes for webhook registration and management
 */

import { Router } from 'express';
import { registerWebhook, testWebhook } from '../controllers/webhookController';
import { apiKeyAuth } from '../middleware/authMiddleware';
import { trackApiUsage } from '../middleware/rateLimitMiddleware';

const router = Router();

/**
 * POST /webhooks/:botId
 * Register a webhook URL for a bot
 */
router.post('/webhooks/:botId', apiKeyAuth, trackApiUsage, registerWebhook);

/**
 * POST /webhooks/:botId/test
 * Send a test webhook event
 */
router.post('/webhooks/:botId/test', apiKeyAuth, trackApiUsage, testWebhook);

export default router;
