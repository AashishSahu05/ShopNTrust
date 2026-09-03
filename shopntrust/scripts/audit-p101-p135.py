import json
import os

with open('src/lib/catalog-data.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products in catalog: {len(products)}\n")
for p in products[:35]:
    pid = p['product_id']
    brand = p.get('brand', '')
    name = p.get('name', '')
    cat = p.get('category', '')
    sub = p.get('subCategory', '')
    img = p.get('image', '')
    exists = os.path.exists(f"public{img}") if img else False
    sz = os.path.getsize(f"public{img}") if exists else 0
    print(f"[{pid}] Brand: {brand} | Cat: {cat} | Sub: {sub}")
    print(f"      Name: {name}")
    print(f"      Image: {img} (Exists: {exists}, Size: {sz} bytes)")
    print("-" * 70)
