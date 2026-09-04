-- ============================================================
-- ShopNTrust — Complete Supabase Database Schema & RLS Policies
-- ============================================================
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qfjifooftpdcgvmlargl/sql
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Customer Profiles Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert/update own profile" ON public.profiles;
CREATE POLICY "Users can insert/update own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-handle new user profile creation from auth.users trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, preferred_categories)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    '["phones", "wearables", "headphones"]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Customer-Specific Persistent Carts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Carts
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;

-- Cart Policies
DROP POLICY IF EXISTS "Users can view own cart" ON public.customer_carts;
CREATE POLICY "Users can view own cart"
  ON public.customer_carts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can modify own cart" ON public.customer_carts;
CREATE POLICY "Users can modify own cart"
  ON public.customer_carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. AI Chat Sessions Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'AI Shopping Session',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Chat Sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Chat Sessions Policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can insert/update own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. AI Chat Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  recommended_product_ids JSONB DEFAULT '[]'::jsonb,
  extracted_intent JSONB DEFAULT '{}'::jsonb,
  matches JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. Viewed Products Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.viewed_products (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS for Viewed Products
ALTER TABLE public.viewed_products ENABLE ROW LEVEL SECURITY;

-- Viewed Products Policies
DROP POLICY IF EXISTS "Users can view own viewed products" ON public.viewed_products;
CREATE POLICY "Users can view own viewed products"
  ON public.viewed_products FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update own viewed products" ON public.viewed_products;
CREATE POLICY "Users can insert/update own viewed products"
  ON public.viewed_products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indices for Fast Querying
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_viewed_products_user ON public.viewed_products(user_id);

-- ============================================================
-- 7. Phase 8: Orders Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'payment_pending', 'completed', 'failed', 'cancelled')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'successful', 'failed')),
  payment_method TEXT DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  is_ai_assisted BOOLEAN DEFAULT false,
  ai_session_id TEXT,
  attribution_type TEXT CHECK (attribution_type IN ('manual', 'ai_recommendation', 'ai_upsell', 'ai_cross_sell', 'ai_mixed')),
  delivery_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================
-- 8. Phase 8: Order Items Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_id TEXT,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  added_via TEXT NOT NULL CHECK (added_via IN ('manual', 'ai_primary', 'ai_upsell', 'ai_cross_sell')),
  is_ai_attributed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 9. Phase 8: AI Commerce Events Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_commerce_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'AI_SESSION_STARTED',
    'AI_RECOMMENDATION_SHOWN',
    'AI_RECOMMENDATION_CLICKED',
    'AI_PRODUCT_ADDED',
    'AI_UPSELL_SHOWN',
    'AI_UPSELL_ACCEPTED',
    'AI_CROSS_SELL_SHOWN',
    'AI_CROSS_SELL_ACCEPTED',
    'AI_COMPARISON_USED',
    'AI_CHECKOUT_OPENED',
    'AI_PAYMENT_SUCCESS'
  )),
  product_id TEXT,
  source_product_id TEXT,
  order_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_commerce_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view commerce events" ON public.ai_commerce_events;
CREATE POLICY "Users can view commerce events"
  ON public.ai_commerce_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can record commerce events" ON public.ai_commerce_events;
CREATE POLICY "Users can record commerce events"
  ON public.ai_commerce_events FOR INSERT
  WITH CHECK (true);

-- Indices for Phase 8
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_ai ON public.orders(is_ai_assisted);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_added_via ON public.order_items(added_via);
CREATE INDEX IF NOT EXISTS idx_ai_events_session ON public.ai_commerce_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_type ON public.ai_commerce_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_events_created ON public.ai_commerce_events(created_at);

-- ============================================================
-- 10. Phase 17: Campaign Orchestrator Data Foundation
-- ============================================================
-- 10.1 Orders Enhancement: Add merchant_id (Non-destructive)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON public.orders(merchant_id);

-- 10.2 Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'bogo', 'flash_sale', 'clearance', 'bundle')),
  discount_value NUMERIC NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  target TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED')) DEFAULT 'DRAFT',
  reason TEXT,
  created_by TEXT DEFAULT 'merchant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT check_campaign_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- 10.3 Campaign Products Table (Normalized Relationship)
CREATE TABLE IF NOT EXISTS public.campaign_products (
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, product_id)
);

-- Indices for Fast Campaign & Product Querying
CREATE INDEX IF NOT EXISTS idx_campaigns_merchant ON public.campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_products_product ON public.campaign_products(product_id);
CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign ON public.campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_created ON public.order_items(product_id, created_at);

-- 10.4 View: Order Sales Facts (Authoritative Successful Sales Only)
CREATE OR REPLACE VIEW public.v_order_sales_facts AS
SELECT
  oi.id AS order_item_id,
  oi.order_id,
  o.merchant_id,
  o.user_id AS customer_id,
  oi.product_id,
  oi.product_name,
  oi.quantity,
  oi.unit_price,
  oi.total_price,
  o.status AS order_status,
  o.payment_status,
  o.created_at AS order_created_at
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.payment_status = 'successful'
  AND o.status NOT IN ('failed', 'cancelled');

-- 10.5 View: Active Campaigns
CREATE OR REPLACE VIEW public.v_active_campaigns AS
SELECT
  c.id AS campaign_id,
  c.merchant_id,
  c.name AS campaign_name,
  c.goal,
  c.discount_type,
  c.discount_value,
  c.target,
  c.status,
  c.reason,
  c.start_date,
  c.end_date,
  c.created_by,
  c.created_at,
  c.activated_at,
  COALESCE(
    jsonb_agg(cp.product_id) FILTER (WHERE cp.product_id IS NOT NULL),
    '[]'::jsonb
  ) AS product_ids,
  COUNT(cp.product_id) AS product_count
FROM public.campaigns c
LEFT JOIN public.campaign_products cp ON c.id = cp.campaign_id
WHERE c.status = 'ACTIVE'
  AND (c.start_date IS NULL OR c.start_date <= NOW())
  AND (c.end_date IS NULL OR c.end_date >= NOW())
GROUP BY c.id;

-- 10.6 View: Products Active Campaign Coverage
CREATE OR REPLACE VIEW public.v_products_active_campaign_coverage AS
SELECT DISTINCT
  cp.product_id,
  c.id AS campaign_id,
  c.merchant_id,
  c.name AS campaign_name,
  c.discount_type,
  c.discount_value,
  c.status AS campaign_status,
  c.start_date,
  c.end_date
FROM public.campaign_products cp
JOIN public.campaigns c ON cp.campaign_id = c.id
WHERE c.status = 'ACTIVE'
  AND (c.start_date IS NULL OR c.start_date <= NOW())
  AND (c.end_date IS NULL OR c.end_date >= NOW());

-- 10.7 Function: Parameterized Product Sales Comparison
CREATE OR REPLACE FUNCTION public.get_product_sales_comparison(
  p_days INT DEFAULT 7,
  p_merchant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  product_id TEXT,
  product_name TEXT,
  units_sold_recent BIGINT,
  revenue_recent NUMERIC,
  units_sold_previous BIGINT,
  revenue_previous NUMERIC,
  sales_change_percent NUMERIC,
  revenue_change_percent NUMERIC
) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_recent_start TIMESTAMPTZ := v_now - (p_days || ' days')::INTERVAL;
  v_previous_start TIMESTAMPTZ := v_now - ((p_days * 2) || ' days')::INTERVAL;
BEGIN
  RETURN QUERY
  WITH recent_sales AS (
    SELECT
      oi.product_id,
      MAX(oi.product_name) AS product_name,
      COALESCE(SUM(oi.quantity), 0)::BIGINT AS units,
      COALESCE(SUM(oi.total_price), 0)::NUMERIC AS rev
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'successful'
      AND o.status NOT IN ('failed', 'cancelled')
      AND o.created_at >= v_recent_start
      AND o.created_at <= v_now
      AND (p_merchant_id IS NULL OR o.merchant_id = p_merchant_id)
    GROUP BY oi.product_id
  ),
  previous_sales AS (
    SELECT
      oi.product_id,
      COALESCE(SUM(oi.quantity), 0)::BIGINT AS units,
      COALESCE(SUM(oi.total_price), 0)::NUMERIC AS rev
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'successful'
      AND o.status NOT IN ('failed', 'cancelled')
      AND o.created_at >= v_previous_start
      AND o.created_at < v_recent_start
      AND (p_merchant_id IS NULL OR o.merchant_id = p_merchant_id)
    GROUP BY oi.product_id
  ),
  all_prods AS (
    SELECT r.product_id FROM recent_sales r
    UNION
    SELECT p.product_id FROM previous_sales p
  )
  SELECT
    ap.product_id,
    COALESCE(r.product_name, 'Product ' || ap.product_id) AS product_name,
    COALESCE(r.units, 0)::BIGINT AS units_sold_recent,
    COALESCE(r.rev, 0)::NUMERIC AS revenue_recent,
    COALESCE(p.units, 0)::BIGINT AS units_sold_previous,
    COALESCE(p.rev, 0)::NUMERIC AS revenue_previous,
    CASE
      WHEN COALESCE(p.units, 0) = 0 AND COALESCE(r.units, 0) > 0 THEN 100.0
      WHEN COALESCE(p.units, 0) = 0 AND COALESCE(r.units, 0) = 0 THEN 0.0
      ELSE ROUND(((COALESCE(r.units, 0)::NUMERIC - COALESCE(p.units, 0)::NUMERIC) / p.units::NUMERIC) * 100.0, 1)
    END AS sales_change_percent,
    CASE
      WHEN COALESCE(p.rev, 0) = 0 AND COALESCE(r.rev, 0) > 0 THEN 100.0
      WHEN COALESCE(p.rev, 0) = 0 AND COALESCE(r.rev, 0) = 0 THEN 0.0
      ELSE ROUND(((COALESCE(r.rev, 0) - COALESCE(p.rev, 0)) / p.rev) * 100.0, 1)
    END AS revenue_change_percent
  FROM all_prods ap
  LEFT JOIN recent_sales r ON ap.product_id = r.product_id
  LEFT JOIN previous_sales p ON ap.product_id = p.product_id
  ORDER BY units_sold_recent DESC, revenue_recent DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10.8 Pre-computed Views for 7-day and 30-day Sales
CREATE OR REPLACE VIEW public.v_product_sales_7d AS
SELECT * FROM public.get_product_sales_comparison(7, NULL);

CREATE OR REPLACE VIEW public.v_product_sales_30d AS
SELECT * FROM public.get_product_sales_comparison(30, NULL);

-- 10.9 Function: Campaign Candidates Data (Facts for AI Orchestrator)
CREATE OR REPLACE FUNCTION public.get_campaign_candidates_data(
  p_days INT DEFAULT 7,
  p_merchant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  product_id TEXT,
  product_name TEXT,
  units_sold_recent BIGINT,
  revenue_recent NUMERIC,
  units_sold_previous BIGINT,
  revenue_previous NUMERIC,
  sales_change_percent NUMERIC,
  revenue_change_percent NUMERIC,
  has_active_campaign BOOLEAN,
  active_campaign_id UUID,
  active_campaign_name TEXT,
  active_campaign_discount_type TEXT,
  active_campaign_discount_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH sales AS (
    SELECT * FROM public.get_product_sales_comparison(p_days, p_merchant_id)
  ),
  coverage AS (
    SELECT DISTINCT ON (cp.product_id)
      cp.product_id,
      c.id AS campaign_id,
      c.name AS campaign_name,
      c.discount_type,
      c.discount_value
    FROM public.campaign_products cp
    JOIN public.campaigns c ON cp.campaign_id = c.id
    WHERE c.status = 'ACTIVE'
      AND (c.start_date IS NULL OR c.start_date <= NOW())
      AND (c.end_date IS NULL OR c.end_date >= NOW())
      AND (p_merchant_id IS NULL OR c.merchant_id = p_merchant_id)
    ORDER BY cp.product_id, c.created_at DESC
  )
  SELECT
    s.product_id,
    s.product_name,
    s.units_sold_recent,
    s.revenue_recent,
    s.units_sold_previous,
    s.revenue_previous,
    s.sales_change_percent,
    s.revenue_change_percent,
    (cov.product_id IS NOT NULL) AS has_active_campaign,
    cov.campaign_id AS active_campaign_id,
    cov.campaign_name AS active_campaign_name,
    cov.discount_type AS active_campaign_discount_type,
    cov.discount_value AS active_campaign_discount_value
  FROM sales s
  LEFT JOIN coverage cov ON s.product_id = cov.product_id
  ORDER BY s.sales_change_percent ASC, s.revenue_recent DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10.10 View: Campaign Candidates Facts
CREATE OR REPLACE VIEW public.v_campaign_candidates_facts AS
SELECT * FROM public.get_campaign_candidates_data(7, NULL);

-- 10.11 Row Level Security (RLS) Policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies (Merchant Isolation)
DROP POLICY IF EXISTS "Merchants can view own campaigns" ON public.campaigns;
CREATE POLICY "Merchants can view own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can insert own campaigns" ON public.campaigns;
CREATE POLICY "Merchants can insert own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own campaigns" ON public.campaigns;
CREATE POLICY "Merchants can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can delete own campaigns" ON public.campaigns;
CREATE POLICY "Merchants can delete own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = merchant_id);

-- Campaign Products Policies (Merchant Isolation via Campaign Ownership)
DROP POLICY IF EXISTS "Merchants can view own campaign products" ON public.campaign_products;
CREATE POLICY "Merchants can view own campaign products"
  ON public.campaign_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_products.campaign_id
        AND c.merchant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants can insert own campaign products" ON public.campaign_products;
CREATE POLICY "Merchants can insert own campaign products"
  ON public.campaign_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_products.campaign_id
        AND c.merchant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants can delete own campaign products" ON public.campaign_products;
CREATE POLICY "Merchants can delete own campaign products"
  ON public.campaign_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_products.campaign_id
        AND c.merchant_id = auth.uid()
    )
  );


