import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

/**
 * Verify API key against database
 */
export async function verifyApiKey(supabase, apiKey, botId) {
  try {
    // Hash the API key for comparison
    const apiKeyHash = hashApiKey(apiKey);
    
    // Query the bot credentials
    const { data: bot, error } = await supabase
      .from('bot_credentials')
      .select(`
        id, 
        name, 
        tier,
        is_active,
        credit_balances (
          credits_remaining,
          daily_limit
        )
      `)
      .eq('id', botId)
      .eq('api_key_hash', apiKeyHash)
      .eq('is_active', true)
      .single();
    
    if (error || !bot) {
      console.error('API key verification failed:', error);
      return null;
    }
    
    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('api_usage')
      .select('request_count')
      .eq('bot_id', botId)
      .eq('date', today)
      .single();
    
    return {
      id: bot.id,
      name: bot.name,
      tier: bot.tier,
      creditsRemaining: bot.credit_balances?.credits_remaining || 0,
      usageToday: usage?.request_count || 0
    };
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

/**
 * Hash an API key for secure storage
 */
function hashApiKey(apiKey) {
  const salt = Deno.env.get('API_KEY_SALT') || 'default-salt';
  return createHmac('sha256', salt).update(apiKey).digest('hex');
}

/**
 * Generate HMAC signature for webhook payloads
 */
export function generateHmacSignature(payload, secret) {
  return createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
}
