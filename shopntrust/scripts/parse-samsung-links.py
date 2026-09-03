import re

with open(r'C:\Users\Aashish\.gemini\antigravity-ide\brain\520597f7-1018-4393-9116-f79ddafba13a\.system_generated\steps\1389\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

links = set(re.findall(r'https://images\.samsung\.com/is/image/samsung/p6pim/si/ep-t4510xbegeu/gallery/[^\s\"\'<>]+', text))
for l in list(links)[:10]:
    print(l)
