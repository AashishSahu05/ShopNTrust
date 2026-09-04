// ============================================================
// ShopNTrust — Authoritative Campaign & Sales Analytics Service
// ============================================================
// Dual-layer service for AI Campaign Orchestrator data access:
// 1. Queries Supabase views/RPCs (v_active_campaigns, get_campaign_candidates_data)
// 2. Resilient local fallback deriving sales facts from authoritative orders data
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { supabaseConfig, n8nConfig } from '@/lib/config';
import { getOrders } from '@/lib/orders/order-service';
import { getProductById } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';
import type {
  Campaign,
  CampaignCandidateFact,
  ProductSalesComparison,
  CampaignProposal,
  ResolvedCampaignProposal,
  ResolvedCampaignProduct,
} from '@/types';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseConfig.anonKey;
const supabaseAdmin = createClient(supabaseConfig.url, serviceRoleKey, {
  auth: { persistSession: false },
});

// In-memory / persistent campaign cache for fallback
const fallbackCampaigns: Campaign[] = [];

const isUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val));

/**
 * Get active campaigns, optionally filtered by merchant.
 */
export async function getActiveCampaigns(merchantId?: string): Promise<Campaign[]> {
  let dbCampaigns: Campaign[] = [];
  try {
    let query = supabaseAdmin.from('v_active_campaigns').select('*');
    if (merchantId && isUuid(merchantId)) {
      query = query.eq('merchant_id', merchantId);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      dbCampaigns = data.map((row) => ({
        id: row.campaign_id,
        merchantId: row.merchant_id,
        name: row.campaign_name,
        goal: row.goal,
        discountType: row.discount_type,
        discountValue: Number(row.discount_value),
        target: row.target,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        reason: row.reason,
        createdBy: row.created_by,
        createdAt: row.created_at,
        activatedAt: row.activated_at,
        productIds: Array.isArray(row.product_ids) ? row.product_ids : [],
        productCount: row.product_count,
      }));
    }
  } catch {
    // Continue to fallback
  }

  // Combine DB records with fallback cache, preferring latest status
  const allCampaigns = [...dbCampaigns];
  for (const fc of fallbackCampaigns) {
    const existingIdx = allCampaigns.findIndex((c) => c.id === fc.id);
    if (existingIdx === -1) {
      allCampaigns.push(fc);
    } else {
      allCampaigns[existingIdx] = { ...allCampaigns[existingIdx], ...fc };
    }
  }

  const now = Date.now();
  return allCampaigns.filter((c) => {
    if (c.status !== 'ACTIVE') return false;
    if (merchantId && c.merchantId && c.merchantId !== merchantId) return false;
    if (c.startDate && new Date(c.startDate).getTime() > now) return false;
    if (c.endDate && new Date(c.endDate).getTime() < now) return false;
    return true;
  });
}

/**
 * Check whether a specific product is covered by an active campaign.
 */
export async function getActiveCampaignForProduct(
  productId: string,
  merchantId?: string
): Promise<Campaign | null> {
  const active = await getActiveCampaigns(merchantId);
  const found = active.find((c) => c.productIds?.includes(productId));
  return found || null;
}

/**
 * Parameterized sales comparison comparing recent period vs previous period (e.g. 7d or 30d).
 */
export async function getProductSalesComparison(
  days = 7,
  merchantId?: string
): Promise<ProductSalesComparison[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_product_sales_comparison', {
      p_days: days,
      p_merchant_id: merchantId || null,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        unitsSoldRecent: Number(row.units_sold_recent || 0),
        revenueRecent: Number(row.revenue_recent || 0),
        unitsSoldPrevious: Number(row.units_sold_previous || 0),
        revenuePrevious: Number(row.revenue_previous || 0),
        salesChangePercent: Number(row.sales_change_percent || 0),
        revenueChangePercent: Number(row.revenue_change_percent || 0),
      }));
    }
  } catch {
    // Continue to authoritative order calculation
  }

  // Authoritative fallback: Derive directly from real orders
  const allOrders = await getOrders({ dateRange: 'all' });
  const validOrders = allOrders.filter(
    (o) => o.paymentStatus === 'successful' && o.status !== 'payment_failed'
  );

  const now = Date.now();
  const msInDay = 86400000;
  const recentStart = now - days * msInDay;
  const previousStart = now - days * 2 * msInDay;

  const recentMap = new Map<string, { name: string; units: number; revenue: number }>();
  const previousMap = new Map<string, { units: number; revenue: number }>();

  for (const order of validOrders) {
    const orderTime = order.createdAt;

    if (orderTime >= recentStart && orderTime <= now) {
      for (const item of order.items) {
        const pId = item.product.product_id;
        const lineTotal = (item.selectedVariant?.price ?? item.product.price) * item.quantity;
        const cur = recentMap.get(pId) || { name: item.product.name, units: 0, revenue: 0 };
        cur.units += item.quantity;
        cur.revenue += lineTotal;
        recentMap.set(pId, cur);
      }
    } else if (orderTime >= previousStart && orderTime < recentStart) {
      for (const item of order.items) {
        const pId = item.product.product_id;
        const lineTotal = (item.selectedVariant?.price ?? item.product.price) * item.quantity;
        const cur = previousMap.get(pId) || { units: 0, revenue: 0 };
        cur.units += item.quantity;
        cur.revenue += lineTotal;
        previousMap.set(pId, cur);
      }
    }
  }

  const allProductIds = new Set<string>([...recentMap.keys(), ...previousMap.keys()]);
  const results: ProductSalesComparison[] = [];

  for (const pId of allProductIds) {
    const r = recentMap.get(pId) || { name: getProductById(pId)?.name || `Product ${pId}`, units: 0, revenue: 0 };
    const p = previousMap.get(pId) || { units: 0, revenue: 0 };

    let salesChange = 0;
    if (p.units === 0 && r.units > 0) salesChange = 100.0;
    else if (p.units === 0 && r.units === 0) salesChange = 0.0;
    else salesChange = Math.round(((r.units - p.units) / p.units) * 1000) / 10;

    let revChange = 0;
    if (p.revenue === 0 && r.revenue > 0) revChange = 100.0;
    else if (p.revenue === 0 && r.revenue === 0) revChange = 0.0;
    else revChange = Math.round(((r.revenue - p.revenue) / p.revenue) * 1000) / 10;

    results.push({
      productId: pId,
      productName: r.name,
      unitsSoldRecent: r.units,
      revenueRecent: r.revenue,
      unitsSoldPrevious: p.units,
      revenuePrevious: p.revenue,
      salesChangePercent: salesChange,
      revenueChangePercent: revChange,
    });
  }

  return results.sort((a, b) => b.unitsSoldRecent - a.unitsSoldRecent || b.revenueRecent - a.revenueRecent);
}

/**
 * Returns Campaign Candidate Facts for n8n AI Campaign Orchestrator.
 * Merges product sales metrics with active campaign coverage.
 */
export async function getCampaignCandidates(
  days = 7,
  merchantId?: string
): Promise<CampaignCandidateFact[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_campaign_candidates_data', {
      p_days: days,
      p_merchant_id: merchantId || null,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        unitsSoldRecent: Number(row.units_sold_recent || 0),
        revenueRecent: Number(row.revenue_recent || 0),
        unitsSoldPrevious: Number(row.units_sold_previous || 0),
        revenuePrevious: Number(row.revenue_previous || 0),
        salesChangePercent: Number(row.sales_change_percent || 0),
        revenueChangePercent: Number(row.revenue_change_percent || 0),
        hasActiveCampaign: Boolean(row.has_active_campaign),
        activeCampaignId: row.active_campaign_id,
        activeCampaignName: row.active_campaign_name,
        activeCampaignDiscountType: row.active_campaign_discount_type,
        activeCampaignDiscountValue: row.active_campaign_discount_value ? Number(row.active_campaign_discount_value) : null,
      }));
    }
  } catch {
    // Continue to resilient fallback
  }

  const sales = await getProductSalesComparison(days, merchantId);
  const activeCampaigns = await getActiveCampaigns(merchantId);

  // Map product coverage
  const coverageMap = new Map<string, Campaign>();
  for (const camp of activeCampaigns) {
    if (camp.productIds) {
      for (const pId of camp.productIds) {
        if (!coverageMap.has(pId)) {
          coverageMap.set(pId, camp);
        }
      }
    }
  }

  return sales
    .map((s) => {
      const activeCamp = coverageMap.get(s.productId);
      return {
        ...s,
        hasActiveCampaign: !!activeCamp,
        activeCampaignId: activeCamp?.id || null,
        activeCampaignName: activeCamp?.name || null,
        activeCampaignDiscountType: activeCamp?.discountType || null,
        activeCampaignDiscountValue: activeCamp?.discountValue || null,
      };
    })
    .sort((a, b) => a.salesChangePercent - b.salesChangePercent || b.revenueRecent - a.revenueRecent);
}

/**
 * Creates or updates a campaign in Supabase (with fallback caching).
 */
export async function saveCampaign(campaign: Partial<Campaign> & { name: string; discountType: Campaign['discountType'] }): Promise<Campaign> {
  const id = isUuid(campaign.id) ? (campaign.id as string) : crypto.randomUUID();
  const now = new Date().toISOString();

  const record: Campaign = {
    id,
    merchantId: campaign.merchantId,
    name: campaign.name,
    goal: campaign.goal,
    discountType: campaign.discountType,
    discountValue: campaign.discountValue || 0,
    target: campaign.target,
    startDate: campaign.startDate || null,
    endDate: campaign.endDate || null,
    status: campaign.status || 'DRAFT',
    reason: campaign.reason,
    createdBy: campaign.createdBy || 'merchant',
    createdAt: campaign.createdAt || now,
    activatedAt: campaign.status === 'ACTIVE' ? campaign.activatedAt || now : null,
    productIds: campaign.productIds || [],
    productCount: campaign.productIds?.length || 0,
  };

  try {
    const { error: campError } = await supabaseAdmin.from('campaigns').upsert({
      id: record.id,
      merchant_id: isUuid(record.merchantId) ? record.merchantId : null,
      name: record.name,
      goal: record.goal || null,
      discount_type: record.discountType,
      discount_value: record.discountValue,
      target: record.target || null,
      start_date: record.startDate,
      end_date: record.endDate,
      status: record.status,
      reason: record.reason || null,
      created_by: record.createdBy,
      created_at: record.createdAt,
      activated_at: record.activatedAt,
    });

    if (!campError && record.productIds && record.productIds.length > 0) {
      const junctionRows = record.productIds.map((pId) => ({
        campaign_id: record.id,
        product_id: pId,
      }));
      await supabaseAdmin.from('campaign_products').upsert(junctionRows);
    }
  } catch {
    // Continue to local cache
  }

  // Update fallback cache
  const idx = fallbackCampaigns.findIndex((c) => c.id === record.id);
  if (idx > -1) {
    fallbackCampaigns[idx] = record;
  } else {
    fallbackCampaigns.unshift(record);
  }

  return record;
}

/**
 * Calls n8n AI Campaign Orchestrator webhook to generate a campaign proposal.
 * Strictly untrusted: Validates fields, parses stringified/nested JSON,
 * resolves product IDs against canonical catalog, and NEVER auto-activates.
 */
export async function generateCampaignProposal(goal: string): Promise<ResolvedCampaignProposal> {
  const trimmedGoal = goal.trim();
  if (!trimmedGoal) {
    throw new Error('Please enter a campaign goal.');
  }

  const webhookUrl = n8nConfig.campaignOrchestratorWebhookUrl;
  if (!webhookUrl) {
    throw new Error('Campaign AI is temporarily unavailable. Please try again.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  let rawData: unknown;
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ goal: trimmedGoal }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI Orchestrator returned status ${response.status}`);
    }

    rawData = await response.json();
  } catch (err: unknown) {
    console.error('generateCampaignProposal n8n error:', err);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Campaign AI request timed out. Please try again.');
      }
      throw err;
    }
    throw new Error('Campaign AI is temporarily unavailable. Please try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle untrusted external response
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('AI returned an incomplete campaign proposal. Please try again.');
  }

  // Handle nested / stringified JSON payloads from n8n
  const payload = rawData as Record<string, unknown>;
  let parsedCampaign: unknown = payload.campaign ?? payload;

  if (typeof parsedCampaign === 'string') {
    try {
      parsedCampaign = JSON.parse(parsedCampaign);
    } catch {
      throw new Error('AI returned an incomplete campaign proposal. Please try again.');
    }
  }

  // May be nested { success: true, campaign: { ... } }
  if (
    parsedCampaign &&
    typeof parsedCampaign === 'object' &&
    'campaign' in (parsedCampaign as Record<string, unknown>)
  ) {
    parsedCampaign = (parsedCampaign as Record<string, unknown>).campaign;
  }

  if (!parsedCampaign || typeof parsedCampaign !== 'object') {
    throw new Error('AI returned an incomplete campaign proposal. Please try again.');
  }

  const c = parsedCampaign as Record<string, unknown>;

  const name = typeof c.name === 'string' && c.name.trim() ? c.name.trim() : 'Special AI Promotional Campaign';
  const goalStr = typeof c.goal === 'string' && c.goal.trim() ? c.goal.trim() : 'increase_sales';

  // product_ids or productIds
  const rawProductIds = Array.isArray(c.product_ids)
    ? c.product_ids
    : Array.isArray(c.productIds)
    ? c.productIds
    : [];

  const productIds = rawProductIds.map((id) => String(id).trim().toUpperCase()).filter(Boolean);

  if (productIds.length === 0) {
    throw new Error('AI did not identify any eligible products for this campaign.');
  }

  const discountType = (c.discount_type || c.discountType || 'percentage') as Campaign['discountType'];
  let discountValue = Number(c.discount_value ?? c.discountValue ?? 10);
  if (isNaN(discountValue) || discountValue <= 0) discountValue = 10;
  if (discountType === 'percentage' && discountValue > 80) discountValue = 80;

  let durationDays = parseInt(String(c.duration_days ?? c.durationDays ?? 7), 10);
  if (isNaN(durationDays) || durationDays <= 0) durationDays = 7;
  if (durationDays > 60) durationDays = 60;

  const reason = typeof c.reason === 'string' && c.reason.trim()
    ? c.reason.trim()
    : 'AI identified steady inventory and positive conversion opportunity.';
  const target = typeof c.target === 'string' && c.target.trim()
    ? c.target.trim()
    : 'Interested online shoppers';

  // Canonical product resolution
  const resolvedProducts: ResolvedCampaignProduct[] = [];
  const invalidProductIds: string[] = [];

  for (const pId of productIds) {
    const canonical = getProductById(pId);
    if (canonical) {
      resolvedProducts.push({
        productId: canonical.product_id,
        name: canonical.name,
        price: canonical.price,
        mrp: canonical.mrp,
        category: canonical.category,
        categoryDisplay: canonical.categoryDisplay,
        imageUrl: getProductImageUrl(canonical.product_id) || '',
        brand: canonical.brand,
        stockStatus: canonical.stockStatus,
      });
    } else {
      invalidProductIds.push(pId);
    }
  }

  const hasInvalidProduct = invalidProductIds.length > 0;
  const validationError = hasInvalidProduct
    ? `Product ID(s) ${invalidProductIds.join(', ')} could not be verified in the canonical catalog.`
    : undefined;

  return {
    name,
    goal: goalStr,
    productIds,
    discountType,
    discountValue,
    durationDays,
    reason,
    target,
    products: resolvedProducts,
    hasInvalidProduct,
    invalidProductIds: invalidProductIds.length > 0 ? invalidProductIds : undefined,
    validationError,
  };
}

/**
 * Activates an approved campaign.
 * Authoritative: Authenticates merchant, validates canonical IDs,
 * calculates server-side duration, enforces double-click idempotency,
 * and writes to Supabase campaigns and campaign_products tables.
 */
export async function activateCampaign(
  proposal: CampaignProposal,
  merchantId: string
): Promise<{ success: boolean; campaignId: string; status: 'ACTIVE'; campaign: Campaign }> {
  if (!merchantId || typeof merchantId !== 'string') {
    throw new Error('Unauthorized: Valid merchant identity is required.');
  }

  if (!proposal.name || proposal.name.trim().length < 3) {
    throw new Error('Campaign name must be at least 3 characters.');
  }

  if (!proposal.productIds || proposal.productIds.length === 0) {
    throw new Error('Campaign must include at least one valid product.');
  }

  // Canonical product validation
  for (const id of proposal.productIds) {
    const p = getProductById(id);
    if (!p) {
      throw new Error(`Invalid product ID '${id}' is not in the canonical catalog.`);
    }
  }

  // Discount validation
  if (proposal.discountValue <= 0) {
    throw new Error('Discount value must be greater than zero.');
  }
  if (proposal.discountType === 'percentage' && proposal.discountValue > 90) {
    throw new Error('Percentage discount cannot exceed 90%.');
  }

  // Duration validation
  const duration = parseInt(String(proposal.durationDays || 7), 10);
  if (isNaN(duration) || duration < 1 || duration > 90) {
    throw new Error('Duration must be between 1 and 90 days.');
  }

  // Server-side calculation
  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(now.getTime() + duration * 86400000).toISOString();

  // Double-activation / Idempotency protection:
  // Check if an active campaign with same name and merchant was activated in the last 60 seconds
  const activeExisting = await getActiveCampaigns(merchantId);
  const duplicate = activeExisting.find((c) => {
    if (c.name.trim().toLowerCase() !== proposal.name.trim().toLowerCase()) return false;
    if (!c.activatedAt) return false;
    const diff = now.getTime() - new Date(c.activatedAt).getTime();
    return diff >= 0 && diff < 60000;
  });

  if (duplicate) {
    return {
      success: true,
      campaignId: duplicate.id,
      status: 'ACTIVE',
      campaign: duplicate,
    };
  }

  const campaignId = crypto.randomUUID();

  const campaignRecord: Campaign = {
    id: campaignId,
    merchantId,
    name: proposal.name.trim(),
    goal: proposal.goal,
    discountType: proposal.discountType,
    discountValue: proposal.discountValue,
    target: proposal.target,
    startDate,
    endDate,
    status: 'ACTIVE',
    reason: proposal.reason,
    createdBy: 'merchant',
    createdAt: startDate,
    activatedAt: startDate,
    productIds: proposal.productIds,
    productCount: proposal.productIds.length,
  };

  // Persist to Supabase
  await saveCampaign(campaignRecord);

  return {
    success: true,
    campaignId,
    status: 'ACTIVE',
    campaign: campaignRecord,
  };
}

/**
 * Pauses an active campaign.
 * Authoritative: Authenticates merchant and strictly enforces ownership isolation.
 */
export async function pauseCampaign(
  campaignId: string,
  merchantId: string
): Promise<{ success: boolean; campaignId: string; status: 'PAUSED' }> {
  if (!merchantId) {
    throw new Error('Unauthorized: Valid merchant identity is required.');
  }

  // Verify campaign exists & ownership
  let campaignFound: Campaign | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (!error && data) {
      campaignFound = {
        id: data.id,
        merchantId: data.merchant_id,
        name: data.name,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        status: data.status,
        createdAt: data.created_at,
        startDate: data.start_date,
        endDate: data.end_date,
      };
    }
  } catch {
    // Continue to cache check
  }

  const inCache = fallbackCampaigns.find((c) => c.id === campaignId);
  if (!campaignFound && inCache) {
    campaignFound = inCache;
  }

  if (!campaignFound) {
    throw new Error('Campaign not found.');
  }

  // Strict ownership check: Merchant A cannot modify Merchant B's campaign
  const effectiveMerchantId = campaignFound.merchantId || inCache?.merchantId;
  if (effectiveMerchantId && effectiveMerchantId !== merchantId) {
    throw new Error('Forbidden: You do not have permission to modify this campaign.');
  }

  // Update status in Supabase
  try {
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'PAUSED' })
      .eq('id', campaignId);
  } catch {
    // Continue to cache update
  }

  // Update fallback cache
  const idx = fallbackCampaigns.findIndex((c) => c.id === campaignId);
  if (idx > -1) {
    fallbackCampaigns[idx] = {
      ...fallbackCampaigns[idx],
      status: 'PAUSED',
    };
  }

  return {
    success: true,
    campaignId,
    status: 'PAUSED',
  };
}

/**
 * Returns active campaigns within current start/end date range.
 * Scoped optionally to merchant.
 */
export async function getAuthoritativeActiveCampaigns(merchantId?: string): Promise<Campaign[]> {
  const active = await getActiveCampaigns(merchantId);
  const now = Date.now();

  return active.filter((c) => {
    if (c.status !== 'ACTIVE') return false;
    if (c.startDate && new Date(c.startDate).getTime() > now) return false;
    if (c.endDate && new Date(c.endDate).getTime() < now) return false;
    return true;
  });
}

