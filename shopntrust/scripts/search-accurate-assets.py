import urllib.request
import json
import urllib.parse

headers = {'User-Agent': 'ShopNTrust/1.0 (test@shopntrust.com)'}

def search_commons(q):
    params = urllib.parse.urlencode({
        'action': 'query',
        'format': 'json',
        'generator': 'search',
        'gsrsearch': q,
        'gsrnamespace': '6',
        'gsrlimit': '6',
        'prop': 'imageinfo',
        'iiprop': 'url|size|mime'
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data.get('query', {}).get('pages', {})
            return [(v.get('title'), v['imageinfo'][0]['url']) for k, v in pages.items() if 'imageinfo' in v]
    except Exception as e:
        print(f"Error {q}: {e}")
        return []

targets = [
    ("P102 Phone Case", "smartphone silicone case cover"),
    ("P123 Earbuds Silicone Case", "silicone case cover earbuds"),
    ("P104 Dual Port GaN Charger", "GaN USB charger adapter"),
    ("P128 Fast Charger", "fast charger USB adapter white"),
    ("P148 Creatine Powder", "creatine powder tub supplement"),
    ("P151 Whey Protein 5lb", "whey protein powder container")
]

for label, query in targets:
    print(f"\n==================== {label} ====================")
    results = search_commons(query)
    for title, url in results[:4]:
        print(f"  {title}\n    {url}")
