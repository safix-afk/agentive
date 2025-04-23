import { handlePurchase } from '../api/purchase';
import { handleUsage } from '../api/usage';
import { handleWebhooks } from '../api/webhooks';
import { handleBot } from '../api/bot';
import { corsHeaders } from '../_shared/cors';

// Create a mock request object for the REST handlers
const createMockRequest = (method: string, path: string, body: any, headers: any) => {
  return {
    method,
    url: `http://localhost:3000/${path}`,
    headers: new Headers({
      ...corsHeaders,
      ...headers
    }),
    json: () => Promise.resolve(body)
  };
};

// Extract data from GraphQL context
const getContextData = (context: any) => {
  const { req, botInfo, sandboxMode, supabase } = context;
  const headers = req.headers || {};
  
  return {
    botInfo,
    sandboxMode,
    supabase,
    headers
  };
};

// GraphQL resolvers
export const resolvers = {
  Query: {
    // Get bot information
    getBot: async (_: any, { botId }: { botId: string }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const mockReq = createMockRequest('GET', `bot/${botId}`, null, headers);
      const response = await handleBot(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    },
    
    // Get usage statistics
    getUsage: async (_: any, { botId, period }: { botId: string, period?: string }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const path = period ? `usage?period=${period}` : 'usage';
      const mockReq = createMockRequest('GET', path, null, headers);
      const response = await handleUsage(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    },
    
    // Get webhook subscriptions
    getWebhooks: async (_: any, { botId }: { botId: string }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const mockReq = createMockRequest('GET', 'webhooks', null, headers);
      const response = await handleWebhooks(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    }
  },
  
  Mutation: {
    // Purchase credits
    purchaseCredits: async (_: any, { input }: { input: any }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const mockReq = createMockRequest('POST', 'purchase-credits', input, headers);
      const response = await handlePurchase(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    },
    
    // Create webhook subscription
    createWebhook: async (_: any, { input }: { input: any }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const mockReq = createMockRequest('POST', 'webhooks', input, headers);
      const response = await handleWebhooks(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    },
    
    // Delete webhook subscription
    deleteWebhook: async (_: any, { webhookId }: { webhookId: string }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const mockReq = createMockRequest('DELETE', `webhooks/${webhookId}`, null, headers);
      const response = await handleWebhooks(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    },
    
    // Test webhook
    testWebhook: async (_: any, { input }: { input: any }, context: any) => {
      const { botInfo, sandboxMode, supabase, headers } = getContextData(context);
      
      const mockReq = createMockRequest('POST', `webhooks/${input.webhookId}/test`, {
        event: input.event,
        payload: input.payload
      }, headers);
      const response = await handleWebhooks(mockReq, supabase, botInfo, sandboxMode);
      
      const data = await response.json();
      return data;
    }
  }
};
