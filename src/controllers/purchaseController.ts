/**
 * Purchase Controller
 * Handles credit purchase operations
 */

import { Request, Response } from 'express';
import { credentialStore } from '../utils/credentialStore';
import { invoiceGenerator } from '../utils/invoiceGenerator';
import { webhookHandler } from '../utils/webhookHandler';

/**
 * @swagger
 * /purchase-credits:
 *   post:
 *     summary: Purchase credits for a bot
 *     tags: [Purchase]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Number of credits to purchase
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Credits purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 creditsRemaining:
 *                   type: integer
 *                   example: 1100
 *                 invoiceUrl:
 *                   type: string
 *                   example: http://localhost:3000/invoices/abc123
 *                 invoice:
 *                   type: object
 *       401:
 *         description: Authentication failed
 *       400:
 *         description: Invalid request parameters
 */
export const purchaseCredits = async (req: Request, res: Response) => {
  try {
    // Validate request
    const { amount } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide a valid positive amount of credits to purchase'
      });
    }
    
    if (!req.bot) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Bot information not available'
      });
    }
    
    // Update bot credits
    const updatedBot = credentialStore.updateCredits(req.bot.id, amount);
    
    if (!updatedBot) {
      return res.status(404).json({
        error: 'Bot not found',
        message: 'Could not find bot with the provided ID'
      });
    }
    
    // Generate invoice
    const invoice = invoiceGenerator.generateInvoice(
      updatedBot.id,
      updatedBot.name,
      amount
    );
    
    // Send webhook notification if URL is registered
    if (updatedBot.webhookUrl) {
      webhookHandler.sendWebhook(updatedBot.id, 'purchase', {
        amount,
        creditsRemaining: updatedBot.creditsRemaining,
        invoiceUrl: invoice.invoiceUrl,
        invoiceId: invoice.id
      }).catch(error => {
        console.error('Webhook delivery failed:', error);
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      creditsRemaining: updatedBot.creditsRemaining,
      invoiceUrl: invoice.invoiceUrl,
      invoice
    });
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
};
