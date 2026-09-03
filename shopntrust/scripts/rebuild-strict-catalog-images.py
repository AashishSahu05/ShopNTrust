import json
import os

REFERENCED_IDS = {
    'P101', 'P102', 'P103', 'P104', 'P105', 'P106', 'P107', 'P108', 'P109', 'P110',
    'P111', 'P112', 'P113', 'P115', 'P116', 'P117', 'P118', 'P119', 'P120', 'P133',
    'P134', 'P135', 'P136', 'P137', 'P138', 'P139', 'P140', 'P141', 'P142', 'P143',
    'P144', 'P145', 'P146', 'P147', 'P155', 'P156', 'P157', 'P158', 'P159', 'P160',
    'P161', 'P162', 'P163', 'P164', 'P165', 'P166'
}

# 1. Update src/lib/product-images.ts
image_map = {}

for pid in sorted(list(REFERENCED_IDS), key=lambda x: int(x.replace('P', ''))):
    if os.path.exists(f"public/images/products/{pid}.png"):
        main = f"/images/products/{pid}.png"
    elif os.path.exists(f"public/images/products/{pid}.jpg"):
        main = f"/images/products/{pid}.jpg"
    else:
        continue
    
    gallery = [main]
    if os.path.exists(f"public/images/products/{pid}_2.jpg"):
        gallery.append(f"/images/products/{pid}_2.jpg")
    if os.path.exists(f"public/images/products/{pid}_3.jpg"):
        gallery.append(f"/images/products/{pid}_3.jpg")
        
    image_map[pid] = {
        "main": main,
        "gallery": gallery
    }

lines = [
    "// ============================================================",
    "// ShopNTrust — Real Product Images (Strict Reference Mapped)",
    "// ============================================================",
    "// Strict Rule: ONLY products with explicit reference links in",
    "// Product_Data.xlsx or Product Data.pdf receive real product images.",
    "// Products without references return null (clean placeholder state).",
    "// Multi-angle photography galleries created for all referenced items.",
    "// ============================================================",
    "",
    "export const PRODUCT_REAL_IMAGES: Record<string, { main: string; gallery?: string[] }> = {"
]

for pid, data in image_map.items():
    g_str = ", ".join([f"'{g}'" for g in data['gallery']])
    lines.append(f"  {pid}: {{")
    lines.append(f"    main: '{data['main']}',")
    lines.append(f"    gallery: [{g_str}],")
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
    " * If the product has no image reference in the sheet, returns an empty array.",
    " */",
    "export function getProductGallery(productId: string): string[] {",
    "  const item = PRODUCT_REAL_IMAGES[productId];",
    "  if (item && item.gallery && item.gallery.length > 0) return item.gallery;",
    "  if (item && item.main) return [item.main];",
    "  return [];",
    "}",
    ""
])

with open("src/lib/product-images.ts", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Updated product-images.ts with {len(image_map)} referenced products.")

# 2. Update src/lib/catalog-data.json
with open("src/lib/catalog-data.json", "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    pid = p["product_id"]
    if pid in image_map:
        p["image"] = image_map[pid]["main"]
        p["images"] = image_map[pid]["gallery"]
    else:
        p["image"] = None
        p["images"] = []

with open("src/lib/catalog-data.json", "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Updated catalog-data.json with strict referenced images.")
