import re, urllib.request, os
from PIL import Image

with open(r'C:\Users\Aashish\.gemini\antigravity-ide\brain\520597f7-1018-4393-9116-f79ddafba13a\.system_generated\steps\1581\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

imgs = list(set(re.findall(r'https://image01\.realme\.net/general/20240926/[^\s"\'<>]+\.(?:png|jpg|webp)', text)))
print('20240926 images:', len(imgs))

headers = {'User-Agent': 'Mozilla/5.0'}
for idx, img in enumerate(imgs):
    try:
        req = urllib.request.Request(img, headers=headers)
        with urllib.request.urlopen(req) as resp, open('temp_cand.jpg', 'wb') as f:
            f.write(resp.read())
        im = Image.open('temp_cand.jpg')
        w, h = im.size
        if w > 800 and h > 800:
            print(f'{idx}: {w}x{h} -> {img}')
    except Exception as e:
        pass

if os.path.exists('temp_cand.jpg'):
    os.remove('temp_cand.jpg')
