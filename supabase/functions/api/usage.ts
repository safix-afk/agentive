import { corsHeaders } from '../_shared/cors.ts';

export async function handleUsage(req, supabase, botInfo, sandboxMode) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' and 'usage' in the path if present
    const startIndex = path.findIndex(segment => segment === 'usage') + 1;
    const subResource = path[startIndex];
    
    switch (subResource) {
      case 'history':
        return await getUsageHistory(req, supabase, botInfo, sandboxMode);
      case 'endpoints':
        return await getEndpointUsage(req, supabase, botInfo, sandboxMode);
      default:
        return await getUsage(req, supabase, botInfo, sandboxMode);
    }
  } catch (error) {
    console.error('Error handling usage request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get current usage stats for a bot
 */
async function getUsage(req, supabase, botInfo, sandboxMode) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // For sandbox mode, return mock data
    if (sandboxMode) {
      const today = new Date().toISOString().split('T')[0];
      
      // Create mock usage data
      const mockUsage = {
        creditsRemaining: botInfo.creditsRemaining,
        usageToday: Math.floor(Math.random() * 500),
        dailyLimit: 1000,
        resetDate: getNextResetDate().toISOString(),
        date: today
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          usage: mockUsage
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get credit balance
    const { data: balance, error: balanceError } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('bot_id', botInfo.id)
      .single();
    
    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Error fetching credit balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage, error: usageError } = await supabase
      .from('api_usage')
      .select('*')
      .eq('bot_id', botInfo.id)
      .eq('date', today)
      .single();
    
    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error fetching usage:', usageError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch usage data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const usageData = {
      creditsRemaining: balance?.credits_remaining || 0,
      usageToday: usage?.request_count || 0,
      dailyLimit: balance?.daily_limit || 1000,
      resetDate: balance?.reset_date || getNextResetDate().toISOString(),
      date: today
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        usage: usageData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting usage:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get usage history for a bot
 */
async function getUsageHistory(req, supabase, botInfo, sandboxMode) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // For sandbox mode, return mock data
    if (sandboxMode) {
      // Generate mock usage history
      const history = [];
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random usage between 100-800
        const requestCount = Math.floor(Math.random() * 700) + 100;
        const successCount = Math.floor(requestCount * 0.95);
        const errorCount = requestCount - successCount;
        
        history.push({
          date: dateStr,
          requestCount,
          successCount,
          errorCount,
          creditsUsed: requestCount
        });
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          history
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get usage history
    const { data: history, error } = await supabase
      .from('api_usage')
      .select('date, request_count, success_count, error_count, credits_used')
      .eq('bot_id', botInfo.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching usage history:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch usage history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Format response
    const formattedHistory = history.map(record => ({
      date: record.date,
      requestCount: record.request_count,
      successCount: record.success_count,
      errorCount: record.error_count,
      creditsUsed: record.credits_used
    }));
    
    return new Response(
      JSON.stringify({
        success: true,
        history: formattedHistory
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting usage history:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get endpoint usage breakdown for a bot
 */
async function getEndpointUsage(req, supabase, botInfo, sandboxMode) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // For sandbox mode, return mock data
    if (sandboxMode) {
      // Mock endpoints
      const endpoints = [
        '/v1/chat/completions',
        '/v1/completions',
        '/v1/embeddings',
        '/v1/images/generations'
      ];
      
      // Generate mock endpoint usage
      const endpointUsage = {};
      let totalRequests = 0;
      
      endpoints.forEach(endpoint => {
        // Random count between 50-500
        const count = Math.floor(Math.random() * 450) + 50;
        endpointUsage[endpoint] = count;
        totalRequests += count;
      });
      
      // Calculate percentages
      const endpointBreakdown = Object.entries(endpointUsage).map(([endpoint, count]) => ({
        endpoint,
        count,
        percentage: Math.round((count / totalRequests) * 100)
      }));
      
      return new Response(
        JSON.stringify({
          success: true,
          totalRequests,
          endpointBreakdown
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get usage records
    const { data: usageRecords, error } = await supabase
      .from('api_usage')
      .select('endpoint_breakdown, request_count')
      .eq('bot_id', botInfo.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);
    
    if (error) {
      console.error('Error fetching endpoint usage:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch endpoint usage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Aggregate endpoint usage
    const endpointUsage = {};
    let totalRequests = 0;
    
    usageRecords.forEach(record => {
      totalRequests += record.request_count;
      
      // Add endpoint counts
      Object.entries(record.endpoint_breakdown).forEach(([endpoint, count]) => {
        endpointUsage[endpoint] = (endpointUsage[endpoint] || 0) + count;
      });
    });
    
    // Calculate percentages
    const endpointBreakdown = Object.entries(endpointUsage).map(([endpoint, count]) => ({
      endpoint,
      count,
      percentage: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
    }));
    
    return new Response(
      JSON.stringify({
        success: true,
        totalRequests,
        endpointBreakdown
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting endpoint usage:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get the next usage reset date (midnight tomorrow)
 */
function getNextResetDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
