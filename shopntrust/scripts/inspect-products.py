import json

with open('src/lib/catalog-data.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

target_ids = ['P121', 'P122', 'P123', 'P124', 'P125', 'P126', 'P127', 'P128', 'P129', 'P130', 'P131', 'P132']
for p in products:
    if p['product_id'] in target_ids:
        print(f"ID: {p['product_id']}")
        print(f"  Name: {p['name']}")
        print(f"  Brand: {p.get('brand')}")
        print(f"  Category: {p.get('category')} | SubCategory: {p.get('subCategory')}")
        print(f"  Description: {p.get('description')}")
        print(f"  Cross-sells: {p.get('crossSells')} | Upsells: {p.get('upsells')}")
        print(f"  Current Image: {p.get('image')}")
        print("-" * 60)
