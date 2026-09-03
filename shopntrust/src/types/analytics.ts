// ============================================================
// ShopNTrust — Merchant Analytics & Attribution Types
// ============================================================
// Authoritative models for merchant analytics, AI attribution,
// funnel tracking, and upsell/cross-sell commerce impact.
// ============================================================

import type { AddedVia } from './cart';
import type { PaymentStatus } from './order';

/** Supported commerce event types for AI journey tracking */
export type CommerceEventType =
  | 'AI_SESSION_STARTED'
  | 'AI_RECOMMENDATION_SHOWN'
  | 'AI_RECOMMENDATION_CLICKED'
  | 'AI_PRODUCT_ADDED'
  | 'AI_UPSELL_SHOWN'
  | 'AI_UPSELL_ACCEPTED'
  | 'AI_CROSS_SELL_SHOWN'
  | 'AI_CROSS_SELL_ACCEPTED'
  | 'AI_COMPARISON_USED'
  | 'AI_CHECKOUT_OPENED'
  | 'AI_PAYMENT_SUCCESS';

/** Attribution categorization for an order */
export type AttributionType =
  | 'manual'
  | 'ai_recommendation'
  | 'ai_upsell'
  | 'ai_cross_sell'
  | 'ai_mixed';

/** Single persisted AI commerce event */
export interface AICommerceEvent {
  id: string;
  userId?: string | null;
  sessionId: string;
  eventType: CommerceEventType;
  productId?: string | null;
  sourceProductId?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** Top-level revenue metrics */
export interface RevenueMetrics {
  /** Total gross revenue from completed transactions */
  total: number;
  /** Gross revenue attributed to AI Shopping */
  aiAssisted: number;
  /** Gross revenue from manual catalog shopping */
  manual: number;
  /** AI-assisted revenue as a percentage of total revenue */
  aiContributionPercent: number;
  /** Currency code */
  currency: string;
}

/** Top-level order volume metrics */
export interface OrderMetrics {
  /** Total count of successfully paid orders */
  total: number;
  /** Count of successfully paid orders attributed to AI */
  aiAssisted: number;
  /** Count of orders from manual shopping */
  manual: number;
  /** Average Order Value (AOV) for AI-assisted orders */
  aiAverageOrderValue: number;
  /** Average Order Value (AOV) for manual orders */
  manualAverageOrderValue: number;
}

/** AI Shopping Conversion Funnel Metrics */
export interface AIFunnelMetrics {
  /** Count of unique AI shopping sessions started */
  sessions: number;
  /** Total recommendation cards rendered */
  recommendationsShown: number;
  /** Total recommendation cards interacted with or clicked */
  recommendationsInteracted: number;
  /** Total AI-recommended items added to cart */
  productsAdded: number;
  /** Total checkouts opened with AI items */
  checkoutsOpened: number;
  /** Total successfully paid orders attributed to AI */
  ordersCompleted: number;
  /** Conversion rate: (ordersCompleted / sessions) * 100 */
  conversionRate: number;
}

/** Specific impact metrics for Upsell & Cross-Sell */
export interface UpsellCrossSellMetrics {
  upsell: {
    shown: number;
    accepted: number;
    acceptanceRate: number;
    revenue: number;
  };
  crossSell: {
    shown: number;
    accepted: number;
    acceptanceRate: number;
    revenue: number;
  };
}

/** Timeline entry for revenue over time charts */
export interface TimelineMetric {
  date: string;
  label: string;
  totalRevenue: number;
  aiRevenue: number;
  manualRevenue: number;
  orderCount: number;
}

/** Recent order summary displayed on merchant console */
export interface RecentOrderRow {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  isAiAssisted: boolean;
  attributionType: AttributionType;
  paymentStatus: PaymentStatus;
  itemCount: number;
  aiItemCount: number;
}

/** Date filter ranges supported by merchant analytics */
export type AnalyticsDateRange = '7d' | '30d' | '90d' | 'all';

/** Full aggregated merchant analytics payload */
export interface MerchantAnalytics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  funnel: AIFunnelMetrics;
  upsellCrossSell: UpsellCrossSellMetrics;
  timeline: TimelineMetric[];
  recentOrders: RecentOrderRow[];
  dateRange: AnalyticsDateRange;
  generatedAt: string;
}
