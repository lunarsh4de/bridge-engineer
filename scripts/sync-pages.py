#!/usr/bin/env python3
"""Copy accepted site runtime to the legacy GitHub Pages root, or verify it."""
from pathlib import Path
import argparse
import shutil
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
files = [p for p in (ROOT / 'site').rglob('*') if p.is_file() and p.name != '.DS_Store']
for source in files:
    target = ROOT / source.relative_to(ROOT / 'site')
    if args.check:
        if not target.exists() or source.read_bytes() != target.read_bytes():
            raise SystemExit('Pages copy differs: ' + str(target.relative_to(ROOT)))
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
print(('Verified' if args.check else 'Copied') + f' {len(files)} Pages runtime files.')
