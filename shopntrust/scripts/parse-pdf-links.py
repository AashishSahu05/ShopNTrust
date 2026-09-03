import re

with open('scripts/pdf-dump.txt', 'r', encoding='utf-8') as f:
    pages = f.read().split('==================== PAGE ')

for p in pages:
    if not p.strip(): continue
    lines = p.split('\n')
    header = lines[0]
    content = '\n'.join(lines[1:])
    # Search for Product_ID rows
    matches = re.findall(r'(P1\d\d)\s+(http[^\s\n]+)', content)
    if matches:
        print(f"=== {header} ===")
        for pid, url in matches:
            print(f"  {pid} -> {url}")
