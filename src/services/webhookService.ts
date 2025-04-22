import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { BotCredential } from "../entities/BotCredential";
import { WebhookSubscription, WebhookEventType } from "../entities/WebhookSubscription";
import axios from "axios";
import { createHmac } from "crypto";

export interface WebhookEvent {
  id: string;
  event: string;
  botId: string;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  private botRepository: Repository<BotCredential>;
  private webhookRepository: Repository<WebhookSubscription>;

  constructor() {
    this.botRepository = AppDataSource.getRepository(BotCredential);
    this.webhookRepository = AppDataSource.getRepository(WebhookSubscription);
  }

  /**
   * Register a webhook URL for a bot
   */
  async registerWebhook(
    botId: string,
    url: string,
    eventType: WebhookEventType = WebhookEventType.ALL,
    description?: string
  ): Promise<{ success: boolean; webhook?: WebhookSubscription; error?: string }> {
    try {
      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return { success: false, error: "Invalid URL format" };
      }

      // Check if bot exists
      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true }
      });

      if (!bot) {
        return { success: false, error: "Bot not found" };
      }

      // Check if webhook already exists for this URL
      const existingWebhook = await this.webhookRepository.findOne({
        where: { botId, url }
      });

      if (existingWebhook) {
        // Update existing webhook
        existingWebhook.eventType = eventType;
        existingWebhook.isActive = true;
        if (description) existingWebhook.description = description;
        
        const updatedWebhook = await this.webhookRepository.save(existingWebhook);
        return { success: true, webhook: updatedWebhook };
      }

      // Create new webhook
      const webhook = new WebhookSubscription();
      webhook.botId = botId;
      webhook.url = url;
      webhook.eventType = eventType;
      webhook.description = description;
      
      const savedWebhook = await this.webhookRepository.save(webhook);
      return { success: true, webhook: savedWebhook };
    } catch (error: any) {
      console.error("Error registering webhook:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Get all webhooks for a bot
   */
  async getWebhooks(botId: string): Promise<{ success: boolean; webhooks?: WebhookSubscription[]; error?: string }> {
    try {
      const webhooks = await this.webhookRepository.find({
        where: { botId, isActive: true }
      });
      
      return { success: true, webhooks };
    } catch (error: any) {
      console.error("Error getting webhooks:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string, botId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId, botId }
      });
      
      if (!webhook) {
        return { success: false, error: "Webhook not found" };
      }
      
      await this.webhookRepository.remove(webhook);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting webhook:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Send a webhook event to all registered webhooks for a bot
   */
  async sendWebhook(
    botId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      // Get bot with webhooks
      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true }
      });

      if (!bot) {
        return { success: false, error: "Bot not found" };
      }

      // Get active webhooks for this bot that match the event type
      const webhooks = await this.webhookRepository.find({
        where: [
          { botId, isActive: true, eventType: WebhookEventType.ALL },
          { botId, isActive: true, eventType: eventType as WebhookEventType }
        ]
      });

      if (webhooks.length === 0) {
        return { success: true, results: [] }; // No webhooks to send
      }

      // Create webhook event payload
      const webhookEvent: WebhookEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        event: eventType,
        botId,
        timestamp: new Date().toISOString(),
        data
      };

      // Send webhook to all registered URLs
      const results = await Promise.all(
        webhooks.map(async webhook => {
          try {
            // Generate signature
            const signature = this.generateSignature(webhookEvent, bot.hmacSecret || "");
            
            // Send webhook with 5-second timeout
            const response = await axios.post(webhook.url, webhookEvent, {
              headers: {
                "Content-Type": "application/json",
                "X-Bot-API-Signature": signature,
                "X-Bot-API-Event-ID": webhookEvent.id,
                "X-Bot-API-Event-Type": eventType
              },
              timeout: 5000
            });

            // Update webhook stats
            webhook.lastTriggeredAt = new Date();
            await this.webhookRepository.save(webhook);

            return {
              webhookId: webhook.id,
              url: webhook.url,
              success: true,
              statusCode: response.status
            };
          } catch (error: any) {
            // Update webhook failure stats
            webhook.failureCount += 1;
            webhook.lastFailureAt = new Date();
            webhook.lastFailureMessage = error.message;
            await this.webhookRepository.save(webhook);

            return {
              webhookId: webhook.id,
              url: webhook.url,
              success: false,
              error: error.message
            };
          }
        })
      );

      return { success: true, results };
    } catch (error: any) {
      console.error("Error sending webhooks:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Test a webhook by sending a test event
   */
  async testWebhook(webhookId: string, botId: string): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Get webhook
      const webhook = await this.webhookRepository.findOne({
        where: { id: webhookId, botId, isActive: true }
      });

      if (!webhook) {
        return { success: false, error: "Webhook not found" };
      }

      // Get bot
      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true }
      });

      if (!bot) {
        return { success: false, error: "Bot not found" };
      }

      // Create test webhook event
      const webhookEvent: WebhookEvent = {
        id: `evt_test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        event: "test",
        botId,
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test webhook event",
          timestamp: new Date().toISOString()
        }
      };

      try {
        // Generate signature
        const signature = this.generateSignature(webhookEvent, bot.hmacSecret || "");
        
        // Send webhook with 5-second timeout
        const response = await axios.post(webhook.url, webhookEvent, {
          headers: {
            "Content-Type": "application/json",
            "X-Bot-API-Signature": signature,
            "X-Bot-API-Event-ID": webhookEvent.id,
            "X-Bot-API-Event-Type": "test"
          },
          timeout: 5000
        });

        // Update webhook stats
        webhook.lastTriggeredAt = new Date();
        await this.webhookRepository.save(webhook);

        return {
          success: true,
          result: {
            webhookId: webhook.id,
            url: webhook.url,
            statusCode: response.status,
            data: response.data
          }
        };
      } catch (error: any) {
        // Update webhook failure stats
        webhook.failureCount += 1;
        webhook.lastFailureAt = new Date();
        webhook.lastFailureMessage = error.message;
        await this.webhookRepository.save(webhook);

        return {
          success: false,
          error: `Failed to deliver webhook: ${error.message}`
        };
      }
    } catch (error: any) {
      console.error("Error testing webhook:", error);
      return { success: false, error: `Server error: ${error.message}` };
    }
  }

  /**
   * Generate a signature for webhook payload verification using HMAC
   */
  private generateSignature(payload: WebhookEvent, secret: string): string {
    const timestamp = Date.now().toString();
    const payloadString = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payloadString}`;
    
    const signature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");
    
    return `t=${timestamp},v1=${signature}`;
  }
}
