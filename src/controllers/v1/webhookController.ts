import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../../services/webhookService';
import { MetricsService } from '../../services/metricsService';
import { ApiError } from '../../middleware/errorHandlerMiddleware';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WebhookEventType } from '../../entities/WebhookSubscription';

// DTO for webhook registration request
class RegisterWebhookDto {
  url!: string;
  eventType?: WebhookEventType;
  description?: string;
}

/**
 * Webhook Controller
 * Handles webhook registration and management
 */
export class WebhookController {
  private webhookService: WebhookService;
  private metricsService: MetricsService;

  constructor() {
    this.webhookService = new WebhookService();
    this.metricsService = MetricsService.getInstance();
  }

  /**
   * Register a webhook URL for a bot
   * @swagger
   * /v1/webhooks:
   *   post:
   *     summary: Register a webhook URL for a bot
   *     tags: [Webhook]
   *     security:
   *       - ApiKeyAuth: []
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
   *               eventType:
   *                 type: string
   *                 enum: [all, purchase, usage, credit_update, error]
   *                 description: Event type to subscribe to
   *                 example: all
   *               description:
   *                 type: string
   *                 description: Optional description for the webhook
   *     responses:
   *       200:
   *         description: Webhook registered successfully
   *       401:
   *         description: Authentication failed
   *       400:
   *         description: Invalid request parameters
   */
  registerWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const webhookDto = plainToInstance(RegisterWebhookDto, req.body);
      const errors = await validate(webhookDto);
      
      if (errors.length > 0) {
        throw new ApiError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          errors.map(error => ({
            property: error.property,
            constraints: error.constraints
          }))
        );
      }
      
      const { url, eventType, description } = webhookDto;
      
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Register webhook
      const result = await this.webhookService.registerWebhook(
        req.bot.id,
        url,
        eventType,
        description
      );
      
      if (!result.success) {
        throw new ApiError(
          result.error || 'Failed to register webhook',
          400,
          'WEBHOOK_REGISTRATION_FAILED'
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'Webhook URL registered successfully',
        webhook: result.webhook
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all webhooks for a bot
   * @swagger
   * /v1/webhooks:
   *   get:
   *     summary: Get all webhooks for a bot
   *     tags: [Webhook]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Webhooks retrieved successfully
   *       401:
   *         description: Authentication failed
   */
  getWebhooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Get webhooks
      const result = await this.webhookService.getWebhooks(req.bot.id);
      
      if (!result.success) {
        throw new ApiError(
          result.error || 'Failed to retrieve webhooks',
          500,
          'SERVER_ERROR'
        );
      }
      
      return res.status(200).json({
        success: true,
        webhooks: result.webhooks
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a webhook
   * @swagger
   * /v1/webhooks/{webhookId}:
   *   delete:
   *     summary: Delete a webhook
   *     tags: [Webhook]
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: webhookId
   *         required: true
   *         schema:
   *           type: string
   *         description: Webhook ID
   *     responses:
   *       200:
   *         description: Webhook deleted successfully
   *       401:
   *         description: Authentication failed
   *       404:
   *         description: Webhook not found
   */
  deleteWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { webhookId } = req.params;
      
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Delete webhook
      const result = await this.webhookService.deleteWebhook(webhookId, req.bot.id);
      
      if (!result.success) {
        throw new ApiError(
          result.error || 'Failed to delete webhook',
          result.error === 'Webhook not found' ? 404 : 500,
          result.error === 'Webhook not found' ? 'WEBHOOK_NOT_FOUND' : 'SERVER_ERROR'
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test a webhook
   * @swagger
   * /v1/webhooks/{webhookId}/test:
   *   post:
   *     summary: Test a webhook
   *     tags: [Webhook]
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: webhookId
   *         required: true
   *         schema:
   *           type: string
   *         description: Webhook ID
   *     responses:
   *       200:
   *         description: Test webhook sent successfully
   *       401:
   *         description: Authentication failed
   *       404:
   *         description: Webhook not found
   */
  testWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { webhookId } = req.params;
      
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Test webhook
      const result = await this.webhookService.testWebhook(webhookId, req.bot.id);
      
      // Track metrics
      if (result.success) {
        this.metricsService.incrementWebhookDeliveryCounter('test', true);
      } else {
        this.metricsService.incrementWebhookFailureCounter('test', 'delivery_failed');
      }
      
      if (!result.success) {
        throw new ApiError(
          result.error || 'Failed to test webhook',
          result.error?.includes('not found') ? 404 : 500,
          result.error?.includes('not found') ? 'WEBHOOK_NOT_FOUND' : 'WEBHOOK_TEST_FAILED'
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'Test webhook sent successfully',
        result: result.result
      });
    } catch (error) {
      next(error);
    }
  };
}
