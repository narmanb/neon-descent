'use strict';
(() => {
  const VERSION='__NEON_VERSION__';
  window.NEON_VERSION=VERSION;

  const style=document.createElement('style');
  style.textContent=`
    .passive-strip{display:flex;align-items:center;gap:3px;min-height:20px}
    .passive-chip{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #5f88966b;border-radius:4px;background:#0b2635d9;font:700 9px ui-monospace,monospace;box-shadow:inset 0 0 8px #0005;line-height:1}
    .passive-chip.empty{display:none}
    @media(max-height:440px){.passive-chip{width:18px;height:18px;font-size:8px}.passive-strip{gap:2px}}
  `;
  document.head.appendChild(style);

  const oldTitle=UI.title.bind(UI);
  UI.title=function(){
    oldTitle();
    const v=document.querySelector('.version');
    if(v)v.textContent=`NEON DESCENT / v${VERSION}`;
  };

  const oldUpdate=UI.update.bind(UI);
  let lastPassiveSig='';
  UI.update=function(){
    oldUpdate();
    const p=Game.p,hud=document.getElementById('hud-content');
    if(!p||!hud)return;
    const ids=Array.from(p.passives||[]).filter(id=>item[id]?.slot==='passive');
    const sig=ids.join('|');
    let strip=document.getElementById('passive-upgrades'),created=false;
    if(!strip){
      strip=document.createElement('span');strip.id='passive-upgrades';strip.className='passive-strip';strip.setAttribute('aria-label','Passive upgrades');
      const health=hud.querySelector('.health');health?.insertAdjacentElement('afterend',strip);if(!health)hud.prepend(strip);created=true;
    }
    if(created||sig!==lastPassiveSig){
      strip.replaceChildren();
      for(const id of ids){
        const it=item[id],chip=document.createElement('span');chip.className='passive-chip';chip.textContent=it.glyph;chip.style.color=it.color;chip.style.borderColor=it.color+'88';chip.title=it.name;chip.setAttribute('aria-label',it.name);strip.appendChild(chip);
      }
      strip.hidden=!ids.length;lastPassiveSig=sig;
    }
  };
})();
