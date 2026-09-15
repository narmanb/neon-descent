from pathlib import Path
import shutil
root=Path(__file__).parent
VERSION='0.20'
versioned=f'Neon-Descent-v{VERSION}.html'
html=(root/'index.template.html').read_text()
for name in ['style','core','genpolish','v017gen','v018geometry','v019geometry','v020gen','game','grip','render','ui','ledge','v014pre','v017pre','polish','v017camera','climbpolish','trappolish','debugtools','v013polish','v014polish','v015polish','v016polish','v017gameplay','v017polish','v018polish','v019polish','v020gameplay','release']:
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
