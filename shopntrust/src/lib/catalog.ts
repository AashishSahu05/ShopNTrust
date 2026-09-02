// ============================================================
// ShopNTrust — Canonical Product Catalog
// ============================================================
// The single source of truth for all product information.
// Populated directly from authoritative source data:
// - Product_Data.xlsx
// - Product Data.pdf
//
// In the future, this catalog can be updated via the
// "Sync product catalog" pipeline without altering UI components.
// ============================================================

import type { Product, ProductCategory } from '@/types';
import rawCatalogData from './catalog-data.json';

// Cast and normalize the imported catalog data
const products: Product[] = (rawCatalogData as unknown) as Product[];

// ============================================================
// CATALOG LOOKUP (O(1))
// ============================================================

/** Map of product_id → Product */
const productMap = new Map<string, Product>(
  products.map((p) => [p.product_id, p])
);

// ============================================================
// CATEGORY DEFINITIONS
// ============================================================

export interface CategoryInfo {
  id: ProductCategory;
  label: string;
  count: number;
  description?: string;
  icon?: string;
}

const categoryLabels: Record<string, string> = {
  phones: 'Smartphones',
  headphones: 'Audio & Earbuds',
  wearables: 'Smartwatches & Wearables',
  laptops: 'Laptops & Computers',
  accessories: 'Chargers & Accessories',
  storage: 'Storage & SSDs',
  footwear: 'Athletic Footwear',
  apparel: 'Athletic Apparel',
  skincare: 'Skincare & Beauty',
  nutrition: 'Sports Nutrition',
  tablets: 'Tablets',
  cameras: 'Cameras',
  gaming: 'Gaming',
  other: 'Other Essentials',
};

// ============================================================
// PUBLIC CATALOG APIS
// ============================================================

/**
 * Get all 54 canonical products in the catalog.
 */
export function getAllProducts(): Product[] {
  return products;
}

/**
 * Look up a product by its canonical product_id (e.g. "P101", "P114").
 * Returns undefined safely if the product is not found.
 */
export function getProductById(productId: string): Product | undefined {
  if (!productId) return undefined;
  return productMap.get(productId.trim().toUpperCase());
}

/**
 * Resolve an array of product IDs to their canonical Product representations.
 * Unknown or missing product IDs are safely filtered out without throwing.
 */
export function resolveProductIds(productIds: string[]): Product[] {
  if (!Array.isArray(productIds)) return [];
  const resolved: Product[] = [];

  for (const id of productIds) {
    const p = getProductById(id);
    if (p) resolved.push(p);
  }

  return resolved;
}

/**
 * Get products matching a specific category token.
 */
export function getProductsByCategory(category: string): Product[] {
  if (!category || category === 'all') return products;
  return products.filter((p) => p.category === category);
}

/**
 * Get featured products for homepage & highlights.
 */
export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

/**
 * Get trending products.
 */
export function getTrendingProducts(): Product[] {
  return products.filter((p) => p.trending);
}

/**
 * Get all available categories present in the catalog with counts.
 */
export function getAvailableCategories(): CategoryInfo[] {
  const counts = new Map<string, number>();

  for (const p of products) {
    const cat = p.category || 'other';
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([id, count]) => ({
      id: id as ProductCategory,
      label: categoryLabels[id] || id.charAt(0).toUpperCase() + id.slice(1),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get all distinct brand names in the catalog.
 */
export function getAvailableBrands(): string[] {
  const brands = new Set<string>();
  for (const p of products) {
    if (p.brand) brands.add(p.brand);
  }
  return Array.from(brands).sort();
}

/**
 * Search products by keyword across name, brand, category, tags, and description.
 */
export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;

  return products.filter((p) => {
    const searchable = [
      p.product_id,
      p.name,
      p.brand,
      p.category,
      p.categoryDisplay || '',
      p.subCategory || '',
      p.description,
      ...(p.tags || []),
      ...(p.featuresList || []),
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(q);
  });
}

export interface FilterOptions {
  query?: string;
  category?: string;
  brand?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating-desc';
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Comprehensive multi-factor filter and sort query engine.
 */
export function filterAndSortProducts(options: FilterOptions = {}): Product[] {
  let result = [...products];

  // 1. Text search
  if (options.query && options.query.trim()) {
    const q = options.query.toLowerCase().trim();
    result = result.filter((p) => {
      const searchSpace = [
        p.product_id,
        p.name,
        p.brand,
        p.category,
        p.categoryDisplay || '',
        p.subCategory || '',
        p.description,
        ...(p.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return searchSpace.includes(q);
    });
  }

  // 2. Category filter
  if (options.category && options.category !== 'all') {
    result = result.filter((p) => p.category === options.category);
  }

  // 3. Brand filter
  if (options.brand && options.brand !== 'all') {
    result = result.filter(
      (p) => p.brand.toLowerCase() === options.brand?.toLowerCase()
    );
  }

  // 4. In-stock only
  if (options.inStockOnly) {
    result = result.filter((p) => p.stockStatus !== 'out_of_stock');
  }

  // 5. Price range
  if (options.minPrice !== undefined) {
    result = result.filter((p) => p.price >= (options.minPrice ?? 0));
  }
  if (options.maxPrice !== undefined && options.maxPrice > 0) {
    result = result.filter((p) => p.price <= (options.maxPrice ?? Infinity));
  }

  // 6. Sorting
  switch (options.sortBy) {
    case 'price-asc':
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-desc':
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'rating-desc':
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'featured':
    default:
      result.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
      break;
  }

  return result;
}

/**
 * Check whether a product_id exists in the catalog.
 */
export function productExists(productId: string): boolean {
  return productMap.has(productId.trim().toUpperCase());
}

/**
 * Total number of products in the catalog.
 */
export function getProductCount(): number {
  return products.length;
}
