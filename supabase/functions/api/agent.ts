import { corsHeaders } from '../_shared/cors.ts';
import { SupabaseClient } from '@supabase/supabase-js';

// Define types for agent requests and responses
interface AgentRequestBody {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  tools?: AgentTool[];
  context?: string[];
}

interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface AgentResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created: number;
}

/**
 * Handle agent requests
 */
export async function handleAgent(req: Request, supabase: SupabaseClient, botInfo: any, sandboxMode: boolean) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' and 'agent' in the path if present
    const startIndex = path.findIndex(segment => segment === 'agent') + 1;
    const action = path[startIndex];
    
    // Route to appropriate handler
    if (req.method === 'POST' && !action) {
      return await executeAgent(req, supabase, botInfo, sandboxMode);
    } else if (req.method === 'GET' && action === 'models') {
      return await getAvailableModels(req, supabase, botInfo, sandboxMode);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error handling agent request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Execute an agent with the given prompt
 */
async function executeAgent(req: Request, supabase: SupabaseClient, botInfo: any, sandboxMode: boolean) {
  try {
    // Parse request body
    const body: AgentRequestBody = await req.json();
    
    // Validate request
    if (!body.prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Set default values
    const model = body.model || 'gpt-4o';
    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.maxTokens ?? 1000;
    const stream = body.stream ?? false;
    const systemPrompt = body.systemPrompt || 'You are a helpful AI assistant.';
    
    // Check if streaming is requested
    if (stream) {
      return streamAgentResponse(req, body, botInfo, sandboxMode);
    }
    
    // Determine which AI provider to use based on the model
    let response: AgentResponse;
    if (model.startsWith('claude')) {
      response = await callAnthropicAPI(body, botInfo);
    } else {
      response = await callOpenAIAPI(body, botInfo);
    }
    
    // Track usage in database if not in sandbox mode
    if (!sandboxMode) {
      await trackAgentUsage(supabase, botInfo.id, response.usage.totalTokens, model);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        response
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error executing agent:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to execute agent', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Stream agent response using Server-Sent Events
 */
async function streamAgentResponse(req: Request, body: AgentRequestBody, botInfo: any, sandboxMode: boolean) {
  const encoder = new TextEncoder();
  const model = body.model || 'gpt-4o';
  
  // Create a TransformStream for streaming the response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start streaming in a separate async process
  (async () => {
    try {
      // Determine which AI provider to use based on the model
      if (model.startsWith('claude')) {
        await streamAnthropicResponse(writer, body, botInfo);
      } else {
        await streamOpenAIResponse(writer, body, botInfo);
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      const errorMessage = JSON.stringify({ error: 'Streaming error', details: error.message });
      writer.write(encoder.encode(`data: ${errorMessage}\n\n`));
    } finally {
      writer.write(encoder.encode('data: [DONE]\n\n'));
      writer.close();
    }
  })();
  
  return new Response(stream.readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

/**
 * Call OpenAI API
 */
async function callOpenAIAPI(body: AgentRequestBody, botInfo: any): Promise<AgentResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const model = body.model || 'gpt-4o';
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: body.systemPrompt || 'You are a helpful AI assistant.' }
  ];
  
  // Add context messages if provided
  if (body.context && body.context.length > 0) {
    for (const contextItem of body.context) {
      messages.push({ role: 'user', content: contextItem });
      messages.push({ role: 'assistant', content: 'I understand.' });
    }
  }
  
  // Add the user's prompt
  messages.push({ role: 'user', content: body.prompt });
  
  const requestBody = {
    model,
    messages,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.maxTokens ?? 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  
  // Add tools if provided
  if (body.tools && body.tools.length > 0) {
    requestBody.tools = body.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.keys(tool.parameters).filter(key => 
            tool.parameters[key].required
          )
        }
      }
    }));
    requestBody.tool_choice = 'auto';
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  
  return {
    id: data.id,
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    },
    created: data.created
  };
}

/**
 * Call Anthropic API (Claude)
 */
async function callAnthropicAPI(body: AgentRequestBody, botInfo: any): Promise<AgentResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  const model = body.model || 'claude-3-5-sonnet-20240620';
  const url = 'https://api.anthropic.com/v1/messages';
  
  const messages = [];
  
  // Add context messages if provided
  if (body.context && body.context.length > 0) {
    for (const contextItem of body.context) {
      messages.push({ role: 'user', content: contextItem });
      messages.push({ role: 'assistant', content: 'I understand.' });
    }
  }
  
  // Add the user's prompt
  messages.push({ role: 'user', content: body.prompt });
  
  const requestBody = {
    model,
    messages,
    system: body.systemPrompt || 'You are a helpful AI assistant.',
    temperature: body.temperature ?? 0.7,
    max_tokens: body.maxTokens ?? 1000
  };
  
  // Add tools if provided
  if (body.tools && body.tools.length > 0) {
    requestBody.tools = body.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters,
        required: Object.keys(tool.parameters).filter(key => 
          tool.parameters[key].required
        )
      }
    }));
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  
  // Anthropic doesn't provide token counts in the same format as OpenAI
  // We'll estimate based on a rough heuristic
  const promptLength = JSON.stringify(requestBody).length;
  const completionLength = data.content[0].text.length;
  const promptTokens = Math.ceil(promptLength / 4);
  const completionTokens = Math.ceil(completionLength / 4);
  
  return {
    id: data.id,
    content: data.content[0].text,
    model: data.model,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    },
    created: Date.now() / 1000
  };
}

/**
 * Stream OpenAI response
 */
async function streamOpenAIResponse(writer: WritableStreamDefaultWriter, body: AgentRequestBody, botInfo: any) {
  const encoder = new TextEncoder();
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const model = body.model || 'gpt-4o';
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: body.systemPrompt || 'You are a helpful AI assistant.' }
  ];
  
  // Add context messages if provided
  if (body.context && body.context.length > 0) {
    for (const contextItem of body.context) {
      messages.push({ role: 'user', content: contextItem });
      messages.push({ role: 'assistant', content: 'I understand.' });
    }
  }
  
  // Add the user's prompt
  messages.push({ role: 'user', content: body.prompt });
  
  const requestBody = {
    model,
    messages,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.maxTokens ?? 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true
  };
  
  // Add tools if provided
  if (body.tools && body.tools.length > 0) {
    requestBody.tools = body.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.keys(tool.parameters).filter(key => 
            tool.parameters[key].required
          )
        }
      }
    }));
    requestBody.tool_choice = 'auto';
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || JSON.stringify(error)}`);
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0].delta.content) {
            const content = parsed.choices[0].delta.content;
            writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch (e) {
          console.error('Error parsing streaming data:', e);
        }
      }
    }
  }
}

/**
 * Stream Anthropic response
 */
async function streamAnthropicResponse(writer: WritableStreamDefaultWriter, body: AgentRequestBody, botInfo: any) {
  const encoder = new TextEncoder();
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  const model = body.model || 'claude-3-5-sonnet-20240620';
  const url = 'https://api.anthropic.com/v1/messages';
  
  const messages = [];
  
  // Add context messages if provided
  if (body.context && body.context.length > 0) {
    for (const contextItem of body.context) {
      messages.push({ role: 'user', content: contextItem });
      messages.push({ role: 'assistant', content: 'I understand.' });
    }
  }
  
  // Add the user's prompt
  messages.push({ role: 'user', content: body.prompt });
  
  const requestBody = {
    model,
    messages,
    system: body.systemPrompt || 'You are a helpful AI assistant.',
    temperature: body.temperature ?? 0.7,
    max_tokens: body.maxTokens ?? 1000,
    stream: true
  };
  
  // Add tools if provided
  if (body.tools && body.tools.length > 0) {
    requestBody.tools = body.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters,
        required: Object.keys(tool.parameters).filter(key => 
          tool.parameters[key].required
        )
      }
    }));
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || JSON.stringify(error)}`);
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta.text) {
            const content = parsed.delta.text;
            writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch (e) {
          console.error('Error parsing streaming data:', e);
        }
      }
    }
  }
}

/**
 * Get available AI models
 */
async function getAvailableModels(req: Request, supabase: SupabaseClient, botInfo: any, sandboxMode: boolean) {
  try {
    // Define available models
    const models = [
      {
        id: 'gpt-4o',
        provider: 'openai',
        name: 'GPT-4o',
        description: 'OpenAI\'s most capable model for text, vision, and reasoning',
        contextWindow: 128000,
        costPer1KTokens: { input: 0.01, output: 0.03 }
      },
      {
        id: 'gpt-4-turbo',
        provider: 'openai',
        name: 'GPT-4 Turbo',
        description: 'Powerful language model with strong reasoning capabilities',
        contextWindow: 128000,
        costPer1KTokens: { input: 0.01, output: 0.03 }
      },
      {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective language model',
        contextWindow: 16000,
        costPer1KTokens: { input: 0.0005, output: 0.0015 }
      },
      {
        id: 'claude-3-5-sonnet-20240620',
        provider: 'anthropic',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic\'s most capable model with strong reasoning',
        contextWindow: 200000,
        costPer1KTokens: { input: 0.003, output: 0.015 }
      },
      {
        id: 'claude-3-opus-20240229',
        provider: 'anthropic',
        name: 'Claude 3 Opus',
        description: 'Anthropic\'s most powerful model for complex tasks',
        contextWindow: 200000,
        costPer1KTokens: { input: 0.015, output: 0.075 }
      },
      {
        id: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and cost for most tasks',
        contextWindow: 200000,
        costPer1KTokens: { input: 0.003, output: 0.015 }
      }
    ];
    
    // Filter models based on bot tier
    let availableModels = models;
    if (!sandboxMode && botInfo.tier) {
      switch (botInfo.tier) {
        case 'FREE':
          availableModels = models.filter(m => 
            m.id === 'gpt-3.5-turbo' || 
            m.id === 'claude-3-sonnet-20240229'
          );
          break;
        case 'PREMIUM':
          availableModels = models.filter(m => 
            m.id !== 'claude-3-opus-20240229'
          );
          break;
        case 'ENTERPRISE':
          // All models available
          break;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        models: availableModels
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting available models:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Track agent usage in the database
 */
async function trackAgentUsage(
  supabase: SupabaseClient, 
  botId: string, 
  tokens: number, 
  model: string
) {
  try {
    // Calculate credit cost based on model and tokens
    let creditCost = 0;
    
    // Simplified cost calculation
    if (model.includes('gpt-4')) {
      creditCost = tokens * 0.00003; // $0.03 per 1K tokens
    } else if (model.includes('gpt-3.5')) {
      creditCost = tokens * 0.000001; // $0.001 per 1K tokens
    } else if (model.includes('claude-3-opus')) {
      creditCost = tokens * 0.00005; // $0.05 per 1K tokens
    } else if (model.includes('claude-3')) {
      creditCost = tokens * 0.00001; // $0.01 per 1K tokens
    } else {
      creditCost = tokens * 0.00001; // Default cost
    }
    
    // Round up to nearest credit (1 credit = $0.01)
    creditCost = Math.max(1, Math.ceil(creditCost * 100));
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Update API usage for today
    const { data: existingUsage, error: fetchError } = await supabase
      .from('api_usage')
      .select('*')
      .eq('bot_id', botId)
      .eq('date', today)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching API usage:', fetchError);
      throw fetchError;
    }
    
    if (existingUsage) {
      // Update existing usage record
      const { error: updateError } = await supabase
        .from('api_usage')
        .update({
          request_count: existingUsage.request_count + 1,
          token_count: existingUsage.token_count + tokens,
          credits_used: existingUsage.credits_used + creditCost
        })
        .eq('id', existingUsage.id);
      
      if (updateError) {
        console.error('Error updating API usage:', updateError);
        throw updateError;
      }
    } else {
      // Create new usage record
      const { error: insertError } = await supabase
        .from('api_usage')
        .insert({
          bot_id: botId,
          date: today,
          request_count: 1,
          token_count: tokens,
          credits_used: creditCost
        });
      
      if (insertError) {
        console.error('Error inserting API usage:', insertError);
        throw insertError;
      }
    }
    
    // Deduct credits from balance
    const { error: creditError } = await supabase.rpc('deduct_credits', {
      p_bot_id: botId,
      p_credits: creditCost
    });
    
    if (creditError) {
      console.error('Error deducting credits:', creditError);
      throw creditError;
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking agent usage:', error);
    return false;
  }
}
