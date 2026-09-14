from pathlib import Path
import shutil
root=Path(__file__).parent
VERSION='0.14'
versioned=f'Neon-Descent-v{VERSION}.html'
html=(root/'index.template.html').read_text()
for name in ['style','core','genpolish','game','grip','render','ui','ledge','v014pre','polish','climbpolish','trappolish','debugtools','v013polish','v014polish','release']:
    html=html.replace('/*'+name.upper()+'*/',(root/'src'/f'{name}.{ "css" if name=="style" else "js"}').read_text())
html=html.replace('__NEON_VERSION__',VERSION)
(root/'Neon-Descent.html').write_text(html)
(root/versioned).write_text(html)
(root/'index.html').write_text(html)
dist=root/'dist'
dist.mkdir(exist_ok=True)
(dist/'Neon-Descent.html').write_text(html)
(dist/versioned).write_text(html)
(dist/'index.html').write_text(html)
for name in ['manifest.webmanifest','sw.js','icon.svg']:
    shutil.copy2(root/name,dist/name)
print(f'Built v{VERSION}: {len(html):,} characters, {versioned} + Sites bundle')
