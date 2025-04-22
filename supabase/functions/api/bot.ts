import { corsHeaders } from '../_shared/cors.ts';
import { hashApiKey } from '../_shared/auth.ts';

export async function handleBot(req, supabase, botInfo, sandboxMode) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' and 'bot' in the path if present
    const startIndex = path.findIndex(segment => segment === 'bot') + 1;
    const action = path[startIndex];
    
    // Route to appropriate handler
    if (req.method === 'GET' && !action) {
      return await getBotInfo(req, supabase, botInfo, sandboxMode);
    } else if (req.method === 'POST' && action === 'rotate-api-key') {
      return await rotateApiKey(req, supabase, botInfo, sandboxMode);
    } else if (req.method === 'PUT' && action === 'tier') {
      return await updateBotTier(req, supabase, botInfo, sandboxMode);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error handling bot request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get bot information
 */
async function getBotInfo(req, supabase, botInfo, sandboxMode) {
  try {
    // For sandbox mode, return mock bot info
    if (sandboxMode) {
      return new Response(
        JSON.stringify({
          success: true,
          bot: {
            id: botInfo.id,
            name: botInfo.name,
            tier: botInfo.tier,
            creditsRemaining: botInfo.creditsRemaining,
            usageToday: botInfo.usageToday,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get bot with credit balance
    const { data: bot, error } = await supabase
      .from('bot_credentials')
      .select(`
        id, 
        name, 
        tier,
        created_at,
        credit_balances (
          credits_remaining
        )
      `)
      .eq('id', botInfo.id)
      .single();
    
    if (error) {
      console.error('Error fetching bot info:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bot info' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('api_usage')
      .select('request_count')
      .eq('bot_id', botInfo.id)
      .eq('date', today)
      .single();
    
    return new Response(
      JSON.stringify({
        success: true,
        bot: {
          id: bot.id,
          name: bot.name,
          tier: bot.tier,
          creditsRemaining: bot.credit_balances?.credits_remaining || 0,
          usageToday: usage?.request_count || 0,
          createdAt: bot.created_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting bot info:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Rotate API key
 */
async function rotateApiKey(req, supabase, botInfo, sandboxMode) {
  try {
    // Generate new API key
    const newApiKey = generateApiKey();
    const newApiKeyHash = hashApiKey(newApiKey);
    
    // For sandbox mode, simulate API key rotation
    if (sandboxMode) {
      return new Response(
        JSON.stringify({
          success: true,
          apiKey: newApiKey
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update bot with new API key
    const { error } = await supabase
      .from('bot_credentials')
      .update({
        api_key: newApiKey,
        api_key_hash: newApiKeyHash
      })
      .eq('id', botInfo.id);
    
    if (error) {
      console.error('Error rotating API key:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to rotate API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        apiKey: newApiKey
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error rotating API key:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Update bot tier
 */
async function updateBotTier(req, supabase, botInfo, sandboxMode) {
  try {
    // Parse request body
    const body = await req.json();
    const { tier } = body;
    
    // Validate tier
    const validTiers = ['FREE', 'PREMIUM', 'ENTERPRISE'];
    if (!tier || !validTiers.includes(tier.toUpperCase())) {
      return new Response(
        JSON.stringify({ 
          error: 'Please provide a valid tier',
          validTiers
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For sandbox mode, simulate tier update
    if (sandboxMode) {
      return new Response(
        JSON.stringify({
          success: true,
          bot: {
            ...botInfo,
            tier: tier.toUpperCase()
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update bot tier
    const { error } = await supabase
      .from('bot_credentials')
      .update({
        tier: tier.toUpperCase()
      })
      .eq('id', botInfo.id);
    
    if (error) {
      console.error('Error updating bot tier:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update bot tier' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        bot: {
          ...botInfo,
          tier: tier.toUpperCase()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating bot tier:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Generate a random API key
 */
function generateApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
