import os
import re

secret = "v2k9r5w8m3x7n1p4q0z6"
base_dir = r"d:\OneDrive\Duy Bao\AI Antigravity Project\Website Personal\src"

# We want to revert imports that should point to topxx services/api
patterns = [
    (re.compile(f'/api/{secret}'), '/api/topxx'),
    (re.compile(f'/services/api/{secret}'), '/services/api/topxx'),
    (re.compile(f'/services/{secret}Firestore'), '/services/topxxFirestore'),
]

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, replacement in patterns:
                    new_content = pattern.sub(replacement, new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Reverted: {path}")
            except Exception as e:
                print(f"Error {path}: {e}")
