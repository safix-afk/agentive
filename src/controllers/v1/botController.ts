import { Request, Response, NextFunction } from 'express';
import { BotCredentialService } from '../../services/botCredentialService';
import { MetricsService } from '../../services/metricsService';
import { ApiError } from '../../middleware/errorHandlerMiddleware';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BotTier } from '../../entities/BotCredential';

// DTO for bot creation request
class CreateBotDto {
  name!: string;
  tier?: BotTier;
}

/**
 * Bot Controller
 * Handles bot management operations
 */
export class BotController {
  private botService: BotCredentialService;
  private metricsService: MetricsService;

  constructor() {
    this.botService = new BotCredentialService();
    this.metricsService = MetricsService.getInstance();
  }

  /**
   * Get bot information
   * @swagger
   * /v1/bot:
   *   get:
   *     summary: Get bot information
   *     tags: [Bot]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Bot information retrieved successfully
   *       401:
   *         description: Authentication failed
   */
  getBotInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Get bot information
      const bot = await this.botService.getBotById(req.bot.id);
      
      if (!bot) {
        throw new ApiError(
          'Bot not found',
          404,
          'BOT_NOT_FOUND'
        );
      }
      
      // Return bot information (excluding sensitive fields)
      return res.status(200).json({
        success: true,
        bot: {
          id: bot.id,
          name: bot.name,
          tier: bot.tier,
          createdAt: bot.createdAt,
          lastLoginAt: bot.lastLoginAt,
          lastApiKeyRotatedAt: bot.lastApiKeyRotatedAt,
          creditBalance: {
            creditsRemaining: bot.creditBalance.creditsRemaining,
            totalCreditsPurchased: bot.creditBalance.totalCreditsPurchased,
            totalCreditsUsed: bot.creditBalance.totalCreditsUsed,
            usageToday: bot.creditBalance.usageToday,
            dailyLimit: bot.creditBalance.dailyLimit,
            resetDate: bot.creditBalance.resetDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Rotate API key
   * @swagger
   * /v1/bot/rotate-api-key:
   *   post:
   *     summary: Rotate API key
   *     tags: [Bot]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: API key rotated successfully
   *       401:
   *         description: Authentication failed
   */
  rotateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Rotate API key
      const result = await this.botService.rotateApiKey(req.bot.id);
      
      if (!result) {
        throw new ApiError(
          'Failed to rotate API key',
          500,
          'API_KEY_ROTATION_FAILED'
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'API key rotated successfully',
        apiKey: result.apiKey
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new bot
   * @swagger
   * /v1/bot:
   *   post:
   *     summary: Create a new bot
   *     tags: [Bot]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: Bot name
   *                 example: My Bot
   *               tier:
   *                 type: string
   *                 enum: [free, premium, enterprise]
   *                 description: Bot tier
   *                 example: free
   *     responses:
   *       201:
   *         description: Bot created successfully
   *       400:
   *         description: Invalid request parameters
   */
  createBot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const createBotDto = plainToInstance(CreateBotDto, req.body);
      const errors = await validate(createBotDto);
      
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
      
      const { name, tier } = createBotDto;
      
      // Create bot
      const bot = await this.botService.createBot(name, tier);
      
      // Update metrics
      this.metricsService.setActiveBotsGauge(tier || 'free', 1);
      
      return res.status(201).json({
        success: true,
        message: 'Bot created successfully',
        bot: {
          id: bot.id,
          name: bot.name,
          tier: bot.tier,
          apiKey: bot.apiKey,
          createdAt: bot.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update bot tier
   * @swagger
   * /v1/bot/tier:
   *   put:
   *     summary: Update bot tier
   *     tags: [Bot]
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tier
   *             properties:
   *               tier:
   *                 type: string
   *                 enum: [free, premium, enterprise]
   *                 description: New bot tier
   *                 example: premium
   *     responses:
   *       200:
   *         description: Bot tier updated successfully
   *       401:
   *         description: Authentication failed
   *       400:
   *         description: Invalid request parameters
   */
  updateBotTier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tier } = req.body;
      
      // Validate tier
      if (!tier || !Object.values(BotTier).includes(tier as BotTier)) {
        throw new ApiError(
          'Invalid tier',
          400,
          'INVALID_TIER',
          {
            validTiers: Object.values(BotTier)
          }
        );
      }
      
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Update bot tier
      const updatedBot = await this.botService.updateBotTier(req.bot.id, tier as BotTier);
      
      if (!updatedBot) {
        throw new ApiError(
          'Failed to update bot tier',
          500,
          'BOT_UPDATE_FAILED'
        );
      }
      
      // Update metrics
      this.metricsService.setActiveBotsGauge(tier, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Bot tier updated successfully',
        bot: {
          id: updatedBot.id,
          name: updatedBot.name,
          tier: updatedBot.tier,
          dailyLimit: updatedBot.creditBalance.dailyLimit
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deactivate bot
   * @swagger
   * /v1/bot:
   *   delete:
   *     summary: Deactivate bot
   *     tags: [Bot]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Bot deactivated successfully
   *       401:
   *         description: Authentication failed
   */
  deactivateBot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Deactivate bot
      const success = await this.botService.deactivateBot(req.bot.id);
      
      if (!success) {
        throw new ApiError(
          'Failed to deactivate bot',
          500,
          'BOT_DEACTIVATION_FAILED'
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'Bot deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
