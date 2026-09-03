import urllib.request
import json
import urllib.parse

headers = {'User-Agent': 'ShopNTrust/1.0 (test@shopntrust.com)'}

def search_files(term):
    params = urllib.parse.urlencode({
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': f"{term} filetype:bitmap",
        'srnamespace': '6',
        'srlimit': '5'
    })
    url = f"https://commons.wikimedia.org/w/api.php?{params}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        return [r['title'] for r in data.get('query', {}).get('search', [])]

for q in ['phone case', 'smartphone silicone case', 'earphones case', 'USB charger adapter']:
    print(f"=== {q} ===")
    for title in search_files(q):
        print(" ", title)
