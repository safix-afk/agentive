import { Request, Response, NextFunction } from 'express';
import { CreditService } from '../../services/creditService';
import { MetricsService } from '../../services/metricsService';
import { ApiError } from '../../middleware/errorHandlerMiddleware';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// DTO for purchase credits request
class PurchaseCreditsDto {
  amount!: number;
  paymentMethodId?: string;
}

/**
 * Purchase Controller
 * Handles credit purchase operations with Stripe integration
 */
export class PurchaseController {
  private creditService: CreditService;
  private metricsService: MetricsService;

  constructor() {
    this.creditService = new CreditService();
    this.metricsService = MetricsService.getInstance();
  }

  /**
   * Purchase credits for a bot
   * @swagger
   * /v1/purchase-credits:
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
   *               paymentMethodId:
   *                 type: string
   *                 description: Stripe payment method ID (optional)
   *     responses:
   *       200:
   *         description: Credits purchased successfully
   *       401:
   *         description: Authentication failed
   *       400:
   *         description: Invalid request parameters
   */
  purchaseCredits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const purchaseDto = plainToInstance(PurchaseCreditsDto, req.body);
      const errors = await validate(purchaseDto);
      
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
      
      const { amount, paymentMethodId } = purchaseDto;
      
      // Validate amount
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new ApiError(
          'Please provide a valid positive amount of credits to purchase',
          400,
          'INVALID_AMOUNT'
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
      
      // Purchase credits
      const result = await this.creditService.purchaseCredits(
        req.bot.id,
        amount,
        paymentMethodId
      );
      
      // Track metrics
      if (result.success && result.invoice) {
        this.metricsService.incrementCreditsPurchasedCounter(
          req.bot.id,
          req.bot.tier,
          result.invoice.status,
          amount
        );
      }
      
      // Return appropriate response
      if (result.success) {
        return res.status(200).json({
          success: true,
          creditsRemaining: req.bot.creditsRemaining + amount,
          invoiceUrl: result.invoice?.invoiceUrl || `/invoices/${result.invoice?.id}`,
          invoiceId: result.invoice?.id
        });
      } else {
        // If payment requires further action (e.g., 3D Secure)
        if (result.invoice && result.invoice.status === 'pending') {
          return res.status(202).json({
            success: false,
            message: result.error || 'Payment requires further action',
            invoice: result.invoice
          });
        }
        
        throw new ApiError(
          result.error || 'Failed to purchase credits',
          400,
          'PURCHASE_FAILED',
          { invoice: result.invoice }
        );
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get invoice details
   * @swagger
   * /v1/invoices/{invoiceId}:
   *   get:
   *     summary: Get invoice details
   *     tags: [Purchase]
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: invoiceId
   *         required: true
   *         schema:
   *           type: string
   *         description: Invoice ID
   *     responses:
   *       200:
   *         description: Invoice details retrieved successfully
   *       401:
   *         description: Authentication failed
   *       404:
   *         description: Invoice not found
   */
  getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceId } = req.params;
      
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Get invoice from database
      const invoice = await this.creditService.getInvoice(invoiceId, req.bot.id);
      
      if (!invoice) {
        throw new ApiError(
          'Invoice not found',
          404,
          'INVOICE_NOT_FOUND'
        );
      }
      
      return res.status(200).json({
        success: true,
        invoice
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get all invoices for a bot
   * @swagger
   * /v1/invoices:
   *   get:
   *     summary: Get all invoices for a bot
   *     tags: [Purchase]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: Invoices retrieved successfully
   *       401:
   *         description: Authentication failed
   */
  getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!req.bot) {
        throw new ApiError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      // Get invoices from database
      const invoices = await this.creditService.getInvoices(req.bot.id);
      
      return res.status(200).json({
        success: true,
        invoices
      });
    } catch (error) {
      next(error);
    }
  };
}
