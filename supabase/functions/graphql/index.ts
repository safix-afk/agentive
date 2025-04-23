import { ApolloServer } from 'apollo-server-micro';
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { typeDefs } from './schema.ts';
import { resolvers } from './resolvers.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyApiKey } from '../_shared/auth.ts';

// Create Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable introspection for GraphQL Playground
});

// Start the Apollo Server
await apolloServer.start();

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle GraphQL requests
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Pass context to resolvers
    const context = {
      req,
      botInfo,
      sandboxMode,
      supabase
    };

    // Handle GraphQL request
    const { body, headers } = await apolloServer.executeOperation(
      await req.json(),
      { contextValue: context }
    );

    return new Response(
      JSON.stringify(body),
      {
        headers: {
          ...corsHeaders,
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing GraphQL request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
