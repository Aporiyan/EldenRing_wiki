"""Extract DLC items from item_ids.yml and find Chinese name mappings."""
import re, sys, json

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

sections = ['DLC Armor', 'DLC Talismans', 'DLC Spells', 'DLC Ashes of War', 'DLC Spirit Ashes']
for s in sections:
    idx = content.find(f'"{s}"')
    if idx >= 0:
        end = content.find('\n"', idx + len(s) + 5)
        if end < 0:
            end = idx + 5000
        snippet = content[idx:end]
        print(f'=== {s} ===')
        print(snippet[:2500])
        print()
        print('---END---')
        print()
