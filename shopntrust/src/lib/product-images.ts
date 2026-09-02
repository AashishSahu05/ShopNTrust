// ============================================================
// ShopNTrust — Real Product Images (Strict Reference Mapped)
// ============================================================
// Only products with explicit references in Product_Data.xlsx
// are mapped to real retail photos.
// Products without reference links return null (clean placeholder state).
// ============================================================

export const PRODUCT_REAL_IMAGES: Record<string, { main: string; gallery?: string[] }> = {
  // OnePlus Ecosystem
  P101: {
    main: '/images/products/P101.jpg',
    gallery: ['/images/products/P101.jpg'],
  },

  // Samsung Galaxy Ecosystem
  P106: {
    main: '/images/products/P106.jpg',
    gallery: ['/images/products/P106.jpg'],
  },
  P107: {
    main: '/images/products/P107.jpg',
    gallery: ['/images/products/P107.jpg'],
  },
  P110: {
    main: '/images/products/P110.jpg',
    gallery: ['/images/products/P110.jpg'],
  },
  P112: {
    main: '/images/products/P112.jpg',
    gallery: ['/images/products/P112.jpg'],
  },
  P113: {
    main: '/images/products/P113.jpg',
    gallery: ['/images/products/P113.jpg'],
  },

  // Apple Ecosystem
  P114: {
    main: '/images/products/P114.jpg',
    gallery: ['/images/products/P114.jpg'],
  },
  P115: {
    main: '/images/products/P115.jpg',
    gallery: ['/images/products/P115.jpg'],
  },
  P117: {
    main: '/images/products/P117.jpg',
    gallery: ['/images/products/P117.jpg'],
  },
  P118: {
    main: '/images/products/P118.jpg',
    gallery: ['/images/products/P118.jpg'],
  },
  P120: {
    main: '/images/products/P120.jpg',
    gallery: ['/images/products/P120.jpg'],
  },

  // Nike Athletic Wear
  P133: {
    main: '/images/products/P133.jpg',
    gallery: ['/images/products/P133.jpg'],
  },
  P134: {
    main: '/images/products/P134.jpg',
    gallery: ['/images/products/P134.jpg'],
  },
  P135: {
    main: '/images/products/P135.jpg',
    gallery: ['/images/products/P135.jpg'],
  },
  P137: {
    main: '/images/products/P137.jpg',
    gallery: ['/images/products/P137.jpg'],
  },

  // Skincare & Beauty (Minimalist & Mamaearth)
  P139: {
    main: '/images/products/P139.jpg',
    gallery: ['/images/products/P139.jpg'],
  },
  P140: {
    main: '/images/products/P140.jpg',
    gallery: ['/images/products/P140.jpg'],
  },
  P141: {
    main: '/images/products/P141.jpg',
    gallery: ['/images/products/P141.jpg'],
  },
  P142: {
    main: '/images/products/P142.jpg',
    gallery: ['/images/products/P142.jpg'],
  },
  P143: {
    main: '/images/products/P143.jpg',
    gallery: ['/images/products/P143.jpg'],
  },

  // Sports Nutrition (Optimum Nutrition)
  P147: {
    main: '/images/products/P147.jpg',
    gallery: ['/images/products/P147.jpg'],
  },

  // Laptops & Computers (ASUS)
  P153: {
    main: '/images/products/P153.jpg',
    gallery: ['/images/products/P153.jpg'],
  },
};

/**
 * Returns the exact brand-matched real retail image URL if referenced,
 * or null if no image reference was provided in the source sheet.
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
  if (item && item.gallery && item.gallery.length > 0) return item.gallery;
  if (item && item.main) return [item.main];
  return [];
}
