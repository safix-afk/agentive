import { Router } from 'express';
import purchaseRoutes from './purchaseRoutes';
import usageRoutes from './usageRoutes';
import webhookRoutes from './webhookRoutes';
import metricsRoutes from './metricsRoutes';
import botRoutes from './botRoutes';

const router = Router();

// Mount v1 routes
router.use(purchaseRoutes);
router.use(usageRoutes);
router.use(webhookRoutes);
router.use(metricsRoutes);
router.use(botRoutes);

export default router;
