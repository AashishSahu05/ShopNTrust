// ============================================================
// ShopNTrust — Product Types
// ============================================================
// Canonical product data model. This is the single source of truth
// for all product information rendered in the frontend.
// ============================================================

/** Product availability status */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/** Normalized Product category identifiers */
export type ProductCategory =
  | 'laptops'
  | 'headphones'
  | 'phones'
  | 'tablets'
  | 'cameras'
  | 'accessories'
  | 'audio'
  | 'wearables'
  | 'storage'
  | 'footwear'
  | 'apparel'
  | 'skincare'
  | 'nutrition'
  | 'gaming'
  | 'other';

/** Product variant model (RAM/Storage, Color, Size, Volume, etc.) */
export interface ProductVariant {
  /** Unique variant ID within the product (e.g. "8gb-128gb", "black-titanium") */
  variant_id: string;

  /** Display label (e.g. "8 GB + 128 GB", "Desert Titanium") */
  name: string;

  /** Variant type */
  type: 'ram_storage' | 'color' | 'size' | 'volume' | 'storage' | 'model' | 'other';

  /** Variant specific price in INR */
  price: number;

  /** Optional variant MRP */
  mrp?: number;

  /** Key-value attributes */
  attributes?: Record<string, string>;

  /** Optional variant specific image */
  image?: string;

  /** Stock availability */
  inStock?: boolean;
}

/**
 * Detailed technical specifications structure
 */
export interface DetailedSpecifications {
  dimensions?: {
    height?: string;
    width?: string;
    thickness?: string;
    weight?: string;
  };
  display?: {
    size?: string;
    resolution?: string;
    panelType?: string;
    refreshRate?: string;
    peakBrightness?: string;
    other?: string;
  };
  performance?: {
    processor?: string;
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    os?: string;
  };
  camera?: {
    rear?: string;
    front?: string;
    video?: string;
    features?: string[];
  };
  battery?: {
    capacity?: string;
    charging?: string;
    runtime?: string;
    reverseCharging?: string;
  };
  connectivity?: {
    cellular?: string;
    wifi?: string;
    bluetooth?: string;
    ports?: string;
    nfc?: string;
    sim?: string;
  };
  durability?: {
    ipRating?: string;
    build?: string;
    militaryGrade?: string;
  };
}

/**
 * Canonical Product
 *
 * Every product in the ShopNTrust catalog is represented by this type.
 * The `product_id` is the canonical identifier used across:
 * - Frontend catalog
 * - n8n AI recommendations
 * - Cart
 * - Checkout
 * - Orders
 */
export interface Product {
  /** Canonical product identifier (e.g., "P101", "P105", "P114") */
  product_id: string;

  /** Product display name */
  name: string;

  /** Short product description */
  description: string;

  /** Base price in INR (e.g., 55999 = ₹55,999) */
  price: number;

  /** Optional original/MRP price for discount display */
  mrp?: number;

  /** Currency code (ISO 4217, default "INR") */
  currency: string;

  /** Normalized category token */
  category: ProductCategory;

  /** Human-readable category display from source */
  categoryDisplay?: string;

  /** Sub-category name from source */
  subCategory?: string;

  /** Specific product type from source */
  productType?: string;

  /** Brand name */
  brand: string;

  /** Main product image */
  image: string;

  /** Additional product images */
  images?: string[];

  /** Average rating (0–5 scale) from real reviews sheet */
  rating?: number;

  /** Number of ratings/reviews from real reviews sheet */
  reviewCount?: number;

  /** Stock/availability status */
  stockStatus: StockStatus;

  /** Actual stock quantity if provided */
  stockQuantity?: number;

  /** Estimated delivery text (e.g., "3 days", "3-5 days") */
  deliveryEstimate?: string;

  /** Delivery days number */
  deliveryDays?: number;

  /** Shipping charge text (e.g. "Free", "₹99") */
  shippingCharge?: string;

  /** Whether the product is returnable */
  returnable?: boolean;

  /** Return window in days */
  returnWindowDays?: number;

  /** Key product specifications for display */
  specifications?: Record<string, string>;

  /** Raw specification text if unstructured */
  rawSpecs?: string;

  /** Structured technical specifications */
  specDetails?: DetailedSpecifications;

  /** Highlighted bullet features from source */
  featuresList?: string[];

  /** Benefits bullets from source */
  benefits?: string[];

  /** Verified use cases from source */
  useCases?: string[];

  /** Target customer persona from source */
  targetCustomer?: string[];

  /** Recommended occasions / scenarios from source */
  occasion?: string[];

  /** Available product variants (RAM, Storage, Color, etc.) */
  variants?: ProductVariant[];

  /** Cross-sell related product IDs */
  crossSellIds?: string[];

  /** Upsell product IDs */
  upsellIds?: string[];

  /** Tags for search/filtering */
  tags?: string[];

  /** Whether this product is featured on the homepage */
  featured?: boolean;

  /** Whether this product is trending */
  trending?: boolean;
}

/**
 * Minimal product reference — used when AI returns a product_id
 * and we need to resolve it against the catalog.
 */
export interface ProductReference {
  product_id: string;
}

/**
 * Product with AI recommendation context
 */
export interface RecommendedProduct extends Product {
  /** Why this product was recommended */
  recommendationReason?: string;

  /** Individual match factors (e.g., "Within budget", "Good for coding") */
  matchFactors?: string[];

  /** Recommendation type */
  recommendationType?: 'primary' | 'upsell' | 'cross_sell';
}
