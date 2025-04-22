import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyApiKey } from '../_shared/auth.ts';
import { handlePurchase } from './purchase.ts';
import { handleUsage } from './usage.ts';
import { handleWebhooks } from './webhooks.ts';
import { handleBot } from './bot.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' in the path if present
    const startIndex = path[0] === 'api' ? 1 : 0;
    const resource = path[startIndex];
    const method = req.method;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for sandbox mode
    const sandboxMode = req.headers.get('x-sandbox-mode') === 'true';
    
    // Verify API key for non-sandbox requests
    let botInfo = null;
    if (!sandboxMode) {
      const apiKey = req.headers.get('x-api-key');
      const botId = req.headers.get('x-bot-id');
      
      if (!apiKey || !botId) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      botInfo = await verifyApiKey(supabase, apiKey, botId);
      if (!botInfo) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create mock bot info for sandbox mode
      const botId = req.headers.get('x-bot-id') || 'sandbox-bot-demo';
      botInfo = {
        id: botId,
        name: `Sandbox ${botId.split('-').pop()?.charAt(0).toUpperCase()}${botId.split('-').pop()?.slice(1)} Bot`,
        tier: 'PREMIUM',
        creditsRemaining: 9999,
        usageToday: 0
      };
    }
    
    // Route to appropriate handler
    let response;
    switch (resource) {
      case 'purchase-credits':
        response = await handlePurchase(req, supabase, botInfo, sandboxMode);
        break;
      case 'usage':
        response = await handleUsage(req, supabase, botInfo, sandboxMode);
        break;
      case 'webhooks':
        response = await handleWebhooks(req, supabase, botInfo, sandboxMode);
        break;
      case 'bot':
        response = await handleBot(req, supabase, botInfo, sandboxMode);
        break;
      default:
        response = new Response(
          JSON.stringify({ error: 'Resource not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    return response;
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
