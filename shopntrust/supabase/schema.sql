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

