import { corsHeaders } from '../_shared/cors.ts';
import { generateHmacSignature } from '../_shared/auth.ts';

export async function handleWebhooks(req, supabase, botInfo, sandboxMode) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' and 'webhooks' in the path if present
    const startIndex = path.findIndex(segment => segment === 'webhooks') + 1;
    const webhookId = path[startIndex];
    const action = path[startIndex + 1];
    
    // Route to appropriate handler
    if (req.method === 'POST' && !webhookId) {
      return await registerWebhook(req, supabase, botInfo, sandboxMode);
    } else if (req.method === 'GET' && !webhookId) {
      return await getWebhooks(req, supabase, botInfo, sandboxMode);
    } else if (req.method === 'DELETE' && webhookId) {
      return await deleteWebhook(req, supabase, botInfo, sandboxMode, webhookId);
    } else if (req.method === 'POST' && webhookId && action === 'test') {
      return await testWebhook(req, supabase, botInfo, sandboxMode, webhookId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error handling webhook request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Register a new webhook
 */
async function registerWebhook(req, supabase, botInfo, sandboxMode) {
  try {
    // Parse request body
    const body = await req.json();
    const { url, eventType, description } = body;
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid webhook URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate event type
    const validEventTypes = ['ALL', 'PURCHASE', 'USAGE', 'BOT'];
    if (!eventType || !validEventTypes.includes(eventType.toUpperCase())) {
      return new Response(
        JSON.stringify({ 
          error: 'Please provide a valid event type',
          validEventTypes
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For sandbox mode, simulate webhook registration
    if (sandboxMode) {
      const webhookId = crypto.randomUUID();
      
      return new Response(
        JSON.stringify({
          success: true,
          webhook: {
            id: webhookId,
            url,
            eventType: eventType.toUpperCase(),
            description: description || '',
            createdAt: new Date().toISOString()
          }
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create webhook
    const webhookId = crypto.randomUUID();
    const { error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        id: webhookId,
        bot_id: botInfo.id,
        url,
        event_type: eventType.toUpperCase(),
        description: description || ''
      });
    
    if (error) {
      console.error('Error registering webhook:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to register webhook' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        webhook: {
          id: webhookId,
          url,
          eventType: eventType.toUpperCase(),
          description: description || '',
          createdAt: new Date().toISOString()
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error registering webhook:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get all webhooks for a bot
 */
async function getWebhooks(req, supabase, botInfo, sandboxMode) {
  try {
    // For sandbox mode, return mock webhooks
    if (sandboxMode) {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook1',
          eventType: 'ALL',
          description: 'Example webhook 1',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'webhook-2',
          url: 'https://example.com/webhook2',
          eventType: 'PURCHASE',
          description: 'Purchase notifications',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      return new Response(
        JSON.stringify({
          success: true,
          webhooks: mockWebhooks
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get webhooks
    const { data: webhooks, error } = await supabase
      .from('webhook_subscriptions')
      .select('id, url, event_type, description, created_at')
      .eq('bot_id', botInfo.id);
    
    if (error) {
      console.error('Error fetching webhooks:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhooks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Format response
    const formattedWebhooks = webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      eventType: webhook.event_type,
      description: webhook.description,
      createdAt: webhook.created_at
    }));
    
    return new Response(
      JSON.stringify({
        success: true,
        webhooks: formattedWebhooks
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting webhooks:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Delete a webhook
 */
async function deleteWebhook(req, supabase, botInfo, sandboxMode, webhookId) {
  try {
    // For sandbox mode, simulate webhook deletion
    if (sandboxMode) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook deleted successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Delete webhook
    const { error } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', webhookId)
      .eq('bot_id', botInfo.id);
    
    if (error) {
      console.error('Error deleting webhook:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete webhook' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook deleted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting webhook:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Test a webhook by sending a test event
 */
async function testWebhook(req, supabase, botInfo, sandboxMode, webhookId) {
  try {
    // Get webhook details
    let webhook = null;
    
    if (sandboxMode) {
      // Mock webhook for sandbox mode
      webhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        event_type: 'ALL'
      };
    } else {
      // Get webhook from database
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('id, url, event_type')
        .eq('id', webhookId)
        .eq('bot_id', botInfo.id)
        .single();
      
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Webhook not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      webhook = data;
    }
    
    // Create test payload
    const testPayload = {
      event: 'test',
      botId: botInfo.id,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook event'
      }
    };
    
    // Generate signature
    const hmacSecret = Deno.env.get('WEBHOOK_HMAC_SECRET') || 'test-secret';
    const signature = generateHmacSignature(testPayload, hmacSecret);
    
    // Send webhook
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Event-Type': 'test'
        },
        body: JSON.stringify(testPayload)
      });
      
      const responseStatus = response.status;
      let responseBody = '';
      
      try {
        responseBody = await response.text();
      } catch (e) {
        // Ignore response body errors
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test webhook sent',
          response: {
            status: responseStatus,
            body: responseBody
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send test webhook',
          details: fetchError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
