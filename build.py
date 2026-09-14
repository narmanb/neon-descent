from pathlib import Path
import shutil
root=Path(__file__).parent
html=(root/'index.template.html').read_text()
for name in ['style','core','game','render','ui','ledge']:
    html=html.replace('/*'+name.upper()+'*/',(root/'src'/f'{name}.{ "css" if name=="style" else "js"}').read_text())
(root/'Neon-Descent.html').write_text(html)
(root/'index.html').write_text(html)
dist=root/'dist'
dist.mkdir(exist_ok=True)
(dist/'Neon-Descent.html').write_text(html)
(dist/'index.html').write_text(html)
for name in ['manifest.webmanifest','sw.js','icon.svg']:
    shutil.copy2(root/name,dist/name)
print(f'Built {len(html):,} characters, self-contained HTML + dist bundle')
