/**
 * Purchase Routes
 * Routes for credit purchase operations
 */

import { Router } from 'express';
import { purchaseCredits } from '../controllers/purchaseController';
import { apiKeyAuth, checkCredits } from '../middleware/authMiddleware';
import { trackApiUsage } from '../middleware/rateLimitMiddleware';

const router = Router();

/**
 * POST /purchase-credits
 * Purchase credits for a bot
 */
router.post('/purchase-credits', apiKeyAuth, trackApiUsage, purchaseCredits);

export default router;
