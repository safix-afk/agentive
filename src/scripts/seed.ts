/**
 * Database Seed Script
 * Populates the database with sample data for testing and development
 */

import 'reflect-metadata';
import { AppDataSource, initializeDataSource } from '../config/data-source';
import { BotCredential, BotTier } from '../entities/BotCredential';
import { CreditBalance } from '../entities/CreditBalance';
import { Invoice, InvoiceStatus, PaymentProvider } from '../entities/Invoice';
import { WebhookSubscription, WebhookEventType } from '../entities/WebhookSubscription';
import { ApiUsage } from '../entities/ApiUsage';
import { createHmac, randomBytes } from 'crypto';
import { logger } from '../utils/logger';

// Sample data
const SAMPLE_BOTS = [
  {
    name: 'Demo Free Bot',
    tier: BotTier.FREE,
    apiKey: 'bot_free_test_key',
    credits: 100,
    dailyLimit: 100
  },
  {
    name: 'Demo Premium Bot',
    tier: BotTier.PREMIUM,
    apiKey: 'bot_premium_test_key',
    credits: 10000,
    dailyLimit: 10000
  },
  {
    name: 'Demo Enterprise Bot',
    tier: BotTier.ENTERPRISE,
    apiKey: 'bot_enterprise_test_key',
    credits: 100000,
    dailyLimit: 100000
  }
];

// Sample webhooks
const SAMPLE_WEBHOOKS = [
  {
    url: 'https://webhook.site/demo-webhook-1',
    eventType: WebhookEventType.ALL,
    description: 'Demo webhook for all events'
  },
  {
    url: 'https://webhook.site/demo-webhook-2',
    eventType: WebhookEventType.PURCHASE,
    description: 'Demo webhook for purchase events'
  }
];

// Sample invoices
const SAMPLE_INVOICES = [
  {
    amount: 1000,
    pricePerCredit: 0.001,
    totalPrice: 1,
    status: InvoiceStatus.PAID,
    paymentProvider: PaymentProvider.STRIPE,
    stripePaymentIntentId: 'pi_demo_1',
    receiptUrl: 'https://dashboard.stripe.com/payments/demo',
    invoiceUrl: '/invoices/demo-1'
  },
  {
    amount: 5000,
    pricePerCredit: 0.001,
    totalPrice: 5,
    status: InvoiceStatus.PAID,
    paymentProvider: PaymentProvider.STRIPE,
    stripePaymentIntentId: 'pi_demo_2',
    receiptUrl: 'https://dashboard.stripe.com/payments/demo',
    invoiceUrl: '/invoices/demo-2'
  }
];

// Sample API usage data
const generateUsageData = (botId: string, days: number = 30) => {
  const usageRecords: Partial<ApiUsage>[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Generate random usage data
    const requestCount = Math.floor(Math.random() * 100) + 1;
    const successCount = Math.floor(requestCount * (0.9 + Math.random() * 0.1));
    const errorCount = requestCount - successCount;
    
    // Generate endpoint breakdown
    const endpointBreakdown: Record<string, number> = {
      '/v1/usage': Math.floor(requestCount * 0.3),
      '/v1/purchase-credits': Math.floor(requestCount * 0.2),
      '/v1/webhooks': Math.floor(requestCount * 0.1),
      '/v1/bot': Math.floor(requestCount * 0.4)
    };
    
    // Generate error breakdown if there are errors
    const errorBreakdown: Record<string, number> = {};
    if (errorCount > 0) {
      errorBreakdown['RATE_LIMIT_EXCEEDED'] = Math.floor(errorCount * 0.5);
      errorBreakdown['VALIDATION_ERROR'] = Math.floor(errorCount * 0.3);
      errorBreakdown['SERVER_ERROR'] = errorCount - errorBreakdown['RATE_LIMIT_EXCEEDED'] - errorBreakdown['VALIDATION_ERROR'];
    }
    
    usageRecords.push({
      botId,
      date,
      requestCount,
      successCount,
      errorCount,
      creditsUsed: requestCount,
      endpointBreakdown,
      errorBreakdown
    });
  }
  
  return usageRecords;
};

/**
 * Seed the database with sample data
 */
const seedDatabase = async () => {
  try {
    // Initialize database connection
    await initializeDataSource();
    logger.info('Database connection established');
    
    // Get repositories
    const botRepository = AppDataSource.getRepository(BotCredential);
    const creditBalanceRepository = AppDataSource.getRepository(CreditBalance);
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const webhookRepository = AppDataSource.getRepository(WebhookSubscription);
    const apiUsageRepository = AppDataSource.getRepository(ApiUsage);
    
    // Check if database already has data
    const existingBotsCount = await botRepository.count();
    if (existingBotsCount > 0) {
      logger.warn('Database already contains data. Skipping seed operation.');
      logger.info(`Found ${existingBotsCount} existing bots.`);
      return;
    }
    
    // Create sample bots
    for (const botData of SAMPLE_BOTS) {
      // Create credit balance
      const creditBalance = new CreditBalance();
      creditBalance.creditsRemaining = botData.credits;
      creditBalance.dailyLimit = botData.dailyLimit;
      creditBalance.resetDate = getNextResetDate();
      
      // Create bot
      const bot = new BotCredential();
      bot.name = botData.name;
      bot.tier = botData.tier;
      bot.apiKey = botData.apiKey;
      bot.apiKeyHash = hashApiKey(botData.apiKey);
      bot.hmacSecret = generateHmacSecret();
      bot.creditBalance = creditBalance;
      
      // Save bot
      const savedBot = await botRepository.save(bot);
      logger.info(`Created bot: ${savedBot.name} (${savedBot.id})`);
      
      // Update credit balance with correct botId
      creditBalance.botId = savedBot.id;
      await creditBalanceRepository.save(creditBalance);
      
      // Create sample webhooks for this bot
      for (const webhookData of SAMPLE_WEBHOOKS) {
        const webhook = new WebhookSubscription();
        webhook.botId = savedBot.id;
        webhook.url = webhookData.url;
        webhook.eventType = webhookData.eventType;
        webhook.description = webhookData.description;
        
        await webhookRepository.save(webhook);
        logger.info(`Created webhook for ${savedBot.name}: ${webhook.url}`);
      }
      
      // Create sample invoices for this bot
      for (const invoiceData of SAMPLE_INVOICES) {
        const invoice = new Invoice();
        invoice.botId = savedBot.id;
        invoice.amount = invoiceData.amount;
        invoice.pricePerCredit = invoiceData.pricePerCredit;
        invoice.totalPrice = invoiceData.totalPrice;
        invoice.status = invoiceData.status;
        invoice.paymentProvider = invoiceData.paymentProvider;
        invoice.stripePaymentIntentId = invoiceData.stripePaymentIntentId;
        invoice.receiptUrl = invoiceData.receiptUrl;
        invoice.invoiceUrl = invoiceData.invoiceUrl;
        
        await invoiceRepository.save(invoice);
        logger.info(`Created invoice for ${savedBot.name}: ${invoice.amount} credits`);
      }
      
      // Create sample API usage data for this bot
      const usageRecords = generateUsageData(savedBot.id);
      for (const usageData of usageRecords) {
        const usage = new ApiUsage();
        Object.assign(usage, usageData);
        
        await apiUsageRepository.save(usage);
      }
      logger.info(`Created ${usageRecords.length} usage records for ${savedBot.name}`);
    }
    
    logger.info('Database seeding completed successfully!');
    
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  }
};

/**
 * Generate HMAC secret for webhook signatures
 */
function generateHmacSecret(): string {
  return `whsec_${randomBytes(24).toString('hex')}`;
}

/**
 * Hash an API key for secure storage
 */
function hashApiKey(apiKey: string): string {
  const salt = process.env.API_KEY_SALT || 'default-salt';
  return createHmac('sha256', salt).update(apiKey).digest('hex');
}

/**
 * Get the next usage reset date (midnight tomorrow)
 */
function getNextResetDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// Run the seed function
seedDatabase().catch(error => {
  logger.error('Unhandled error during database seeding:', error);
  process.exit(1);
});
