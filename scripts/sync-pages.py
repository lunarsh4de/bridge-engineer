#!/usr/bin/env python3
"""Copy the site/ runtime (single source) to the GitHub Pages root mirror, or verify it.
Local copy only: never commits, pushes or deploys."""
from pathlib import Path
import argparse
import shutil

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true", help="only verify the mirror matches site/")
args = parser.parse_args()
files = [p for p in SITE.rglob("*") if p.is_file() and p.name != ".DS_Store"]
bad = []
for source in files:
    target = ROOT / source.relative_to(SITE)
    if args.check:
        if not target.exists() or source.read_bytes() != target.read_bytes():
            bad.append(str(target.relative_to(ROOT)))
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
if bad:
    raise SystemExit("Pages mirror differs from site/: " + ", ".join(bad))
print(("Verified" if args.check else "Copied") + f" {len(files)} Pages runtime files.")
