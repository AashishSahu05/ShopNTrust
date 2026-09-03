import urllib.request, os, re
from PIL import Image

with open(r'C:\Users\Aashish\.gemini\antigravity-ide\brain\520597f7-1018-4393-9116-f79ddafba13a\.system_generated\steps\1581\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

imgs = list(set(re.findall(r'https://image01\.realme\.net/general/[^\s"\'<>]+\.(?:png|jpg|webp)', text)))
print('Total realme general images:', len(imgs))

headers = {'User-Agent': 'Mozilla/5.0'}
matches = []
for idx, url in enumerate(imgs):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open('test_img.jpg', 'wb') as f:
            f.write(resp.read())
        im = Image.open('test_img.jpg')
        w, h = im.size
        ratio = w / h
        if 0.8 <= ratio <= 1.5 and w >= 500:
            print(f'{idx}: ({w}, {h}) -> {url}')
            matches.append((idx, w, h, url))
            if len(matches) >= 10:
                break
    except Exception as e:
        pass

if os.path.exists('test_img.jpg'):
    os.remove('test_img.jpg')
