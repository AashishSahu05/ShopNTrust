// ============================================================
// ShopNTrust — Catalog Synchronization Architecture
// ============================================================
// Architectural utility for future "Sync product catalog" actions.
//
// In later phases or ongoing updates:
// 1. Reads latest tabular/Google Sheet records
// 2. Matches records by canonical `product_id`
// 3. Detects added, updated, unchanged, and removed products
// 4. Validates field constraints (prices, unique IDs, variants)
// 5. Produces an audit report before writing changes to canonical store
// ============================================================

import type { Product } from '@/types';
import { getAllProducts } from './catalog';

export interface SyncReport {
  timestamp: string;
  sourceType: 'excel' | 'google_sheet' | 'json';
  totalSourceRows: number;
  addedCount: number;
  updatedCount: number;
  unchangedCount: number;
  removedCount: number;
  addedIds: string[];
  updatedIds: string[];
  validationIssues: string[];
}

/**
 * Validates a candidate product object before catalog insertion.
 */
export function validateProductData(product: Partial<Product>): string[] {
  const errors: string[] = [];

  if (!product.product_id) {
    errors.push('Missing mandatory product_id');
  } else if (!/^[A-Z0-9_-]+$/i.test(product.product_id)) {
    errors.push(`Invalid product_id format: "${product.product_id}"`);
  }

  if (!product.name || !product.name.trim()) {
    errors.push(`Product "${product.product_id || 'unknown'}": Missing product name`);
  }

  if (product.price !== undefined && (isNaN(product.price) || product.price < 0)) {
    errors.push(`Product "${product.product_id}": Invalid price value: ${product.price}`);
  }

  if (product.variants && Array.isArray(product.variants)) {
    const vIds = new Set<string>();
    for (const v of product.variants) {
      if (!v.variant_id) {
        errors.push(`Product "${product.product_id}": Variant missing variant_id`);
      } else if (vIds.has(v.variant_id)) {
        errors.push(`Product "${product.product_id}": Duplicate variant_id "${v.variant_id}"`);
      }
      vIds.add(v.variant_id);
    }
  }

  return errors;
}

/**
 * Generates an audit diff between current canonical catalog and incoming source data.
 */
export function auditCatalogSync(incomingProducts: Product[]): SyncReport {
  const currentCatalog = getAllProducts();
  const currentMap = new Map(currentCatalog.map((p) => [p.product_id, p]));
  const incomingMap = new Map(incomingProducts.map((p) => [p.product_id, p]));

  const addedIds: string[] = [];
  const updatedIds: string[] = [];
  const validationIssues: string[] = [];
  let unchangedCount = 0;

  for (const inc of incomingProducts) {
    const errors = validateProductData(inc);
    if (errors.length > 0) {
      validationIssues.push(...errors);
    }

    const curr = currentMap.get(inc.product_id);
    if (!curr) {
      addedIds.push(inc.product_id);
    } else {
      const isDiff = JSON.stringify(curr) !== JSON.stringify(inc);
      if (isDiff) {
        updatedIds.push(inc.product_id);
      } else {
        unchangedCount++;
      }
    }
  }

  const removedCount = currentCatalog.filter(
    (p) => !incomingMap.has(p.product_id)
  ).length;

  return {
    timestamp: new Date().toISOString(),
    sourceType: 'excel',
    totalSourceRows: incomingProducts.length,
    addedCount: addedIds.length,
    updatedCount: updatedIds.length,
    unchangedCount,
    removedCount,
    addedIds,
    updatedIds,
    validationIssues,
  };
}
