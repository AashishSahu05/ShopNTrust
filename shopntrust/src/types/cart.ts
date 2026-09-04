// ============================================================
// ShopNTrust — Cart Types
// ============================================================
// Data models for the shopping cart.
// Supports both manual and AI-assisted item additions.
// ============================================================

import type { Product, ProductVariant } from './product';

/**
 * How a product was added to the cart.
 *
 * - `manual` — Customer clicked "Add to Cart" on a product card or page
 * - `ai_primary` — Added directly from the primary AI recommendation
 * - `ai_upsell` — Customer accepted an AI upsell suggestion
 * - `ai_cross_sell` — Customer accepted an AI cross-sell suggestion
 */
export type AddedVia =
  | 'manual'
  | 'ai_primary'
  | 'ai_upsell'
  | 'ai_cross_sell';

/**
 * An item in the shopping cart.
 */
export interface CartItem {
  /** The canonical product data */
  product: Product;

  /** Optional selected variant */
  selectedVariant?: ProductVariant;

  /** Quantity of this product/variant in the cart (1–maxCartQuantity) */
  quantity: number;

  /** Attribution tracking — how this item was added */
  addedVia: AddedVia;

  /** Campaign attribution — set when added from active promotional campaign context */
  campaignId?: string;

  /** Timestamp when added (for sorting/analytics) */
  addedAt: number;
}

/**
 * Overall cart state managed by the cart reducer.
 */
export interface CartState {
  /** All items currently in the cart */
  items: CartItem[];

  /** Whether the cart is currently hydrating from localStorage */
  isLoading: boolean;
}

/**
 * Computed summary values for the cart.
 */
export interface CartSummary {
  /** Total number of unique line items in cart */
  itemCount: number;

  /** Total number of individual product units across all items */
  totalQuantity: number;

  /** Subtotal amount in base currency units (e.g., 55999) */
  subtotal: number;

  /** Currency code */
  currency: string;

  /** Number of items that were added via AI assistance */
  aiAssistedCount: number;
}
