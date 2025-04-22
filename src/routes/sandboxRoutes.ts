/**
 * Sandbox Routes
 * Routes for testing API functionality without authentication or rate limits
 */

import { Router } from 'express';
import { purchaseCredits } from '../controllers/purchaseController';
import { getUsage } from '../controllers/usageController';
import { registerWebhook, testWebhook } from '../controllers/webhookController';

const router = Router();

// Mock middleware to attach a test bot to the request
const attachTestBot = (req: any, res: any, next: any) => {
  req.bot = {
    id: 'sandbox-bot-id',
    name: 'Sandbox Test Bot',
    tier: 'premium',
    creditsRemaining: 9999,
    usageToday: 0
  };
  next();
};

/**
 * @swagger
 * /sandbox/purchase-credits:
 *   post:
 *     summary: Purchase credits in sandbox mode (no authentication)
 *     tags: [Sandbox]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Number of credits to purchase
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Sandbox credits purchase simulation
 */
router.post('/purchase-credits', attachTestBot, purchaseCredits);

/**
 * @swagger
 * /sandbox/usage:
 *   get:
 *     summary: Get usage statistics in sandbox mode (no authentication)
 *     tags: [Sandbox]
 *     responses:
 *       200:
 *         description: Sandbox usage statistics
 */
router.get('/usage', attachTestBot, getUsage);

/**
 * @swagger
 * /sandbox/webhooks/{botId}:
 *   post:
 *     summary: Register a webhook URL in sandbox mode
 *     tags: [Sandbox]
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bot ID (can be any value in sandbox)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: url
 *                 description: Webhook URL to register
 *                 example: https://example.com/webhook
 *     responses:
 *       200:
 *         description: Sandbox webhook registration
 */
router.post('/webhooks/:botId', attachTestBot, registerWebhook);

/**
 * @swagger
 * /sandbox/webhooks/{botId}/test:
 *   post:
 *     summary: Test a webhook in sandbox mode
 *     tags: [Sandbox]
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bot ID (can be any value in sandbox)
 *     responses:
 *       200:
 *         description: Sandbox webhook test
 */
router.post('/webhooks/:botId/test', attachTestBot, testWebhook);

export default router;
