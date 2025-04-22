import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth headers
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

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status code
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
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from the server.');
    } else {
      // Error setting up the request
      console.error('Error setting up the request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

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

export default api;
