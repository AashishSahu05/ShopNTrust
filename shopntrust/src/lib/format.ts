// ============================================================
// ShopNTrust — Formatting Utilities
// ============================================================

import { appConfig } from '@/lib/config';

/**
 * Format a price for display.
 * Example: formatPrice(55999) → "₹55,999"
 */
export function formatPrice(
  price: number,
  currency: string = appConfig.currency
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Generate a unique ID (for messages, sessions, etc.)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}
