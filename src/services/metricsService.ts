import * as promClient from 'prom-client';

/**
 * Metrics Service
 * Handles Prometheus metrics collection and reporting
 */
export class MetricsService {
  private static instance: MetricsService;
  private registry: promClient.Registry;
  
  // Define metrics
  private httpRequestCounter: promClient.Counter;
  private httpRequestDurationHistogram: promClient.Histogram;
  private apiErrorCounter: promClient.Counter;
  private creditsPurchasedCounter: promClient.Counter;
  private creditsUsedCounter: promClient.Counter;
  private activeBotsGauge: promClient.Gauge;
  private webhookDeliveryCounter: promClient.Counter;
  private webhookFailureCounter: promClient.Counter;
  
  private constructor() {
    // Create a Registry to register the metrics
    this.registry = new promClient.Registry();
    
    // Add default metrics (memory, CPU, etc.)
    promClient.collectDefaultMetrics({ register: this.registry });
    
    // Initialize metrics
    this.httpRequestCounter = new promClient.Counter({
      name: 'agent_api_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'bot_tier'] as const,
      registers: [this.registry]
    });
    
    this.httpRequestDurationHistogram = new promClient.Histogram({
      name: 'agent_api_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });
    
    this.apiErrorCounter = new promClient.Counter({
      name: 'agent_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['route', 'error_type', 'bot_tier'] as const,
      registers: [this.registry]
    });
    
    this.creditsPurchasedCounter = new promClient.Counter({
      name: 'agent_api_credits_purchased_total',
      help: 'Total number of credits purchased',
      labelNames: ['bot_id', 'bot_tier', 'payment_status'] as const,
      registers: [this.registry]
    });
    
    this.creditsUsedCounter = new promClient.Counter({
      name: 'agent_api_credits_used_total',
      help: 'Total number of credits used',
      labelNames: ['bot_id', 'bot_tier', 'endpoint'] as const,
      registers: [this.registry]
    });
    
    this.activeBotsGauge = new promClient.Gauge({
      name: 'agent_api_active_bots',
      help: 'Number of active bots',
      labelNames: ['tier'] as const,
      registers: [this.registry]
    });
    
    this.webhookDeliveryCounter = new promClient.Counter({
      name: 'agent_api_webhook_deliveries_total',
      help: 'Total number of webhook deliveries',
      labelNames: ['event_type', 'success'] as const,
      registers: [this.registry]
    });
    
    this.webhookFailureCounter = new promClient.Counter({
      name: 'agent_api_webhook_failures_total',
      help: 'Total number of webhook delivery failures',
      labelNames: ['event_type', 'error_type'] as const,
      registers: [this.registry]
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }
  
  /**
   * Get the Prometheus registry
   */
  public getRegistry(): promClient.Registry {
    return this.registry;
  }
  
  /**
   * Increment HTTP request counter
   */
  public incrementHttpRequestCounter(method: string, route: string, statusCode: number, botTier: string = 'unknown'): void {
    this.httpRequestCounter.inc({ method, route, status_code: statusCode.toString(), bot_tier: botTier });
  }
  
  /**
   * Observe HTTP request duration
   */
  public observeHttpRequestDuration(method: string, route: string, statusCode: number, durationSeconds: number): void {
    this.httpRequestDurationHistogram.observe(
      { method, route, status_code: statusCode.toString() },
      durationSeconds
    );
  }
  
  /**
   * Increment API error counter
   */
  public incrementApiErrorCounter(route: string, errorType: string, botTier: string = 'unknown'): void {
    this.apiErrorCounter.inc({ route, error_type: errorType, bot_tier: botTier });
  }
  
  /**
   * Increment credits purchased counter
   */
  public incrementCreditsPurchasedCounter(botId: string, botTier: string, paymentStatus: string, amount: number): void {
    this.creditsPurchasedCounter.inc({ bot_id: botId, bot_tier: botTier, payment_status: paymentStatus }, amount);
  }
  
  /**
   * Increment credits used counter
   */
  public incrementCreditsUsedCounter(botId: string, botTier: string, endpoint: string, amount: number = 1): void {
    this.creditsUsedCounter.inc({ bot_id: botId, bot_tier: botTier, endpoint }, amount);
  }
  
  /**
   * Set active bots gauge
   */
  public setActiveBotsGauge(tier: string, count: number): void {
    this.activeBotsGauge.set({ tier }, count);
  }
  
  /**
   * Increment webhook delivery counter
   */
  public incrementWebhookDeliveryCounter(eventType: string, success: boolean): void {
    this.webhookDeliveryCounter.inc({ event_type: eventType, success: success.toString() });
  }
  
  /**
   * Increment webhook failure counter
   */
  public incrementWebhookFailureCounter(eventType: string, errorType: string): void {
    this.webhookFailureCounter.inc({ event_type: eventType, error_type: errorType });
  }
  
  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
  
  /**
   * Reset all metrics (for testing)
   */
  public resetMetrics(): void {
    this.registry.resetMetrics();
  }
}
