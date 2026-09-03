import json
import os
from PIL import Image

with open('src/lib/catalog-data.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"{'PID':<6} | {'Brand':<10} | {'Name':<35} | {'Image Path':<25} | {'Dimensions':<12} | {'Bytes':<8}")
print("-" * 105)

for p in products:
    pid = p['product_id']
    brand = (p.get('brand') or 'N/A')[:10]
    name = (p.get('name') or '')[:35]
    img = p.get('image') or ''
    full_path = f"public{img}"
    if os.path.exists(full_path):
        try:
            with Image.open(full_path) as im:
                dim = f"{im.width}x{im.height}"
        except Exception:
            dim = "ERR"
        sz = os.path.getsize(full_path)
    else:
        dim = "MISSING"
        sz = 0
    print(f"{pid:<6} | {brand:<10} | {name:<35} | {img:<25} | {dim:<12} | {sz:<8}")
