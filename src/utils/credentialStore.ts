/**
 * In-memory credential store for bot API keys and usage tracking
 * In a production environment, this would be replaced with a database
 */

import { v4 as uuidv4 } from 'uuid';

export interface Bot {
  id: string;
  apiKey: string;
  name: string;
  tier: 'free' | 'premium';
  creditsRemaining: number;
  usageToday: number;
  resetDate: Date;
  webhookUrl?: string;
}

class CredentialStore {
  private bots: Map<string, Bot> = new Map();
  private apiKeyToBotId: Map<string, string> = new Map();

  /**
   * Register a new bot with the platform
   * @param name Bot name
   * @param tier Subscription tier
   * @returns Newly created bot with API key
   */
  registerBot(name: string, tier: 'free' | 'premium' = 'free'): Bot {
    const id = uuidv4();
    const apiKey = this.generateApiKey();
    
    const bot: Bot = {
      id,
      apiKey,
      name,
      tier,
      creditsRemaining: tier === 'free' ? 100 : 10000,
      usageToday: 0,
      resetDate: this.getNextResetDate(),
    };
    
    this.bots.set(id, bot);
    this.apiKeyToBotId.set(apiKey, id);
    
    return bot;
  }

  /**
   * Validate an API key and return the associated bot
   * @param apiKey API key to validate
   * @returns Bot object if valid, null otherwise
   */
  validateApiKey(apiKey: string): Bot | null {
    const botId = this.apiKeyToBotId.get(apiKey);
    if (!botId) return null;
    
    return this.bots.get(botId) || null;
  }

  /**
   * Get a bot by ID
   * @param botId Bot ID
   * @returns Bot object if found, null otherwise
   */
  getBotById(botId: string): Bot | null {
    return this.bots.get(botId) || null;
  }

  /**
   * Update bot credits
   * @param botId Bot ID
   * @param amount Amount to add (positive) or subtract (negative)
   * @returns Updated bot or null if not found
   */
  updateCredits(botId: string, amount: number): Bot | null {
    const bot = this.bots.get(botId);
    if (!bot) return null;
    
    bot.creditsRemaining += amount;
    this.bots.set(botId, bot);
    
    return bot;
  }

  /**
   * Track API usage for rate limiting
   * @param botId Bot ID
   * @returns Updated bot or null if not found
   */
  trackUsage(botId: string): Bot | null {
    const bot = this.bots.get(botId);
    if (!bot) return null;
    
    // Reset usage counter if past reset date
    if (new Date() > bot.resetDate) {
      bot.usageToday = 0;
      bot.resetDate = this.getNextResetDate();
    }
    
    bot.usageToday += 1;
    bot.creditsRemaining -= 1;
    
    // Ensure credits don't go below zero
    if (bot.creditsRemaining < 0) {
      bot.creditsRemaining = 0;
    }
    
    this.bots.set(botId, bot);
    
    return bot;
  }

  /**
   * Set webhook URL for a bot
   * @param botId Bot ID
   * @param url Webhook URL
   * @returns Updated bot or null if not found
   */
  setWebhookUrl(botId: string, url: string): Bot | null {
    const bot = this.bots.get(botId);
    if (!bot) return null;
    
    bot.webhookUrl = url;
    this.bots.set(botId, bot);
    
    return bot;
  }

  /**
   * Generate a random API key
   * @returns API key string
   */
  private generateApiKey(): string {
    return `bot_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Get the next usage reset date (midnight tomorrow)
   * @returns Date object for next reset
   */
  private getNextResetDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Initialize with some sample bots for testing
  initializeSampleBots() {
    const freeBotId = uuidv4();
    const freeApiKey = 'bot_free_test_key';
    const freeBot: Bot = {
      id: freeBotId,
      apiKey: freeApiKey,
      name: 'Test Free Bot',
      tier: 'free',
      creditsRemaining: 100,
      usageToday: 0,
      resetDate: this.getNextResetDate(),
    };
    
    const premiumBotId = uuidv4();
    const premiumApiKey = 'bot_premium_test_key';
    const premiumBot: Bot = {
      id: premiumBotId,
      apiKey: premiumApiKey,
      name: 'Test Premium Bot',
      tier: 'premium',
      creditsRemaining: 10000,
      usageToday: 0,
      resetDate: this.getNextResetDate(),
    };
    
    this.bots.set(freeBotId, freeBot);
    this.apiKeyToBotId.set(freeApiKey, freeBotId);
    
    this.bots.set(premiumBotId, premiumBot);
    this.apiKeyToBotId.set(premiumApiKey, premiumBotId);
  }
}

// Export a singleton instance
export const credentialStore = new CredentialStore();
