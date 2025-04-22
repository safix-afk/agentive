import { Router } from 'express';
import { PurchaseController } from '../../controllers/v1/purchaseController';
import { apiKeyAuth, checkCredits } from '../../middleware/securityMiddleware';
import { metricsMiddleware } from '../../middleware/metricsMiddleware';

const router = Router();
const purchaseController = new PurchaseController();

/**
 * POST /v1/purchase-credits
 * Purchase credits for a bot
 */
router.post(
  '/purchase-credits',
  apiKeyAuth,
  metricsMiddleware,
  purchaseController.purchaseCredits
);

/**
 * GET /v1/invoices/:invoiceId
 * Get invoice details
 */
router.get(
  '/invoices/:invoiceId',
  apiKeyAuth,
  metricsMiddleware,
  purchaseController.getInvoice
);

/**
 * GET /v1/invoices
 * Get all invoices for a bot
 */
router.get(
  '/invoices',
  apiKeyAuth,
  metricsMiddleware,
  purchaseController.getInvoices
);

export default router;
