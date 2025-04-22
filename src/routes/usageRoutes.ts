/**
 * Usage Routes
 * Routes for API usage tracking and reporting
 */

import { Router } from 'express';
import { getUsage } from '../controllers/usageController';
import { apiKeyAuth } from '../middleware/authMiddleware';
import { trackApiUsage } from '../middleware/rateLimitMiddleware';

const router = Router();

/**
 * GET /usage
 * Get bot usage statistics
 */
router.get('/usage', apiKeyAuth, trackApiUsage, getUsage);

export default router;
