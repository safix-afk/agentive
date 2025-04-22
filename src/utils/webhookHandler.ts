/**
 * Webhook handler utility
 * Manages sending webhook events to registered bot endpoints
 */

import axios from 'axios';
import { credentialStore } from './credentialStore';

export interface WebhookEvent {
  event: string;
  botId: string;
  timestamp: string;
  details: Record<string, any>;
}

export class WebhookHandler {
  /**
   * Send a webhook event to a bot's registered webhook URL
   * @param botId Bot ID
   * @param event Event name
   * @param details Event details
   * @returns Success status and response or error
   */
  async sendWebhook(
    botId: string, 
    event: string, 
    details: Record<string, any>
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const bot = credentialStore.getBotById(botId);
    
    if (!bot || !bot.webhookUrl) {
      return { 
        success: false, 
        error: 'No webhook URL registered for this bot' 
      };
    }
    
    const webhookPayload: WebhookEvent = {
      event,
      botId,
      timestamp: new Date().toISOString(),
      details
    };
    
    try {
      // Add a 5-second timeout to prevent hanging
      const response = await axios.post(bot.webhookUrl, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-API-Signature': this.generateSignature(webhookPayload)
        },
        timeout: 5000
      });
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      console.error(`Webhook delivery failed: ${error}`);
      return {
        success: false,
        error: `Failed to deliver webhook: ${error}`
      };
    }
  }
  
  /**
   * Generate a signature for webhook payload verification
   * In a production environment, this would use HMAC with a secret key
   * @param payload Webhook payload
   * @returns Simple signature string
   */
  private generateSignature(payload: WebhookEvent): string {
    // This is a simplified example - in production use crypto.createHmac
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

// Export a singleton instance
export const webhookHandler = new WebhookHandler();
