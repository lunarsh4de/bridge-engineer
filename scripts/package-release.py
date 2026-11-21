#!/usr/bin/env python3
"""Create a portable offline ZIP from explicitly allowed project paths."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--out', type=Path, default=ROOT / 'output/releases/riverbend-3d-v1.3.1-20261121.zip')
args = parser.parse_args()
allowed_dirs = ('site', 'css', 'js', 'assets', 'vendor', 'docs', 'tests', 'scripts')
allowed_files = ('index.html', 'favicon.svg', 'README.md', 'PROJECT_REQUIREMENTS.md')
files = {ROOT / name for name in allowed_files if (ROOT / name).is_file()}
for name in allowed_dirs:
    for file in (ROOT / name).rglob('*'):
        if file.is_file() and not any(part in ('__pycache__', '.git', 'node_modules') for part in file.relative_to(ROOT).parts) and file.suffix not in ('.pyc', '.pyo'):
            files.add(file)
manifest = {f.relative_to(ROOT).as_posix(): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(files)}
for source in (ROOT / 'site').rglob('*'):
    if source.is_file() and source.read_bytes() != (ROOT / source.relative_to(ROOT / 'site')).read_bytes():
        raise SystemExit('Mirror differs: run python scripts/sync-pages.py first')
args.out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.out, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        archive.write(file, 'riverbend-v1/' + file.relative_to(ROOT).as_posix())
    archive.writestr('riverbend-v1/RELEASE-SHA256.json', json.dumps(manifest, indent=2))
with zipfile.ZipFile(args.out) as archive:
    assert archive.testzip() is None, 'ZIP CRC check failed'
digest = hashlib.sha256(args.out.read_bytes()).hexdigest()
args.out.with_suffix('.zip.sha256').write_text(digest + '  ' + args.out.name + '\n', encoding='utf-8')
print(json.dumps({'package': str(args.out.resolve()), 'files': len(files), 'bytes': args.out.stat().st_size, 'sha256': digest}, indent=2))
