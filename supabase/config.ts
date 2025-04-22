import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema definitions for reference
export const TABLES = {
  BOT_CREDENTIALS: 'bot_credentials',
  CREDIT_BALANCES: 'credit_balances',
  INVOICES: 'invoices',
  API_USAGE: 'api_usage',
  WEBHOOK_SUBSCRIPTIONS: 'webhook_subscriptions'
};

// Supabase RLS policies are defined in the Supabase dashboard
// These ensure data security at the database level
