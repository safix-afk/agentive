import axios from 'axios';
import { useState, useEffect } from 'react';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track API availability to avoid repeated network errors
let isApiAvailable = false;
let hasLoggedNetworkError = false;

// Check API availability
const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1'}/health`, {
      method: 'HEAD',
      headers: {
        'x-api-key': 'test',
        'x-bot-id': 'test',
        'x-sandbox-mode': 'true'
      }
    });
    isApiAvailable = response.ok;
    return response.ok;
  } catch (error) {
    isApiAvailable = false;
    if (!hasLoggedNetworkError) {
      console.warn('API server is not available. Using mock responses.');
      hasLoggedNetworkError = true;
    }
    return false;
  }
};

// Initial check
checkApiAvailability();

// API request interceptor
api.interceptors.request.use(
  (config) => {
    // Get credentials from localStorage
    const botId = typeof window !== 'undefined' ? localStorage.getItem('agentive_bot_id') : '';
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('agentive_api_key') : '';
    
    // Add auth headers if credentials exist
    if (botId && apiKey) {
      config.headers['X-Bot-ID'] = botId;
      config.headers['X-API-Key'] = apiKey;
    }
    
    // Check if sandbox mode is enabled
    const sandboxMode = typeof window !== 'undefined' ? localStorage.getItem('agentive_sandbox_mode') === 'true' : false;
    if (sandboxMode) {
      config.headers['X-Sandbox-Mode'] = 'true';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API response interceptor
api.interceptors.response.use(
  (response) => {
    // Successful response
    return response;
  },
  async (error) => {
    // Handle network errors gracefully
    if (error.code === 'ERR_NETWORK') {
      // Check if API is available
      const available = await checkApiAvailability();
      
      // If API is not available, provide mock responses based on the request
      if (!available) {
        const config = error.config;
        
        // Extract the endpoint from the URL
        const url = config.url;
        const method = config.method;
        
        // Generate mock response based on the endpoint
        if (url.includes('/bot') && method === 'get') {
          return {
            data: getMockBotInfo()
          };
        } else if (url.includes('/purchase-credits') && method === 'post') {
          return {
            data: getMockPurchaseResponse(config.data)
          };
        } else if (url.includes('/usage') && method === 'get') {
          return {
            data: getMockUsageData()
          };
        } else if (url.includes('/webhooks') && method === 'get') {
          return {
            data: getMockWebhooksData()
          };
        } else if (url.includes('/analytics') && method === 'get') {
          const botId = url.split('?botId=')[1];
          return {
            data: getMockAnalyticsData(botId)
          };
        }
      }
    }
    
    // Handle error responses from the API
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear credentials
          if (typeof window !== 'undefined') {
            localStorage.removeItem('agentive_bot_id');
            localStorage.removeItem('agentive_api_key');
          }
          break;
        case 429:
          // Rate limited
          console.warn('Rate limit exceeded. Please try again later.');
          break;
      }
    }
    
    return Promise.reject(error);
  }
);

// Mock data generators
function getMockBotInfo() {
  const botId = typeof window !== 'undefined' ? localStorage.getItem('agentive_bot_id') : 'mock-bot-id';
  
  return {
    success: true,
    bot: {
      id: botId || 'mock-bot-id',
      name: 'Mock Bot',
      tier: 'PREMIUM',
      creditsRemaining: 1000,
      usageToday: 0,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

function getMockPurchaseResponse(requestData) {
  let data = { amount: 100 };
  
  try {
    if (requestData) {
      data = JSON.parse(requestData);
    }
  } catch (e) {
    console.error('Error parsing purchase data:', e);
  }
  
  return {
    success: true,
    transaction: {
      id: `mock-transaction-${Date.now()}`,
      amount: data.amount || 100,
      credits: data.amount || 100,
      status: 'completed',
      createdAt: new Date().toISOString()
    }
  };
}

function getMockUsageData() {
  return {
    success: true,
    usage: {
      daily: [
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], requests: 5, tokens: 1200, credits: 12 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], requests: 8, tokens: 2100, credits: 21 },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], requests: 12, tokens: 3500, credits: 35 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], requests: 7, tokens: 1800, credits: 18 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], requests: 10, tokens: 2500, credits: 25 },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], requests: 15, tokens: 4200, credits: 42 },
        { date: new Date().toISOString().split('T')[0], requests: 3, tokens: 800, credits: 8 }
      ],
      total: {
        requests: 60,
        tokens: 16100,
        credits: 161
      }
    }
  };
}

function getMockWebhooksData() {
  return {
    success: true,
    webhooks: [
      {
        id: 'mock-webhook-1',
        url: 'https://example.com/webhook1',
        events: ['credit.purchase', 'credit.usage'],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'mock-webhook-2',
        url: 'https://example.com/webhook2',
        events: ['bot.update'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
}

function getMockAnalyticsData(botId: string) {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - 23 + i);
    return date.getHours() + ':00';
  });
  
  const hourlyData = Array.from({ length: 24 }, () => 
    Math.floor(Math.random() * 100) + 10
  );
  
  const endpoints = [
    'agent', 'bot', 'purchase', 'usage', 'webhooks', 'graphql'
  ];
  
  const errorData = endpoints.map(() => 
    Math.floor(Math.random() * 20)
  );
  
  const totalCalls = hourlyData.reduce((sum, val) => sum + val, 0);
  const totalErrors = errorData.reduce((sum, val) => sum + val, 0);
  const averageLatency = Math.floor(Math.random() * 300) + 50; // 50-350ms
  
  return {
    data: {
      hourlyApiCalls: {
        labels: hours,
        data: hourlyData
      },
      errorsByEndpoint: {
        labels: endpoints,
        data: errorData
      },
      summary: {
        totalCalls,
        totalErrors,
        averageLatency
      }
    }
  };
}

// API endpoints
export const endpoints = {
  // Bot endpoints
  getBotInfo: (botId: string) => api.get(`/bot/${botId}`),
  
  // Credit purchase endpoints
  purchaseCredits: (data: { botId: string; amount: number; paymentMethodId?: string }) => 
    api.post('/purchase-credits', data),
  
  // Usage endpoints
  getUsage: (botId: string, period?: string) => 
    api.get(`/usage?botId=${botId}${period ? `&period=${period}` : ''}`),
  
  // Webhook endpoints
  getWebhooks: (botId: string) => api.get(`/webhooks?botId=${botId}`),
  registerWebhook: (data: { botId: string; url: string; eventType: string; description?: string }) => 
    api.post('/webhooks/register', data),
  deleteWebhook: (webhookId: string) => api.delete(`/webhooks/${webhookId}`),
  testWebhook: (webhookId: string, eventType: string) => 
    api.post(`/webhooks/test/${webhookId}`, { eventType }),
  
  // Analytics endpoints
  getAnalytics: async (botId: string) => {
    try {
      const response = await api.get(`/analytics?botId=${botId}`);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error) && error.message.includes('Network Error')) {
        console.warn('API not available, returning mock analytics data');
        
        // Generate mock analytics data
        const hours = Array.from({ length: 24 }, (_, i) => {
          const date = new Date();
          date.setHours(date.getHours() - 23 + i);
          return date.getHours() + ':00';
        });
        
        const hourlyData = Array.from({ length: 24 }, () => 
          Math.floor(Math.random() * 100) + 10
        );
        
        const endpoints = [
          'agent', 'bot', 'purchase', 'usage', 'webhooks', 'graphql'
        ];
        
        const errorData = endpoints.map(() => 
          Math.floor(Math.random() * 20)
        );
        
        const totalCalls = hourlyData.reduce((sum, val) => sum + val, 0);
        const totalErrors = errorData.reduce((sum, val) => sum + val, 0);
        const averageLatency = Math.floor(Math.random() * 300) + 50; // 50-350ms
        
        return {
          data: {
            hourlyApiCalls: {
              labels: hours,
              data: hourlyData
            },
            errorsByEndpoint: {
              labels: endpoints,
              data: errorData
            },
            summary: {
              totalCalls,
              totalErrors,
              averageLatency
            }
          }
        };
      }
      throw error;
    }
  },
};

// Custom hooks for API operations
export const useApiKey = () => {
  const getBotId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agentive_bot_id') || '';
    }
    return '';
  };

  const getApiKey = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agentive_api_key') || '';
    }
    return '';
  };

  const setBotId = (botId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentive_bot_id', botId);
    }
  };

  const setApiKey = (apiKey: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentive_api_key', apiKey);
    }
  };

  const clearCredentials = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentive_bot_id');
      localStorage.removeItem('agentive_api_key');
    }
  };
  
  const hasCredentials = () => {
    return !!(getBotId() && getApiKey());
  };
  
  return {
    getBotId,
    getApiKey,
    setBotId,
    setApiKey,
    clearCredentials,
    hasCredentials,
  };
};

// Agent API functions
export const useAgentApi = () => {
  const { hasCredentials, getBotId, getApiKey } = useApiKey();
  const [apiAvailable, setApiAvailable] = useState(false);
  
  // Check API availability
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1'}/agent/models`, {
          method: 'HEAD',
          headers: {
            'x-api-key': 'test',
            'x-bot-id': 'test',
            'x-sandbox-mode': 'true'
          }
        });
        setApiAvailable(response.ok);
      } catch (error) {
        setApiAvailable(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      checkApiAvailability();
    }
  }, []);

  const executeAgent = async (prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    tools?: any[];
    context?: string[];
  }) => {
    if (!hasCredentials()) {
      throw new Error('API credentials required');
    }

    if (!apiAvailable) {
      // Return mock response if API is not available
      return mockAgentResponse(prompt);
    }

    try {
      const response = await api.post('/agent', {
        prompt,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error executing agent:', error);
      return mockAgentResponse(prompt);
    }
  };

  const streamAgent = async (
    prompt: string, 
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      tools?: any[];
      context?: string[];
    }
  ) => {
    if (!hasCredentials()) {
      throw new Error('API credentials required');
    }

    if (!apiAvailable) {
      // Provide mock streaming response if API is not available
      return mockStreamingResponse(prompt, onChunk, onComplete);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1'}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': getApiKey(),
          'x-bot-id': getBotId(),
          ...(typeof window !== 'undefined' && localStorage.getItem('agentive_sandbox_mode') === 'true' 
            ? { 'x-sandbox-mode': 'true' } 
            : {})
        },
        body: JSON.stringify({
          prompt,
          stream: true,
          ...options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stream agent response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error streaming agent response:', error);
      // Fall back to mock streaming if real streaming fails
      return mockStreamingResponse(prompt, onChunk, onComplete);
    }
  };

  const getAvailableModels = async () => {
    if (!hasCredentials()) {
      throw new Error('API credentials required');
    }

    // If API is not available, return default models without making the API call
    if (!apiAvailable) {
      return {
        success: true,
        models: getDefaultModels()
      };
    }

    try {
      const response = await api.get('/agent/models');
      return response.data;
    } catch (error) {
      // Only log once and return default models
      console.warn('API not available, using default models');
      return {
        success: true,
        models: getDefaultModels()
      };
    }
  };

  // Helper function to get default models
  const getDefaultModels = () => {
    return [
      {
        id: 'gpt-4o',
        provider: 'openai',
        name: 'GPT-4o',
        description: 'OpenAI\'s most capable model for text, vision, and reasoning',
      },
      {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective language model',
      },
      {
        id: 'claude-3-5-sonnet',
        provider: 'anthropic',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic\'s most capable model with strong reasoning',
      }
    ];
  };

  // Helper function to generate mock responses
  const mockAgentResponse = (prompt: string) => {
    const content = generateMockResponseText(prompt);
    return {
      success: true,
      response: {
        id: `mock-${Date.now()}`,
        content,
        model: 'mock-model',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        created: Date.now() / 1000
      }
    };
  };

  // Helper function to simulate streaming for mock responses
  const mockStreamingResponse = (
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ) => {
    const content = generateMockResponseText(prompt);
    const chunks = content.split(' ');
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < chunks.length) {
        onChunk(chunks[i] + ' ');
        i++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
  };

  // Generate mock response text based on prompt
  const generateMockResponseText = (prompt: string): string => {
    const responses = {
      greeting: "Hello! I'm the Agentive AI assistant. I can help you with web browsing and desktop automation tasks. How can I assist you today?",
      capabilities: "Agentive can help you with a variety of tasks including web browsing, data extraction, form filling, and desktop automation. Our AI agents can be customized to handle specific workflows for your business needs.",
      pricing: "Agentive offers several pricing tiers: Free (limited features), Premium ($49/month with advanced capabilities), and Enterprise (custom pricing with full feature set and dedicated support).",
      features: "Key features of Agentive include: AI-powered web automation, desktop integration, customizable agent prompts, webhook notifications, and comprehensive usage analytics.",
      default: "I'm a simulated response since the backend API is not currently connected. In the full version, I would provide more detailed and contextual responses based on your specific query."
    };

    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('hello') || promptLower.includes('hi') || promptLower.includes('hey')) {
      return responses.greeting;
    } else if (promptLower.includes('can you do') || promptLower.includes('capabilities') || promptLower.includes('what can')) {
      return responses.capabilities;
    } else if (promptLower.includes('price') || promptLower.includes('cost') || promptLower.includes('pricing')) {
      return responses.pricing;
    } else if (promptLower.includes('feature') || promptLower.includes('functionality')) {
      return responses.features;
    } else {
      return responses.default;
    }
  };

  return {
    executeAgent,
    streamAgent,
    getAvailableModels,
    apiAvailable
  };
};

export default api;
