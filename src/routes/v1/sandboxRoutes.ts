import { Router } from 'express';
import { PurchaseController } from '../../controllers/v1/purchaseController';
import { UsageController } from '../../controllers/v1/usageController';
import { WebhookController } from '../../controllers/v1/webhookController';
import { BotController } from '../../controllers/v1/botController';
import { metricsMiddleware } from '../../middleware/metricsMiddleware';
import { Request, Response, NextFunction } from 'express';
import { BotTier } from '../../entities/BotCredential';

const router = Router();

// Initialize controllers
const purchaseController = new PurchaseController();
const usageController = new UsageController();
const webhookController = new WebhookController();
const botController = new BotController();

// Mock middleware to attach a test bot to the request
const attachSandboxBot = (req: Request, res: Response, next: NextFunction) => {
  // Check for sandbox mode header
  const sandboxMode = req.header('X-Sandbox-Mode') || 'demo';
  
  // Attach sandbox bot to request
  req.bot = {
    id: `sandbox-bot-${sandboxMode}`,
    name: `Sandbox ${sandboxMode.charAt(0).toUpperCase() + sandboxMode.slice(1)} Bot`,
    tier: BotTier.PREMIUM,
    creditsRemaining: 9999,
    usageToday: 0
  };
  
  // Add sandbox header to response
  res.setHeader('X-Sandbox-Mode', sandboxMode);
  
  next();
};

/**
 * Sandbox Routes
 * These routes mimic the production API but don't require authentication
 * and don't affect real data. They're perfect for testing and development.
 */

// Purchase routes
router.post('/purchase-credits', attachSandboxBot, metricsMiddleware, purchaseController.purchaseCredits);
router.get('/invoices/:invoiceId', attachSandboxBot, metricsMiddleware, purchaseController.getInvoice);
router.get('/invoices', attachSandboxBot, metricsMiddleware, purchaseController.getInvoices);

// Usage routes
router.get('/usage', attachSandboxBot, metricsMiddleware, usageController.getUsage);
router.get('/usage/history', attachSandboxBot, metricsMiddleware, usageController.getUsageHistory);
router.get('/usage/endpoints', attachSandboxBot, metricsMiddleware, usageController.getEndpointUsage);

// Webhook routes
router.post('/webhooks', attachSandboxBot, metricsMiddleware, webhookController.registerWebhook);
router.get('/webhooks', attachSandboxBot, metricsMiddleware, webhookController.getWebhooks);
router.delete('/webhooks/:webhookId', attachSandboxBot, metricsMiddleware, webhookController.deleteWebhook);
router.post('/webhooks/:webhookId/test', attachSandboxBot, metricsMiddleware, webhookController.testWebhook);

// Bot routes
router.get('/bot', attachSandboxBot, metricsMiddleware, botController.getBotInfo);
router.post('/bot/rotate-api-key', attachSandboxBot, metricsMiddleware, botController.rotateApiKey);
router.put('/bot/tier', attachSandboxBot, metricsMiddleware, botController.updateBotTier);

export default router;
