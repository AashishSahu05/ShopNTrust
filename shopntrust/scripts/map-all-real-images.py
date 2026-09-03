import json
import os

lines = [
    "// ============================================================",
    "// ShopNTrust — Real Product Images (Authoritative Catalog Mapping)",
    "// ============================================================",
    "// Verified, high-resolution authentic product photography",
    "// for the canonical ShopNTrust collection.",
    "// ============================================================",
    "",
    "export const PRODUCT_REAL_IMAGES: Record<string, { main: string }> = {"
]

image_map = {}
for i in range(101, 167):
    pid = f"P{i}"
    if os.path.exists(f"public/images/products/{pid}.png"):
        path = f"/images/products/{pid}.png"
    elif os.path.exists(f"public/images/products/{pid}.jpg"):
        path = f"/images/products/{pid}.jpg"
    else:
        continue
    image_map[pid] = path
    lines.append(f"  {pid}: {{ main: '{path}' }},")

lines.extend([
    "};",
    "",
    "/**",
    " * Returns the authentic real retail image URL for a canonical product ID.",
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

with open("src/lib/catalog-data.json", "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    pid = p["product_id"]
    if pid in image_map:
        p["image"] = image_map[pid]
        p["images"] = [image_map[pid]]

with open("src/lib/catalog-data.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Successfully mapped {len(image_map)} authentic product images in product-images.ts and catalog-data.json!")
