import { Router } from 'express';
import { BotController } from '../../controllers/v1/botController';
import { apiKeyAuth } from '../../middleware/securityMiddleware';
import { metricsMiddleware } from '../../middleware/metricsMiddleware';

const router = Router();
const botController = new BotController();

/**
 * GET /v1/bot
 * Get bot information
 */
router.get(
  '/bot',
  apiKeyAuth,
  metricsMiddleware,
  botController.getBotInfo
);

/**
 * POST /v1/bot
 * Create a new bot
 */
router.post(
  '/bot',
  metricsMiddleware,
  botController.createBot
);

/**
 * POST /v1/bot/rotate-api-key
 * Rotate API key
 */
router.post(
  '/bot/rotate-api-key',
  apiKeyAuth,
  metricsMiddleware,
  botController.rotateApiKey
);

/**
 * PUT /v1/bot/tier
 * Update bot tier
 */
router.put(
  '/bot/tier',
  apiKeyAuth,
  metricsMiddleware,
  botController.updateBotTier
);

/**
 * DELETE /v1/bot
 * Deactivate bot
 */
router.delete(
  '/bot',
  apiKeyAuth,
  metricsMiddleware,
  botController.deactivateBot
);

export default router;
