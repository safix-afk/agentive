/**
 * Usage Controller
 * Handles API usage tracking and reporting
 */

import { Request, Response } from 'express';
import { credentialStore } from '../utils/credentialStore';

/**
 * @swagger
 * /usage:
 *   get:
 *     summary: Get bot usage statistics
 *     tags: [Usage]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 botId:
 *                   type: string
 *                   example: 123e4567-e89b-12d3-a456-426614174000
 *                 tier:
 *                   type: string
 *                   enum: [free, premium]
 *                   example: free
 *                 creditsUsedToday:
 *                   type: integer
 *                   example: 45
 *                 creditsRemaining:
 *                   type: integer
 *                   example: 55
 *                 dailyLimit:
 *                   type: integer
 *                   example: 100
 *                 resetDate:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-09-15T00:00:00.000Z
 *       401:
 *         description: Authentication failed
 *       404:
 *         description: Bot not found
 */
export const getUsage = (req: Request, res: Response) => {
  try {
    if (!req.bot) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Bot information not available'
      });
    }
    
    const bot = credentialStore.getBotById(req.bot.id);
    
    if (!bot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Could not find bot with the provided ID'
      });
    }
    
    // Return usage statistics
    return res.status(200).json({
      botId: bot.id,
      tier: bot.tier,
      creditsUsedToday: bot.usageToday,
      creditsRemaining: bot.creditsRemaining,
      dailyLimit: bot.tier === 'free' ? 100 : 10000,
      resetDate: bot.resetDate.toISOString()
    });
  } catch (error) {
    console.error('Error retrieving usage statistics:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
};
