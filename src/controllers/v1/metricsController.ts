import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../services/metricsService';

/**
 * Metrics Controller
 * Handles Prometheus metrics collection and reporting
 */
export class MetricsController {
  private metricsService: MetricsService;

  constructor() {
    this.metricsService = MetricsService.getInstance();
  }

  /**
   * Get metrics in Prometheus format
   * @swagger
   * /v1/metrics:
   *   get:
   *     summary: Get Prometheus metrics
   *     tags: [Metrics]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Metrics retrieved successfully
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *       401:
   *         description: Authentication failed
   */
  getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get metrics in Prometheus format
      const metrics = await this.metricsService.getMetrics();
      
      // Set content type for Prometheus
      res.setHeader('Content-Type', 'text/plain');
      
      return res.status(200).send(metrics);
    } catch (error) {
      next(error);
    }
  };
}
