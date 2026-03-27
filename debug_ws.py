
with open('src/app/(phim)/xem/[...slug]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(135, 150):
        print(f"{i+1}: {repr(lines[i])}")
