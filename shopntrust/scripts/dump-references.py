import openpyxl

wb = openpyxl.load_workbook('Product_Data.xlsx', data_only=True)
ws = wb['Product_images_References']

for row in ws.iter_rows(values_only=True):
    non_empty = [c for c in row if c is not None]
    if non_empty:
        print(non_empty)
