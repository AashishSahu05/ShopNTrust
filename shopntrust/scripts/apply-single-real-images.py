import json
import os

# Exactly the 46 products with authoritative references in Product_Data.xlsx or Product Data.pdf
REFERENCED_IDS = [
    'P101', 'P102', 'P103', 'P104', 'P105', 'P106', 'P107', 'P108', 'P109', 'P110',
    'P111', 'P112', 'P113', 'P115', 'P116', 'P117', 'P118', 'P119', 'P120', 'P133',
    'P134', 'P135', 'P136', 'P137', 'P138', 'P139', 'P140', 'P141', 'P142', 'P143',
    'P144', 'P145', 'P146', 'P147', 'P155', 'P156', 'P157', 'P158', 'P159', 'P160',
    'P161', 'P162', 'P163', 'P164', 'P165', 'P166'
]

# 1. Write clean src/lib/product-images.ts
lines = [
    "// ============================================================",
    "// ShopNTrust — Real Product Images (Strict Reference Mapped)",
    "// ============================================================",
    "// Single authoritative real product image per item.",
    "// Only products with explicit references in Product_Data.xlsx",
    "// or Product Data.pdf receive genuine product photography.",
    "// Unreferenced products return null (clean placeholder state).",
    "// ============================================================",
    "",
    "export const PRODUCT_REAL_IMAGES: Record<string, { main: string }> = {"
]

for pid in sorted(REFERENCED_IDS, key=lambda x: int(x.replace('P', ''))):
    lines.append(f"  {pid}: {{")
    lines.append(f"    main: '/images/products/{pid}.jpg',")
    lines.append(f"  }},")

lines.extend([
    "};",
    "",
    "/**",
    " * Returns the exact brand-matched real retail image URL if referenced,",
    " * or null if no image reference was provided in the source sheet.",
    " */",
    "export function getProductImageUrl(productId: string): string | null {",
    "  const item = PRODUCT_REAL_IMAGES[productId];",
    "  if (item && item.main) return item.main;",
    "  return null;",
    "}",
    "",
    "/**",
    " * Returns gallery image URLs for a given product ID.",
    " */",
    "export function getProductGallery(productId: string): string[] {",
    "  const item = PRODUCT_REAL_IMAGES[productId];",
    "  if (item && item.main) return [item.main];",
    "  return [];",
    "}",
    ""
])

with open("src/lib/product-images.ts", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Successfully wrote clean src/lib/product-images.ts with single real images.")

# 2. Update src/lib/catalog-data.json
with open("src/lib/catalog-data.json", "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    pid = p["product_id"]
    if pid in REFERENCED_IDS:
        p["image"] = f"/images/products/{pid}.jpg"
        p["images"] = [f"/images/products/{pid}.jpg"]
    else:
        p["image"] = None
        p["images"] = []

with open("src/lib/catalog-data.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Successfully updated catalog-data.json with single authentic images.")
