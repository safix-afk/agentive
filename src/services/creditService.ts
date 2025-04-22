import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { BotCredential } from "../entities/BotCredential";
import { CreditBalance } from "../entities/CreditBalance";
import { Invoice, InvoiceStatus, PaymentProvider } from "../entities/Invoice";
import { ApiUsage } from "../entities/ApiUsage";
import Stripe from "stripe";
import { WebhookService } from "./webhookService";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

export class CreditService {
  private botRepository: Repository<BotCredential>;
  private creditBalanceRepository: Repository<CreditBalance>;
  private invoiceRepository: Repository<Invoice>;
  private apiUsageRepository: Repository<ApiUsage>;
  private webhookService: WebhookService;

  constructor() {
    this.botRepository = AppDataSource.getRepository(BotCredential);
    this.creditBalanceRepository = AppDataSource.getRepository(CreditBalance);
    this.invoiceRepository = AppDataSource.getRepository(Invoice);
    this.apiUsageRepository = AppDataSource.getRepository(ApiUsage);
    this.webhookService = new WebhookService();
  }

  /**
   * Purchase credits for a bot using Stripe
   */
  async purchaseCredits(
    botId: string,
    amount: number,
    paymentMethodId?: string
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    try {
      // Check if this is a sandbox bot ID
      const isSandbox = botId.startsWith('sandbox-bot-');
      
      // Get bot with credit balance
      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true },
        relations: ["creditBalance"],
      });

      if (!bot && !isSandbox) {
        return { success: false, error: "Bot not found" };
      }

      // Calculate price
      const pricePerCredit = 0.001; // $0.001 per credit
      const totalPrice = amount * pricePerCredit;

      // Create invoice record
      const invoice = new Invoice();
      invoice.botId = botId;
      invoice.amount = amount;
      invoice.pricePerCredit = pricePerCredit;
      invoice.totalPrice = totalPrice;
      invoice.status = InvoiceStatus.PENDING;
      invoice.paymentProvider = PaymentProvider.STRIPE;

      // For sandbox mode, we'll simulate a successful payment without calling Stripe
      if (isSandbox) {
        // Generate a fake payment intent ID
        const fakePaymentIntentId = `pi_sandbox_${Date.now()}`;
        
        // Update invoice with sandbox info
        invoice.stripePaymentIntentId = fakePaymentIntentId;
        invoice.stripeCustomerId = `cus_sandbox_${botId}`;
        invoice.status = InvoiceStatus.PAID;
        invoice.receiptUrl = `https://dashboard.stripe.com/test/payments/${fakePaymentIntentId}`;
        invoice.invoiceUrl = `/invoices/${invoice.id}`;
        
        // Save the invoice
        await this.invoiceRepository.save(invoice);
        
        // For sandbox, we don't need to update a real credit balance
        // Just return success with the invoice
        return { success: true, invoice };
      }

      // Save initial invoice
      await this.invoiceRepository.save(invoice);

      // Process payment with Stripe
      try {
        // Create or get Stripe customer
        let customerId = bot.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            name: bot.name,
            metadata: {
              botId: bot.id,
            },
          });
          customerId = customer.id;
          bot.stripeCustomerId = customerId;
          await this.botRepository.save(bot);
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalPrice * 100), // Convert to cents
          currency: "usd",
          customer: customerId,
          payment_method: paymentMethodId,
          confirm: !!paymentMethodId,
          automatic_payment_methods: !paymentMethodId ? { enabled: true } : undefined,
          metadata: {
            botId: bot.id,
            invoiceId: invoice.id,
            credits: amount,
          },
        });

        // Update invoice with Stripe info
        invoice.stripePaymentIntentId = paymentIntent.id;
        invoice.stripeCustomerId = customerId;

        // If payment is successful or requires no further action
        if (
          paymentIntent.status === "succeeded" ||
          paymentIntent.status === "requires_capture"
        ) {
          // Update invoice status
          invoice.status = InvoiceStatus.PAID;
          invoice.receiptUrl = `https://dashboard.stripe.com/payments/${paymentIntent.id}`;
          invoice.invoiceUrl = `/invoices/${invoice.id}`;

          // Update credit balance
          bot.creditBalance.creditsRemaining += amount;
          bot.creditBalance.totalCreditsPurchased += amount;
          await this.creditBalanceRepository.save(bot.creditBalance);

          // Save updated invoice
          await this.invoiceRepository.save(invoice);

          // Send webhook notification
          this.webhookService.sendWebhook(botId, "purchase", {
            amount,
            creditsRemaining: bot.creditBalance.creditsRemaining,
            invoiceId: invoice.id,
            invoiceUrl: invoice.invoiceUrl,
          }).catch(error => {
            console.error("Error sending webhook:", error);
          });

          return { success: true, invoice };
        } else {
          // Payment requires further action
          invoice.status = InvoiceStatus.PENDING;
          await this.invoiceRepository.save(invoice);

          return {
            success: false,
            invoice,
            error: `Payment requires further action: ${paymentIntent.status}`,
          };
        }
      } catch (stripeError: any) {
        // Handle Stripe errors
        console.error("Stripe error:", stripeError);

        // Update invoice status to failed
        invoice.status = InvoiceStatus.FAILED;
        invoice.notes = `Payment failed: ${stripeError.message}`;
        await this.invoiceRepository.save(invoice);

        return {
          success: false,
          invoice,
          error: `Payment failed: ${stripeError.message}`,
        };
      }
    } catch (error: any) {
      console.error("Error purchasing credits:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Track API usage and deduct credits
   */
  async trackUsage(
    botId: string,
    endpoint: string,
    isSuccess: boolean = true
  ): Promise<{
    success: boolean;
    creditsRemaining?: number;
    usageToday?: number;
    error?: string;
  }> {
    try {
      // Get bot with credit balance
      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true },
        relations: ["creditBalance"],
      });

      if (!bot) {
        return { success: false, error: "Bot not found" };
      }

      // Check if we need to reset usage counter
      const now = new Date();
      if (now > bot.creditBalance.resetDate) {
        bot.creditBalance.usageToday = 0;
        bot.creditBalance.resetDate = this.getNextResetDate();
      }

      // Check if bot has exceeded daily limit
      if (bot.creditBalance.usageToday >= bot.creditBalance.dailyLimit) {
        return {
          success: false,
          creditsRemaining: bot.creditBalance.creditsRemaining,
          usageToday: bot.creditBalance.usageToday,
          error: "Daily usage limit exceeded",
        };
      }

      // Check if bot has sufficient credits
      if (bot.creditBalance.creditsRemaining <= 0) {
        return {
          success: false,
          creditsRemaining: 0,
          usageToday: bot.creditBalance.usageToday,
          error: "Insufficient credits",
        };
      }

      // Update usage counters
      bot.creditBalance.usageToday += 1;
      bot.creditBalance.creditsRemaining -= 1;
      bot.creditBalance.totalCreditsUsed += 1;

      // Ensure credits don't go below zero
      if (bot.creditBalance.creditsRemaining < 0) {
        bot.creditBalance.creditsRemaining = 0;
      }

      // Save updated credit balance
      await this.creditBalanceRepository.save(bot.creditBalance);

      // Update or create API usage record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let usageRecord = await this.apiUsageRepository.findOne({
        where: {
          botId,
          date: today,
        },
      });

      if (!usageRecord) {
        usageRecord = new ApiUsage();
        usageRecord.botId = botId;
        usageRecord.date = today;
        usageRecord.endpointBreakdown = {};
        usageRecord.errorBreakdown = {};
      }

      // Update usage statistics
      usageRecord.requestCount += 1;
      usageRecord.creditsUsed += 1;

      if (isSuccess) {
        usageRecord.successCount += 1;
      } else {
        usageRecord.errorCount += 1;
      }

      // Update endpoint breakdown
      if (!usageRecord.endpointBreakdown) {
        usageRecord.endpointBreakdown = {};
      }
      usageRecord.endpointBreakdown[endpoint] = (usageRecord.endpointBreakdown[endpoint] || 0) + 1;

      // Save usage record
      await this.apiUsageRepository.save(usageRecord);

      // Send webhook if credits are running low (less than 10% of total purchased)
      if (
        bot.creditBalance.creditsRemaining <= 
        bot.creditBalance.totalCreditsPurchased * 0.1 &&
        bot.creditBalance.creditsRemaining > 0
      ) {
        this.webhookService.sendWebhook(botId, "credit_update", {
          creditsRemaining: bot.creditBalance.creditsRemaining,
          creditsLow: true,
          usageToday: bot.creditBalance.usageToday,
          dailyLimit: bot.creditBalance.dailyLimit,
        }).catch(error => {
          console.error("Error sending webhook:", error);
        });
      }

      return {
        success: true,
        creditsRemaining: bot.creditBalance.creditsRemaining,
        usageToday: bot.creditBalance.usageToday,
      };
    } catch (error: any) {
      console.error("Error tracking usage:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Get usage statistics for a bot
   */
  async getUsageStats(botId: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      // Get bot with credit balance
      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true },
        relations: ["creditBalance"],
      });

      if (!bot) {
        return { success: false, error: "Bot not found" };
      }

      // Check if we need to reset usage counter
      const now = new Date();
      if (now > bot.creditBalance.resetDate) {
        bot.creditBalance.usageToday = 0;
        bot.creditBalance.resetDate = this.getNextResetDate();
        await this.creditBalanceRepository.save(bot.creditBalance);
      }

      // Get usage records for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const usageRecords = await this.apiUsageRepository.find({
        where: {
          botId,
          date: { $gte: thirtyDaysAgo },
        },
        order: {
          date: "DESC",
        },
      });

      // Calculate total usage
      const totalRequests = usageRecords.reduce(
        (sum, record) => sum + record.requestCount,
        0
      );
      const totalSuccesses = usageRecords.reduce(
        (sum, record) => sum + record.successCount,
        0
      );
      const totalErrors = usageRecords.reduce(
        (sum, record) => sum + record.errorCount,
        0
      );
      const totalCreditsUsed = usageRecords.reduce(
        (sum, record) => sum + record.creditsUsed,
        0
      );

      // Compile endpoint usage
      const endpointUsage: Record<string, number> = {};
      usageRecords.forEach(record => {
        if (record.endpointBreakdown) {
          Object.entries(record.endpointBreakdown).forEach(([endpoint, count]) => {
            endpointUsage[endpoint] = (endpointUsage[endpoint] || 0) + count;
          });
        }
      });

      // Return usage statistics
      return {
        success: true,
        stats: {
          botId: bot.id,
          name: bot.name,
          tier: bot.tier,
          creditsRemaining: bot.creditBalance.creditsRemaining,
          creditsUsedToday: bot.creditBalance.usageToday,
          totalCreditsPurchased: bot.creditBalance.totalCreditsPurchased,
          totalCreditsUsed: bot.creditBalance.totalCreditsUsed,
          dailyLimit: bot.creditBalance.dailyLimit,
          resetDate: bot.creditBalance.resetDate.toISOString(),
          last30Days: {
            totalRequests,
            totalSuccesses,
            totalErrors,
            totalCreditsUsed,
            successRate: totalRequests > 0 ? totalSuccesses / totalRequests : 0,
          },
          endpointUsage,
          dailyUsage: usageRecords.map(record => ({
            date: record.date.toISOString().split("T")[0],
            requests: record.requestCount,
            successes: record.successCount,
            errors: record.errorCount,
            creditsUsed: record.creditsUsed,
          })),
        },
      };
    } catch (error: any) {
      console.error("Error getting usage stats:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Get the next usage reset date (midnight tomorrow)
   */
  private getNextResetDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}
