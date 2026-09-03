-- ============================================================
-- ShopNTrust — Phase 8: Real AI Revenue Attribution & Analytics Schema
-- ============================================================
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qfjifooftpdcgvmlargl/sql
-- ============================================================

-- 1. Orders Table
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

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
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

-- 2. Order Items Table
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

-- Enable RLS for Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- 3. AI Commerce Events Table
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

-- Enable RLS for AI Commerce Events
ALTER TABLE public.ai_commerce_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view commerce events" ON public.ai_commerce_events;
CREATE POLICY "Users can view commerce events"
  ON public.ai_commerce_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can record commerce events" ON public.ai_commerce_events;
CREATE POLICY "Users can record commerce events"
  ON public.ai_commerce_events FOR INSERT
  WITH CHECK (true);

-- 4. Fast Query Analytics Indices
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_ai ON public.orders(is_ai_assisted);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_added_via ON public.order_items(added_via);
CREATE INDEX IF NOT EXISTS idx_ai_events_session ON public.ai_commerce_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_type ON public.ai_commerce_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_events_created ON public.ai_commerce_events(created_at);
