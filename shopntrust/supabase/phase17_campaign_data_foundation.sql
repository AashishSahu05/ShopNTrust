-- ============================================================
-- ShopNTrust — Phase 17: Campaign Orchestrator Data Foundation
-- ============================================================
-- Prepares the database for AI Campaign Orchestrator analysis:
-- 1. Adds merchant_id to existing orders table (non-destructive)
-- 2. Creates campaigns table (DRAFT, ACTIVE, PAUSED, EXPIRED)
-- 3. Creates campaign_products table (normalized M:N relationship)
-- 4. Creates sales facts & comparison views (7-day, 30-day, previous periods)
-- 5. Creates active campaigns & coverage views
-- 6. Creates campaign candidates view (combining sales facts + campaign coverage)
-- 7. Implements parameterized RPC functions for n8n consumption
-- 8. Adds performance indices and Row Level Security (RLS) policies
--
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qfjifooftpdcgvmlargl/sql
-- ============================================================

-- Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ORDERS REUSE & ENHANCEMENT (Non-destructive)
-- ============================================================
-- Reuses existing orders and order_items tables.
-- Adds merchant_id to orders without altering existing records.
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON public.orders(merchant_id);

-- ============================================================
-- 2. CAMPAIGNS TABLE
-- ============================================================
-- Defines campaign metadata and lifecycle state (DRAFT, ACTIVE, PAUSED, EXPIRED).
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

-- ============================================================
-- 3. CAMPAIGN PRODUCTS TABLE (Normalized M:N Relationship)
-- ============================================================
-- Connects campaigns to canonical product IDs.
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

-- ============================================================
-- 4. VIEW: Order Sales Facts (Authoritative Successful Sales Only)
-- ============================================================
-- Joins existing order_items with orders.
-- Filters out failed payments, cancelled orders, and invalid transactions.
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

-- ============================================================
-- 5. VIEW: Active Campaigns
-- ============================================================
-- Retrieves all campaigns currently in ACTIVE status within their effective date window.
-- Aggregates associated product IDs into a clean JSONB array for n8n consumption.
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

-- ============================================================
-- 6. VIEW: Products Active Campaign Coverage
-- ============================================================
-- Identifies products currently covered by at least one active campaign.
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

-- ============================================================
-- 7. FUNCTION: Parameterized Product Sales Comparison
-- ============================================================
-- Compares sales metrics across two adjacent time windows (e.g., last 7 days vs previous 7 days).
-- Supports optional merchant isolation via p_merchant_id parameter.
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

-- ============================================================
-- 8. PRE-COMPUTED VIEWS FOR 7-DAY AND 30-DAY SALES
-- ============================================================
CREATE OR REPLACE VIEW public.v_product_sales_7d AS
SELECT * FROM public.get_product_sales_comparison(7, NULL);

CREATE OR REPLACE VIEW public.v_product_sales_30d AS
SELECT * FROM public.get_product_sales_comparison(30, NULL);

-- ============================================================
-- 9. FUNCTION: Campaign Candidates Data (Facts for AI Orchestrator)
-- ============================================================
-- Merges sales trend facts with active campaign coverage facts.
-- The database provides raw facts; the AI makes campaign suggestions.
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

-- ============================================================
-- 10. VIEW: Campaign Candidates Facts (Default 7-Day)
-- ============================================================
CREATE OR REPLACE VIEW public.v_campaign_candidates_facts AS
SELECT * FROM public.get_campaign_candidates_data(7, NULL);

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
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
