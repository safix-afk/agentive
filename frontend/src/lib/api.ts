/**
 * API client for interacting with the Agentive backend
 */

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.agentive.app';

/**
 * API client configuration
 */
interface ApiClientConfig {
  apiKey?: string;
  botId?: string;
  sandboxMode?: boolean;
}

/**
 * API client for interacting with the Agentive backend
 */
export class ApiClient {
  private apiKey?: string;
  private botId?: string;
  private sandboxMode: boolean;
  private baseUrl: string;

  /**
   * Create a new API client
   */
  constructor(config: ApiClientConfig = {}) {
    this.apiKey = config.apiKey;
    this.botId = config.botId;
    this.sandboxMode = config.sandboxMode || false;
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Set bot ID
   */
  setBotId(botId: string) {
    this.botId = botId;
  }

  /**
   * Set sandbox mode
   */
  setSandboxMode(enabled: boolean) {
    this.sandboxMode = enabled;
  }

  /**
   * Get request headers
   */
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    if (this.botId) {
      headers['X-Bot-ID'] = this.botId;
    }

    if (this.sandboxMode) {
      headers['X-Sandbox-Mode'] = 'true';
    }

    return headers;
  }

  /**
   * Make API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'API request failed');
      }

      return responseData as T;
    } catch (error) {
      console.error(`API ${method} ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Purchase credits
   */
  async purchaseCredits(amount: number, paymentMethodId?: string) {
    return this.request<{
      success: boolean;
      creditsRemaining?: number;
      invoiceUrl?: string;
      invoiceId?: string;
      clientSecret?: string;
    }>('POST', '/api/purchase-credits', {
      amount,
      paymentMethodId,
    });
  }

  /**
   * Get usage statistics
   */
  async getUsage() {
    return this.request<{
      success: boolean;
      usage?: {
        creditsRemaining: number;
        usageToday: number;
        dailyLimit: number;
        resetDate: string;
        date: string;
      };
    }>('GET', '/api/usage');
  }

  /**
   * Get usage history
   */
  async getUsageHistory(days: number = 30) {
    return this.request<{
      success: boolean;
      history?: Array<{
        date: string;
        requestCount: number;
        successCount: number;
        errorCount: number;
        creditsUsed: number;
      }>;
    }>('GET', `/api/usage/history?days=${days}`);
  }

  /**
   * Get endpoint usage
   */
  async getEndpointUsage(days: number = 30) {
    return this.request<{
      success: boolean;
      totalRequests?: number;
      endpointBreakdown?: Array<{
        endpoint: string;
        count: number;
        percentage: number;
      }>;
    }>('GET', `/api/usage/endpoints?days=${days}`);
  }

  /**
   * Get bot information
   */
  async getBotInfo() {
    return this.request<{
      success: boolean;
      bot?: {
        id: string;
        name: string;
        tier: string;
        creditsRemaining: number;
        usageToday: number;
        createdAt: string;
      };
    }>('GET', '/api/bot');
  }

  /**
   * Rotate API key
   */
  async rotateApiKey() {
    return this.request<{
      success: boolean;
      apiKey?: string;
    }>('POST', '/api/bot/rotate-api-key');
  }

  /**
   * Update bot tier
   */
  async updateBotTier(tier: string) {
    return this.request<{
      success: boolean;
      bot?: {
        id: string;
        name: string;
        tier: string;
        creditsRemaining: number;
        usageToday: number;
      };
    }>('PUT', '/api/bot/tier', { tier });
  }

  /**
   * Register webhook
   */
  async registerWebhook(url: string, eventType: string, description?: string) {
    return this.request<{
      success: boolean;
      webhook?: {
        id: string;
        url: string;
        eventType: string;
        description: string;
        createdAt: string;
      };
    }>('POST', '/api/webhooks', {
      url,
      eventType,
      description,
    });
  }

  /**
   * Get webhooks
   */
  async getWebhooks() {
    return this.request<{
      success: boolean;
      webhooks?: Array<{
        id: string;
        url: string;
        eventType: string;
        description: string;
        createdAt: string;
      }>;
    }>('GET', '/api/webhooks');
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>('DELETE', `/api/webhooks/${webhookId}`);
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId: string) {
    return this.request<{
      success: boolean;
      message?: string;
      response?: {
        status: number;
        body: string;
      };
    }>('POST', `/api/webhooks/${webhookId}/test`);
  }
}
