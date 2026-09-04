-- ============================================================
-- ShopNTrust — Phase 21: Campaign Revenue Attribution Migration
-- ============================================================
-- Non-destructively adds campaign_id to orders and order_items.
-- Enables item-level and order-level promotional revenue attribution.
--
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qfjifooftpdcgvmlargl/sql
-- ============================================================

-- 1. Add campaign_id to orders (order-level attribution)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 2. Add campaign_id to order_items (item-level attribution)
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 3. Indices for fast attribution analytics
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON public.orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_order_items_campaign_id ON public.order_items(campaign_id);
