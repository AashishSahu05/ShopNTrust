import re

with open(r'C:\Users\Aashish\.gemini\antigravity-ide\brain\520597f7-1018-4393-9116-f79ddafba13a\.system_generated\steps\1445\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

imgs = set(re.findall(r'https?://[^\s\"\'<>]+\.(?:jpg|png|webp)', text))
print('Tata Cliq image count:', len(imgs))
for img in imgs:
    if 'mp000000023853270' in img or 'tatacliq' in img:
        print(img)
