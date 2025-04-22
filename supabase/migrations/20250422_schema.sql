-- Create extension for UUID generation (IF NOT EXISTS prevents errors if already created)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables with IF NOT EXISTS to prevent errors if already created
CREATE TABLE IF NOT EXISTS bot_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('FREE', 'PREMIUM', 'ENTERPRISE')),
  api_key VARCHAR(255) UNIQUE,
  api_key_hash VARCHAR(255) UNIQUE,
  hmac_secret VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_credentials(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  total_credits_purchased INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_bot_credit_balance UNIQUE (bot_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_credentials(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  price_per_credit DECIMAL(10, 6) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('STRIPE', 'MANUAL')),
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  receipt_url TEXT,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_credentials(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  endpoint_breakdown JSONB NOT NULL DEFAULT '{}',
  error_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_bot_date_usage UNIQUE (bot_id, date)
);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_credentials(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ALL', 'PURCHASE', 'USAGE', 'BOT')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bot_credentials_api_key_hash') THEN
    CREATE INDEX idx_bot_credentials_api_key_hash ON bot_credentials(api_key_hash);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_credit_balances_bot_id') THEN
    CREATE INDEX idx_credit_balances_bot_id ON credit_balances(bot_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_bot_id') THEN
    CREATE INDEX idx_invoices_bot_id ON invoices(bot_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_usage_bot_id') THEN
    CREATE INDEX idx_api_usage_bot_id ON api_usage(bot_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_usage_date') THEN
    CREATE INDEX idx_api_usage_date ON api_usage(date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_webhook_subscriptions_bot_id') THEN
    CREATE INDEX idx_webhook_subscriptions_bot_id ON webhook_subscriptions(bot_id);
  END IF;
END $$;

-- Enable Row Level Security on all tables
ALTER TABLE bot_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create simple policies for all tables (allowing all operations for now)
-- Check if policies exist before creating them
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_credentials' AND policyname = 'Allow all operations on bot_credentials') THEN
    CREATE POLICY "Allow all operations on bot_credentials" ON bot_credentials FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_balances' AND policyname = 'Allow all operations on credit_balances') THEN
    CREATE POLICY "Allow all operations on credit_balances" ON credit_balances FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Allow all operations on invoices') THEN
    CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_usage' AND policyname = 'Allow all operations on api_usage') THEN
    CREATE POLICY "Allow all operations on api_usage" ON api_usage FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_subscriptions' AND policyname = 'Allow all operations on webhook_subscriptions') THEN
    CREATE POLICY "Allow all operations on webhook_subscriptions" ON webhook_subscriptions FOR ALL USING (true);
  END IF;
END $$;

-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bot_credentials_timestamp') THEN
    CREATE TRIGGER update_bot_credentials_timestamp
    BEFORE UPDATE ON bot_credentials
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_credit_balances_timestamp') THEN
    CREATE TRIGGER update_credit_balances_timestamp
    BEFORE UPDATE ON credit_balances
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_timestamp') THEN
    CREATE TRIGGER update_invoices_timestamp
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_api_usage_timestamp') THEN
    CREATE TRIGGER update_api_usage_timestamp
    BEFORE UPDATE ON api_usage
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_webhook_subscriptions_timestamp') THEN
    CREATE TRIGGER update_webhook_subscriptions_timestamp
    BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
  END IF;
END $$;
