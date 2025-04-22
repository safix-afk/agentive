import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { BotCredential, BotTier } from "../entities/BotCredential";
import { CreditBalance } from "../entities/CreditBalance";
import { createHmac, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";

export class BotCredentialService {
  private botRepository: Repository<BotCredential>;
  private creditBalanceRepository: Repository<CreditBalance>;

  constructor() {
    this.botRepository = AppDataSource.getRepository(BotCredential);
    this.creditBalanceRepository = AppDataSource.getRepository(CreditBalance);
  }

  /**
   * Create a new bot with API key and initial credit balance
   */
  async createBot(name: string, tier: BotTier = BotTier.FREE): Promise<BotCredential> {
    const apiKey = this.generateApiKey();
    const hmacSecret = this.generateHmacSecret();
    
    // Create credit balance
    const creditBalance = new CreditBalance();
    creditBalance.botId = uuidv4(); // Temporary ID, will be replaced
    creditBalance.creditsRemaining = tier === BotTier.FREE ? 100 : 10000;
    creditBalance.dailyLimit = tier === BotTier.FREE ? 100 : 10000;
    creditBalance.resetDate = this.getNextResetDate();
    
    // Create bot
    const bot = new BotCredential();
    bot.name = name;
    bot.tier = tier;
    bot.apiKey = apiKey;
    bot.apiKeyHash = this.hashApiKey(apiKey);
    bot.hmacSecret = hmacSecret;
    bot.creditBalance = creditBalance;
    
    // Save bot
    const savedBot = await this.botRepository.save(bot);
    
    // Update credit balance with correct botId
    creditBalance.botId = savedBot.id;
    await this.creditBalanceRepository.save(creditBalance);
    
    return savedBot;
  }

  /**
   * Validate an API key and return the associated bot
   */
  async validateApiKey(apiKey: string): Promise<BotCredential | null> {
    if (!apiKey) return null;
    
    try {
      const bot = await this.botRepository.findOne({
        where: { apiKey, isActive: true },
        relations: ["creditBalance", "webhooks"]
      });
      
      return bot || null;
    } catch (error) {
      console.error("Error validating API key:", error);
      return null;
    }
  }

  /**
   * Get a bot by ID
   */
  async getBotById(id: string): Promise<BotCredential | null> {
    if (!id) return null;
    
    try {
      const bot = await this.botRepository.findOne({
        where: { id, isActive: true },
        relations: ["creditBalance", "webhooks"]
      });
      
      return bot || null;
    } catch (error) {
      console.error("Error getting bot by ID:", error);
      return null;
    }
  }

  /**
   * Rotate API key for a bot
   */
  async rotateApiKey(botId: string): Promise<{ apiKey: string } | null> {
    try {
      const bot = await this.getBotById(botId);
      if (!bot) return null;
      
      const newApiKey = this.generateApiKey();
      
      bot.apiKey = newApiKey;
      bot.apiKeyHash = this.hashApiKey(newApiKey);
      bot.lastApiKeyRotatedAt = new Date();
      
      await this.botRepository.save(bot);
      
      return { apiKey: newApiKey };
    } catch (error) {
      console.error("Error rotating API key:", error);
      return null;
    }
  }

  /**
   * Deactivate a bot
   */
  async deactivateBot(botId: string): Promise<boolean> {
    try {
      const bot = await this.getBotById(botId);
      if (!bot) return false;
      
      bot.isActive = false;
      await this.botRepository.save(bot);
      
      return true;
    } catch (error) {
      console.error("Error deactivating bot:", error);
      return false;
    }
  }

  /**
   * Update bot tier
   */
  async updateBotTier(botId: string, tier: BotTier): Promise<BotCredential | null> {
    try {
      const bot = await this.getBotById(botId);
      if (!bot) return null;
      
      bot.tier = tier;
      
      // Update daily limit based on tier
      bot.creditBalance.dailyLimit = tier === BotTier.FREE ? 100 : 
                                    tier === BotTier.PREMIUM ? 10000 : 
                                    100000; // Enterprise
      
      await this.botRepository.save(bot);
      await this.creditBalanceRepository.save(bot.creditBalance);
      
      return bot;
    } catch (error) {
      console.error("Error updating bot tier:", error);
      return null;
    }
  }

  /**
   * Generate a new API key
   */
  private generateApiKey(): string {
    return `bot_${randomBytes(16).toString("hex")}`;
  }

  /**
   * Generate HMAC secret for webhook signatures
   */
  private generateHmacSecret(): string {
    return `whsec_${randomBytes(24).toString("hex")}`;
  }

  /**
   * Hash an API key for secure storage
   */
  private hashApiKey(apiKey: string): string {
    const salt = process.env.API_KEY_SALT || "default-salt";
    return createHmac("sha256", salt).update(apiKey).digest("hex");
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
