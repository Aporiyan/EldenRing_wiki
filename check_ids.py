# -*- coding: utf-8 -*-
import json, os

path = r'D:\Aporiyan\EldenRing_wiki\scripts\dlc_item_ids.json'
with open(path, 'r', encoding='utf-8') as f:
    ids = json.load(f)
print('=== dlc_item_ids.json keys ===')
for k, v in ids.items():
    print(' ', k, ':', len(v))
