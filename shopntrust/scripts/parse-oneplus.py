import re

with open(r'C:\Users\Aashish\.gemini\antigravity-ide\brain\520597f7-1018-4393-9116-f79ddafba13a\.system_generated\steps\1406\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

urls = re.findall(r'https?://[^\s\"\'<>]+\.(?:jpg|png|webp)', text)
print('Found image URLs:', len(urls))
for u in urls[:15]:
    print(' ', u)

# Also check for cdn or image paths
all_cdn = set(re.findall(r'https://oasis\.opstatics\.com/[^\s\"\'<>]+', text))
print('Oasis CDN links:', len(all_cdn))
for c in list(all_cdn)[:10]:
    print(' ', c)
