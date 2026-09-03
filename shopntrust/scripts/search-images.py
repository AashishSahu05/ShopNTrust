import urllib.request
import urllib.parse
import re
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def search_ddg_images(query):
    url = "https://duckduckgo.com/i.js?q=" + urllib.parse.quote(query) + "&o=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('results', [])
            return [r['image'] for r in results[:5]]
    except Exception as e:
        return [f"Error: {e}"]

queries = [
    ("P102 OnePlus Case", "OnePlus Nord CE Sandstone Case product photo"),
    ("P123 Silicone Case", "silicone case cover with carabiner for earbuds"),
    ("P125 Lanyard Case", "silicone earphone case with lanyard"),
    ("P104 Dual Port GaN", "OnePlus SUPERVOOC 100W dual port GaN adapter"),
    ("P128 Realme Charger", "Realme 80W SuperVOOC charger adapter"),
    ("P148 Creatine", "Optimum Nutrition Micronised Creatine powder tub"),
    ("P151 5lb Whey", "Optimum Nutrition Gold Standard 100 Whey 5 lbs tub"),
    ("P156 Ring Case", "Ultrahuman Ring Protector case"),
    ("P121 boAt Zenith", "boAt Nirvana Zenith Pro TWS earbuds"),
    ("P122 boAt Nirvana X", "boAt Nirvana X TWS earbuds"),
    ("P124 Noise VS102", "Noise Buds VS102 truly wireless earbuds"),
    ("P126 Noise VS102 Pro", "Noise Buds VS102 Pro ANC earbuds"),
    ("P127 Realme Buds Air 6 Pro", "Realme Buds Air 6 Pro earbuds"),
    ("P131 Noise Vector", "Noise Buds Vector TWS earbuds")
]

for label, q in queries:
    print(f"\n==================== {label} ====================")
    imgs = search_ddg_images(q)
    for img in imgs:
        print(" ", img)
