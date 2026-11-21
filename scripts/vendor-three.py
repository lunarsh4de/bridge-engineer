"""Vendor official Three.js r165 as classic scripts for offline file:// use.
No npm or runtime build. Only import/export boundaries are adapted.
"""
from pathlib import Path
import hashlib
import json
import re
from urllib.request import urlopen

root = Path(__file__).resolve().parents[1] / 'site/vendor/three'
root.mkdir(parents=True, exist_ok=True)
urls = {
    'three.module.min.js': 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js',
    'OrbitControls.module.js': 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js',
    'LICENSE': 'https://cdn.jsdelivr.net/npm/three@0.165.0/LICENSE',
}
manifest = {}
for name, url in urls.items():
    data = urlopen(url, timeout=60).read()
    (root / name).write_bytes(data)
    manifest[name] = {'url': url, 'sha256': hashlib.sha256(data).hexdigest()}
source = (root / 'three.module.min.js').read_text(encoding='utf-8')
match = re.search(r'export\s*\{([^}]+)\}\s*;?\s*$', source)
assert match, 'Unexpected Three.js export format'
fields = []
for field in match.group(1).split(','):
    pair = re.split(r'\s+as\s+', field.strip())
    fields.append((pair[-1] + ':' + pair[0]) if len(pair) == 2 else pair[0])
classic = source[:match.start()] + '\nreturn {' + ','.join(fields) + '};\n'
(root / 'three.min.js').write_text('(function(root){root.THREE=(function(){\n' + classic + '})();})(typeof self!=="undefined"?self:this);\n', encoding='utf-8')
source = (root / 'OrbitControls.module.js').read_text(encoding='utf-8')
source, count = re.subn(r"import\s*\{([^}]+)\}\s*from\s*'three';", r'const {\1} = root.THREE;', source)
assert count == 1
source, count = re.subn(r'export\s*\{\s*OrbitControls\s*\};?', 'root.OrbitControls = OrbitControls;', source)
assert count == 1
(root / 'OrbitControls.js').write_text('(function(root){\n' + source + '\n})(typeof self!=="undefined"?self:this);\n', encoding='utf-8')
(root / 'PROVENANCE.json').write_text(json.dumps({'version': '0.165.0', 'adaptation': 'Classic script wrappers; source import/export boundaries only. MIT license included.', 'sources': manifest}, indent=2) + '\n', encoding='utf-8')
print('Vendored Three.js r165 and official OrbitControls; MIT license and source hashes recorded.')
