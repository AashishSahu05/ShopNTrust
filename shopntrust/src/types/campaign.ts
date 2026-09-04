// ============================================================
// ShopNTrust — Campaign & Sales Analytics Types (Phase 17)
// ============================================================
// Provides authoritative typing for:
// - Merchant campaigns (DRAFT, ACTIVE, PAUSED, EXPIRED)
// - Normalized campaign-product relationships
// - Product sales comparison metrics (7-day / 30-day)
// - Campaign candidate facts for the future AI Orchestrator
// ============================================================

/** Supported campaign lifecycle states */
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';

/** Supported promotional discount structures */
export type CampaignDiscountType =
  | 'percentage'
  | 'fixed_amount'
  | 'bogo'
  | 'flash_sale'
  | 'clearance'
  | 'bundle';

/**
 * Merchant Campaign entity.
 */
export interface Campaign {
  id: string;
  merchantId?: string;
  name: string;
  goal?: string;
  discountType: CampaignDiscountType;
  discountValue: number;
  target?: string;
  startDate?: string | null;
  endDate?: string | null;
  status: CampaignStatus;
  reason?: string;
  createdBy?: string;
  createdAt: string;
  activatedAt?: string | null;
  /** Associated canonical product IDs */
  productIds?: string[];
  productCount?: number;

  /** Campaign performance attribution metrics */
  ordersDriven?: number;
  attributedRevenue?: number;
}

/**
 * Campaign-product junction relation.
 */
export interface CampaignProduct {
  campaignId: string;
  productId: string;
  createdAt?: string;
}

/**
 * Aggregated product sales facts comparing two adjacent time periods (e.g. 7d vs prev 7d).
 */
export interface ProductSalesComparison {
  productId: string;
  productName: string;
  unitsSoldRecent: number;
  revenueRecent: number;
  unitsSoldPrevious: number;
  revenuePrevious: number;
  salesChangePercent: number;
  revenueChangePercent: number;
}

/**
 * Complete factual dataset combining product sales metrics and active campaign coverage.
 * Consumed by n8n AI Campaign Orchestrator to make intelligent promotional suggestions.
 */
export interface CampaignCandidateFact extends ProductSalesComparison {
  hasActiveCampaign: boolean;
  activeCampaignId?: string | null;
  activeCampaignName?: string | null;
  activeCampaignDiscountType?: string | null;
  activeCampaignDiscountValue?: number | null;
}

/**
 * AI-generated Campaign Proposal (untrusted external structure).
 */
export interface CampaignProposal {
  name: string;
  goal: string;
  productIds: string[];
  discountType: CampaignDiscountType;
  discountValue: number;
  durationDays: number;
  reason: string;
  target: string;
}

/**
 * Resolved canonical product representation within an AI proposal.
 */
export interface ResolvedCampaignProduct {
  productId: string;
  name: string;
  price: number;
  mrp?: number;
  category: string;
  categoryDisplay?: string;
  imageUrl: string;
  brand?: string;
  stockStatus?: string;
}

/**
 * Proposal resolved against canonical catalog with full product metadata.
 */
export interface ResolvedCampaignProposal extends CampaignProposal {
  products: ResolvedCampaignProduct[];
  hasInvalidProduct: boolean;
  invalidProductIds?: string[];
  validationError?: string;
}

