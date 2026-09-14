'use strict';
(() => {
  const style=document.createElement('style');
  style.textContent=`
    .debug-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin:15px 0}
    .debug-grid button,.debug-grid select{min-height:38px;background:#071e2b;color:#d7ecec;border:1px solid #365c6e;border-radius:4px;padding:7px 9px}
    .debug-grid select{grid-column:1/-1;width:100%}
    .debug-note{font:10px ui-monospace,monospace;color:#8faab5;line-height:1.45;margin-top:10px}
    @media(max-width:620px){.debug-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function addDebugButton(){
    const row=document.querySelector('.menu-card .pause-row');
    if(!row||document.getElementById('debug-menu'))return;
    const b=document.createElement('button');b.className='secondary';b.id='debug-menu';b.textContent='DEBUG';b.onclick=showDebug;row.appendChild(b);
  }

  const basePause=UI.pause.bind(UI);
  UI.pause=function(){basePause();addDebugButton();};

  function spawnItem(id){
    const p=Game.p;if(!p||!item[id])return;
    let x=p.x+p.face*42;
    if(ND.blocked(Game.l,x,p.y,p.w,p.h))x=p.x-p.face*42;
    Game.spawn({kind:'item',id,x,y:p.y-8,vy:-70,pickDelay:0});
    Game.message('DEBUG / spawned '+item[id].name,2.2);
  }
  function giveItem(id){
    if(!Game.p||!item[id])return;
    Game.equip({kind:'item',id,dead:false});
    Game.message('DEBUG / equipped '+item[id].name,2.2);
  }
  function status(t){const e=document.getElementById('debug-status');if(e)e.textContent=t;}

  function showDebug(){
    const options=ITEMS.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
    UI.show(`<div class="menu-card"><div class="eyebrow">DEBUG / CHEATS</div><h2>Field-test tools</h2><div class="debug-grid">
      <button class="primary" id="dbg-grip">GIVE GRIP GLOVES</button><button class="secondary" id="dbg-heal">FULL HEAL</button>
      <select id="dbg-item" aria-label="Debug item">${options}</select>
      <button class="secondary" id="dbg-spawn">SPAWN SELECTED</button><button class="secondary" id="dbg-give">GIVE / EQUIP SELECTED</button>
      <button class="secondary" id="dbg-bombs">+4 CHARGES</button><button class="secondary" id="dbg-cables">+4 CABLES</button>
      <button class="secondary" id="dbg-money">+1000 CREDITS</button><button class="secondary" id="dbg-back">BACK</button>
    </div><div class="debug-note" id="debug-status">Run-only testing tools. They do not change procedural generation or future runs.</div></div>`);
    const sel=document.getElementById('dbg-item');sel.value='grip';
    document.getElementById('dbg-grip').onclick=()=>{giveItem('grip');status('Magnetic Grip Gloves equipped. Resume and hold UP against a wall.');};
    document.getElementById('dbg-heal').onclick=()=>{Game.p.hp=Game.p.maxHp;status('Health restored to '+Game.p.maxHp+'.');};
    document.getElementById('dbg-spawn').onclick=()=>{spawnItem(sel.value);status(item[sel.value].name+' spawned beside the player.');};
    document.getElementById('dbg-give').onclick=()=>{giveItem(sel.value);status(item[sel.value].name+' granted directly.');};
    document.getElementById('dbg-bombs').onclick=()=>{Game.p.bombs+=4;status('+4 plasma charges.');};
    document.getElementById('dbg-cables').onclick=()=>{Game.p.cables+=4;status('+4 mag-cables.');};
    document.getElementById('dbg-money').onclick=()=>{Game.p.money+=1000;status('+1000 credits.');};
    document.getElementById('dbg-back').onclick=()=>UI.pause();
  }

  addDebugButton();
})();
