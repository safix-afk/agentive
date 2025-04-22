import { Request, Response, NextFunction } from 'express';
import { CreditService } from '../../services/creditService';
import { MetricsService } from '../../services/metricsService';
import { ApiError } from '../../middleware/errorHandlerMiddleware';

/**
 * Usage Controller
 * Handles API usage tracking and reporting
 */
export class UsageController {
  private creditService: CreditService;
  private metricsService: MetricsService;

  constructor() {
    this.creditService = new CreditService();
    this.metricsService = MetricsService.getInstance();
  }

  /**
   * Get usage statistics for a bot
   * @swagger
   * /v1/usage:
   *   get:
   *     summary: Get bot usage statistics
   *     tags: [Usage]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Usage statistics retrieved successfully
   *       401:
   *         description: Authentication failed
   *       404:
   *         description: Bot not found
   */
  getUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Get usage statistics
      const result = await this.creditService.getUsageStats(req.bot.id);
      
      if (!result.success) {
        throw new ApiError(
          result.error || 'Failed to retrieve usage statistics',
          result.error === 'Bot not found' ? 404 : 500,
          result.error === 'Bot not found' ? 'BOT_NOT_FOUND' : 'SERVER_ERROR'
        );
      }
      
      return res.status(200).json(result.stats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get detailed usage history
   * @swagger
   * /v1/usage/history:
   *   get:
   *     summary: Get detailed usage history
   *     tags: [Usage]
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for history (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for history (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Usage history retrieved successfully
   *       401:
   *         description: Authentication failed
   */
  getUsageHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Parse date parameters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      // Validate dates
      if (startDate && isNaN(startDate.getTime())) {
        throw new ApiError(
          'Invalid start date format',
          400,
          'INVALID_DATE_FORMAT'
        );
      }
      
      if (endDate && isNaN(endDate.getTime())) {
        throw new ApiError(
          'Invalid end date format',
          400,
          'INVALID_DATE_FORMAT'
        );
      }
      
      // Get usage history
      const history = await this.creditService.getUsageHistory(req.bot.id, startDate, endDate);
      
      return res.status(200).json({
        success: true,
        history
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get endpoint usage breakdown
   * @swagger
   * /v1/usage/endpoints:
   *   get:
   *     summary: Get endpoint usage breakdown
   *     tags: [Usage]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Endpoint usage retrieved successfully
   *       401:
   *         description: Authentication failed
   */
  getEndpointUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Get endpoint usage
      const endpointUsage = await this.creditService.getEndpointUsage(req.bot.id);
      
      return res.status(200).json({
        success: true,
        endpointUsage
      });
    } catch (error) {
      next(error);
    }
  };
}
