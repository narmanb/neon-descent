'use strict';
(() => {
  if(typeof UI==='undefined'||typeof Render==='undefined')return;

  const style=document.createElement('style');
  style.textContent=`
    .nd-debug-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0}
    .nd-debug-grid button,.nd-debug-grid select{min-height:32px;border:1px solid #49694b;background:#102219;color:#c5dfbd;border-radius:2px;padding:6px 8px;font:700 8px ui-monospace,monospace;letter-spacing:.4px}
    .nd-debug-grid select{grid-column:1/-1;width:100%}.nd-debug-grid button.primary{background:#78966f;color:#07130f;border-color:#a7c69d}
    .nd-debug-note{font:7px ui-monospace,monospace;color:#719071;line-height:1.5;border-top:1px dashed #365039;padding-top:7px;margin-top:8px}
    @media(max-width:620px){.nd-debug-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const pauseComputer=UI.pause.bind(UI);
  function spawnItem(id){
    const p=Game.p;if(!p||!item[id])return;
    let x=p.x+p.face*42;if(ND.blocked(Game.l,x,p.y,p.w,p.h))x=p.x-p.face*42;
    Game.spawn({kind:'item',id,x,y:p.y-8,vy:-70,pickDelay:0});Game.message('DEBUG / spawned '+item[id].name,2.2);
  }
  function giveItem(id){if(!Game.p||!item[id])return;Game.equip({kind:'item',id,dead:false});Game.message('DEBUG / equipped '+item[id].name,2.2);}
  function status(t){const e=document.getElementById('nd-debug-status');if(e)e.textContent=t;}

  function injectDebugNav(){
    const tabs=document.querySelector('.nd-pc-tabs');
    if(tabs&&!document.getElementById('nd-debug-tab')){
      const b=document.createElement('button');b.className='nd-pc-tab';b.id='nd-debug-tab';b.textContent='DEBUG';b.onclick=showDebug;tabs.appendChild(b);
    }
    const sides=document.querySelectorAll('.nd-pc-side');const side=sides[sides.length-1];
    if(side&&!document.getElementById('nd-debug-side')){
      const b=document.createElement('button');b.className='nd-pc-sidebtn';b.id='nd-debug-side';b.textContent='DEBUG';b.onclick=showDebug;
      const label=side.querySelector('.nd-pc-label');side.insertBefore(b,label||side.lastChild);
    }
  }

  function showDebug(){
    pauseComputer();injectDebugNav();
    const head=document.querySelector('.nd-crt-head span'),inner=document.querySelector('.nd-crt-inner'),tabs=document.querySelector('.nd-pc-tabs');if(!inner||!tabs)return;
    if(head)head.textContent='NEON DESCENT // FIELD DIAGNOSTICS';
    tabs.querySelectorAll('.nd-pc-tab').forEach(b=>b.classList.toggle('active',b.id==='nd-debug-tab'));
    let n=tabs.nextSibling;while(n){const next=n.nextSibling;n.remove();n=next;}
    const options=ITEMS.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
    const body=document.createElement('div');body.innerHTML=`<div class="nd-pc-kicker">TEMPORARY QA BUS / RUN-LOCAL TOOLS</div><div class="nd-pc-title">DEBUG</div><div class="nd-debug-grid">
      <button class="primary" id="dbg-grip">GIVE GRIP GLOVES</button><button id="dbg-heal">FULL HEAL</button>
      <select id="dbg-item" aria-label="Debug item">${options}</select>
      <button id="dbg-spawn">SPAWN SELECTED</button><button id="dbg-give">GIVE / EQUIP SELECTED</button>
      <button id="dbg-bombs">+4 CHARGES</button><button id="dbg-cables">+4 CABLES</button>
      <button id="dbg-money">+1000 CREDITS</button><button id="dbg-resume">RESUME TEST</button>
    </div><div class="nd-debug-note" id="nd-debug-status">Run-only testing tools. They do not alter procedural generation or future runs.</div>`;
    while(body.firstChild)inner.appendChild(body.firstChild);
    const sel=document.getElementById('dbg-item');if(sel)sel.value='grip';
    document.getElementById('dbg-grip').onclick=()=>{giveItem('grip');status('Magnetic Grip Gloves equipped. Resume and hold UP against a wall.');};
    document.getElementById('dbg-heal').onclick=()=>{Game.p.hp=Game.p.maxHp;status('Health restored to '+Game.p.maxHp+'.');};
    document.getElementById('dbg-spawn').onclick=()=>{spawnItem(sel.value);status(item[sel.value].name+' spawned beside the player.');};
    document.getElementById('dbg-give').onclick=()=>{giveItem(sel.value);status(item[sel.value].name+' granted directly.');};
    document.getElementById('dbg-bombs').onclick=()=>{Game.p.bombs+=4;status('+4 plasma charges.');};
    document.getElementById('dbg-cables').onclick=()=>{Game.p.cables+=4;status('+4 mag-cables.');};
    document.getElementById('dbg-money').onclick=()=>{Game.p.money+=1000;status('+1000 credits.');};
    document.getElementById('dbg-resume').onclick=()=>Game.pause();
  }

  UI.pause=function(){pauseComputer();injectDebugNav();};
  const panel=document.getElementById('panel');if(panel)new MutationObserver(()=>injectDebugNav()).observe(panel,{childList:true,subtree:true});
  window.NeonDebugPage={show:showDebug,inject:injectDebugNav};

  // Damaged trap hardware gets a compact condition bar so shots clearly register.
  const baseTrap=Render.trap;
  Render.trap=function(t){
    baseTrap.call(this,t);if(t.dead)return;
    if((t.type==='turret'||t.type==='laser')&&t.maxHp&&t.hp<t.maxHp){
      const w=24,x=t.x-w/2,y=t.y-(t.h||24)-7;this.rect(x,y,w,2,'#3b4a4d');this.rect(x,y,w*Math.max(0,t.hp)/t.maxHp,2,'#ffad7b');
    }
    if(t.hit>0)this.glow(t.x,t.y-(t.h||20)*.5,24,'#a9ffff22');
  };
})();
