import re

with open(r'C:\Users\Aashish\.gemini\antigravity-ide\brain\520597f7-1018-4393-9116-f79ddafba13a\.system_generated\steps\1667\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', text)
print('Goods 561 images:', len(imgs))
for img in set(imgs):
    print(img)
