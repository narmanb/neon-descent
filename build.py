from pathlib import Path
root=Path(__file__).parent
html=(root/'index.template.html').read_text()
for name in ['style','core','game','render','ui']:
    html=html.replace('/*'+name.upper()+'*/',(root/'src'/f'{name}.{ "css" if name=="style" else "js"}').read_text())
(root/'Neon-Descent.html').write_text(html)
(root/'index.html').write_text(html)
print(f'Built {len(html):,} characters, self-contained HTML')
