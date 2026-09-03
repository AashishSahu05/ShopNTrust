import pypdf

reader = pypdf.PdfReader('C:/Users/Aashish/.gemini/antigravity-ide/brain/520597f7-1018-4393-9116-f79ddafba13a/.user_uploaded/media_1788454448043.pdf')
with open('scripts/pdf-dump.txt', 'w', encoding='utf-8') as f:
    for idx, page in enumerate(reader.pages):
        f.write(f"\n==================== PAGE {idx+1} ====================\n")
        f.write(page.extract_text() or "")
print("Successfully extracted all 18 pages of PDF to scripts/pdf-dump.txt")
