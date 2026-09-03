// ============================================================
// ShopNTrust — Real Product Images (Authoritative Catalog Mapping)
// ============================================================
// Verified, high-resolution authentic product photography
// for the canonical ShopNTrust collection.
// ============================================================

export const PRODUCT_REAL_IMAGES: Record<string, { main: string }> = {
  P101: { main: '/images/products/P101.jpg' },
  P102: { main: '/images/products/P102.jpg' },
  P103: { main: '/images/products/P103.jpg' },
  P104: { main: '/images/products/P104.jpg' },
  P105: { main: '/images/products/P105.jpg' },
  P106: { main: '/images/products/P106.jpg' },
  P107: { main: '/images/products/P107.jpg' },
  P108: { main: '/images/products/P108.jpg' },
  P109: { main: '/images/products/P109.jpg' },
  P110: { main: '/images/products/P110.jpg' },
  P111: { main: '/images/products/P111.jpg' },
  P112: { main: '/images/products/P112.jpg' },
  P113: { main: '/images/products/P113.jpg' },
  P114: { main: '/images/products/P114.png' },
  P115: { main: '/images/products/P115.jpg' },
  P116: { main: '/images/products/P116.jpg' },
  P117: { main: '/images/products/P117.jpg' },
  P118: { main: '/images/products/P118.jpg' },
  P119: { main: '/images/products/P119.jpg' },
  P120: { main: '/images/products/P120.jpg' },
  P121: { main: '/images/products/P121.jpg' },
  P122: { main: '/images/products/P122.jpg' },
  P123: { main: '/images/products/P123.jpg' },
  P124: { main: '/images/products/P124.jpg' },
  P125: { main: '/images/products/P125.jpg' },
  P126: { main: '/images/products/P126.jpg' },
  P127: { main: '/images/products/P127.jpg' },
  P128: { main: '/images/products/P128.jpg' },
  P129: { main: '/images/products/P129.jpg' },
  P130: { main: '/images/products/P130.jpg' },
  P131: { main: '/images/products/P131.jpg' },
  P132: { main: '/images/products/P132.jpg' },
  P133: { main: '/images/products/P133.jpg' },
  P134: { main: '/images/products/P134.jpg' },
  P135: { main: '/images/products/P135.jpg' },
  P136: { main: '/images/products/P136.jpg' },
  P137: { main: '/images/products/P137.jpg' },
  P138: { main: '/images/products/P138.jpg' },
  P139: { main: '/images/products/P139.jpg' },
  P140: { main: '/images/products/P140.jpg' },
  P141: { main: '/images/products/P141.jpg' },
  P142: { main: '/images/products/P142.jpg' },
  P143: { main: '/images/products/P143.jpg' },
  P144: { main: '/images/products/P144.jpg' },
  P145: { main: '/images/products/P145.jpg' },
  P146: { main: '/images/products/P146.jpg' },
  P147: { main: '/images/products/P147.jpg' },
  P148: { main: '/images/products/P148.jpg' },
  P149: { main: '/images/products/P149.jpg' },
  P150: { main: '/images/products/P150.jpg' },
  P151: { main: '/images/products/P151.jpg' },
  P152: { main: '/images/products/P152.jpg' },
  P153: { main: '/images/products/P153.jpg' },
  P154: { main: '/images/products/P154.jpg' },
  P155: { main: '/images/products/P155.jpg' },
  P156: { main: '/images/products/P156.jpg' },
  P157: { main: '/images/products/P157.jpg' },
  P158: { main: '/images/products/P158.jpg' },
  P159: { main: '/images/products/P159.jpg' },
  P160: { main: '/images/products/P160.jpg' },
  P161: { main: '/images/products/P161.jpg' },
  P162: { main: '/images/products/P162.jpg' },
  P163: { main: '/images/products/P163.jpg' },
  P164: { main: '/images/products/P164.jpg' },
  P165: { main: '/images/products/P165.jpg' },
  P166: { main: '/images/products/P166.jpg' },
};

/**
 * Returns the authentic real retail image URL for a canonical product ID.
 */
export function getProductImageUrl(productId: string): string | null {
  const item = PRODUCT_REAL_IMAGES[productId];
  if (item && item.main) return item.main;
  return null;
}

/**
 * Returns gallery image URLs for a given product ID.
 */
export function getProductGallery(productId: string): string[] {
  const item = PRODUCT_REAL_IMAGES[productId];
  if (item && item.main) return [item.main];
  return [];
}
