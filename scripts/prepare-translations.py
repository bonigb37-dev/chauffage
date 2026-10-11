"""Organise reviewed translations; no network or machine translation is used."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'translations'
inventory = json.loads((SOURCE / 'customer-inventory.json').read_text(encoding='utf-8'))
catalogues = {'fr': {}, 'de': {}, 'en': {}}
seen = set()
for line in (SOURCE / 'reviewed.tsv').read_text(encoding='utf-8').splitlines():
    if not line.strip():
        continue
    columns = line.split('\t')
    if len(columns) != 3:
        raise ValueError(f'Expected three TSV columns: {line[:50]}')
    index = int(columns[0])
    if index in seen:
        raise ValueError(f'Duplicate source index: {index}')
    seen.add(index)
    source = re.sub(r'\s+', ' ', html.unescape(inventory[index]['text'])).strip()
    for locale, value in zip(('de', 'en'), columns[1:]):
        catalogues[locale][source] = value
    catalogues['fr'][source] = source
for filename in ('additional.json', 'admin.json'):
    extra_path = SOURCE / filename
    if extra_path.exists():
        for source, values in json.loads(extra_path.read_text(encoding='utf-8')).items():
            for locale in catalogues:
                catalogues[locale][source] = values.get(locale, source)
for locale, catalogue in catalogues.items():
    (SOURCE / f'{locale}.json').write_text(json.dumps(catalogue, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')
print(f'Prepared {len(catalogues["de"])} reviewed strings in DE / FR / EN.')
