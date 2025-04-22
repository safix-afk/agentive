/**
 * Webhook Controller
 * Handles webhook registration and management
 */

import { Request, Response } from 'express';
import { credentialStore } from '../utils/credentialStore';
import { webhookHandler } from '../utils/webhookHandler';

/**
 * @swagger
 * /webhooks/{botId}:
 *   post:
 *     summary: Register a webhook URL for a bot
 *     tags: [Webhook]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bot ID
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
 *     responses:
 *       200:
 *         description: Webhook registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Webhook URL registered successfully
 *                 webhookUrl:
 *                   type: string
 *                   format: url
 *                   example: https://example.com/webhook
 *       401:
 *         description: Authentication failed
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Bot not found
 */
export const registerWebhook = (req: Request, res: Response) => {
  try {
    const { botId } = req.params;
    const { url } = req.body;
    
    // Validate request
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide a valid webhook URL'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'The provided webhook URL is not valid'
      });
    }
    
    // Authenticate bot
    if (!req.bot || req.bot.id !== botId) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'You are not authorized to register webhooks for this bot'
      });
    }
    
    // Register webhook URL
    const updatedBot = credentialStore.setWebhookUrl(botId, url);
    
    if (!updatedBot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Could not find bot with the provided ID'
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Webhook URL registered successfully',
      webhookUrl: url
    });
  } catch (error) {
    console.error('Error registering webhook URL:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
};

/**
 * @swagger
 * /webhooks/{botId}/test:
 *   post:
 *     summary: Send a test webhook event
 *     tags: [Webhook]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bot ID
 *     responses:
 *       200:
 *         description: Test webhook sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Test webhook sent successfully
 *                 webhookResponse:
 *                   type: object
 *       401:
 *         description: Authentication failed
 *       404:
 *         description: Bot not found or no webhook URL registered
 */
export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;
    
    // Authenticate bot
    if (!req.bot || req.bot.id !== botId) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'You are not authorized to test webhooks for this bot'
      });
    }
    
    const bot = credentialStore.getBotById(botId);
    
    if (!bot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Could not find bot with the provided ID'
      });
    }
    
    if (!bot.webhookUrl) {
      return res.status(404).json({
        error: 'No webhook URL',
        message: 'No webhook URL registered for this bot'
      });
    }
    
    // Send test webhook
    const result = await webhookHandler.sendWebhook(botId, 'test', {
      message: 'This is a test webhook event',
      timestamp: new Date().toISOString()
    });
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Webhook delivery failed',
        message: result.error || 'Failed to deliver test webhook'
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Test webhook sent successfully',
      webhookResponse: result.response
    });
  } catch (error) {
    console.error('Error sending test webhook:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
};
