import urllib.request, json, urllib.parse

headers = {'User-Agent': 'ShopNTrust/1.0 (test@shopntrust.com)'}

def search_commons(query):
    params = urllib.parse.urlencode({
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': query,
        'srnamespace': '6',
        'srlimit': '6'
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        results = data.get('query', {}).get('search', [])
        return [r['title'] for r in results]

def get_url(title):
    params = urllib.parse.urlencode({
        'action': 'query',
        'titles': title,
        'prop': 'imageinfo',
        'iiprop': 'url',
        'format': 'json'
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        for k, v in data.get('query', {}).get('pages', {}).items():
            if 'imageinfo' in v:
                return v['imageinfo'][0]['url']
    return None

searches = [
    'silicone phone case',
    'smartphone protective case',
    'earbuds silicone case',
    'USB-C wall charger',
    'GaN charger',
    'creatine powder',
    'whey protein container',
    'TWS earbuds charging case'
]

for s in searches:
    res = search_commons(s)
    print(f"=== {s} ===")
    for r in res[:3]:
        url = get_url(r)
        print(f"  {r} -> {url}")
