'use strict';
(() => {
  if(typeof Render==='undefined'||typeof UI==='undefined')return;

  // --- Magnetic Grip visual state -----------------------------------------
  // v0.14 added contact effects on top of the normal humanoid. v0.16 replaces
  // that pose entirely while gripping so an idle wall cling reads as an active
  // brace instead of a frozen standing frame. Wall is always +X in local space.
  const previousHumanoid=Render.humanoid;

  function idleGripContact(r,x,y,scale=1){
    const c=r.ctx,pulse=.26+.12*Math.sin(r.t*12);c.save();c.globalAlpha=pulse;
    r.glow(x,y,9*scale,'#70f3d72a');
    r.line(x,y,x+4*scale,y-3*scale,'#b9fff0',1);
    r.line(x,y,x+5*scale,y+2*scale,'#6ee8d5',1);
    c.restore();
  }

  function movingGripTrail(r,x,y,vy,scale=1){
    const c=r.ctx,tail=vy<0?1:-1;c.save();c.globalAlpha=.58;
    let px=x,py=y+tail*2;
    for(let i=1;i<=4;i++){
      const nx=x+(i%2?4:-3)*scale,ny=y+tail*(3+i*5)*scale;
      r.line(px,py,nx,ny,i===4?'#61dfc7':'#a7fff0',i===4?1:1.5);px=nx;py=ny;
    }
    c.restore();
  }

  function drawGripClinger(e){
    const r=Render,c=r.ctx,side=Math.sign(e.gripCling)||e.face||1,t=e.anim||r.t,moving=Math.abs(e.vy)>8;
    const step=moving?Math.sin(t*12)*4:0,armor='#d9d4bb',dark='#436170',glow='#72eafb';
    const boot=(e.passives?.has('jump')||e.passives?.has('traction'))?'#62d7b9':'#bd9374';
    c.save();c.translate(e.x,e.y);c.scale(side,1);
    if(e.inv>0&&Math.floor(r.t*18)%2)c.globalAlpha=.5;if(e.hit>0)c.filter='brightness(1.8)';

    // Two legs only. The wall-side boot is planted against the wall while the
    // rear knee stays bent. While moving they alternate vertically.
    r.line(-3,-13,-7,-5-step,dark,5);
    r.line(4,-13,10,-8+step,dark,5);
    r.rect(-12,-7-step,9,4,boot);
    r.rect(9,-11+step,7,5,boot);

    if(e.back){
      r.polygon([[-12,-28],[-5,-29],[-3,-14],[-10,-13]],'#516b7b');
      r.rect(-10,-25,5,9,'#233c4b');r.circle(-7,-21,2.5,item[e.back]?.color||glow);
    }

    // Side-on torso and helmet lean into the wall, visibly different from both
    // the ladder back pose and the Mag-Cable overhead clasp.
    r.polygon([[-8,-27],[6,-27],[10,-21],[7,-12],[-5,-12],[-10,-18]],armor);
    r.rect(-4,-23,9,8,dark);r.line(-2,-18,5,-18,glow,2);
    r.polygon([[-7,-36],[7,-36],[12,-32],[11,-26],[5,-23],[-6,-25],[-10,-30]],armor);
    r.polygon([[4,-33],[11,-31],[10,-27],[4,-28]],'#173b45');r.line(7,-31,11,-30,glow,1.5);
    r.rect(-5,-37,6,2,'#f1ede0');

    const highY=-31-step,lowY=-20+step;
    r.line(5,-24,14,highY,dark,5);
    r.line(-5,-23,14,lowY,dark,5);
    r.circle(14,highY,3,'#b9fff0');r.circle(14,lowY,3,'#b9fff0');
    r.glow(14,highY,8,moving?'#73e0b638':'#73e0b61c');
    r.glow(14,lowY,8,moving?'#73e0b638':'#73e0b61c');

    if(moving){
      movingGripTrail(r,15,highY,e.vy,1);movingGripTrail(r,15,lowY,e.vy,.72);
    }else{
      // Idle contact deliberately stays softer than the climbing trail.
      idleGripContact(r,15,highY,1);idleGripContact(r,15,lowY,.8);idleGripContact(r,15,-8,.65);
    }
    c.restore();
  }

  Render.humanoid=function(e,player=true){
    if(player&&e.gripCling&&!e.ledge){drawGripClinger(e);return;}
    previousHumanoid.call(this,e,player);
  };

  // --- Retro-futuristic pause computer ------------------------------------
  const style=document.createElement('style');
  style.textContent=`
    .nd-pc{width:min(900px,96vw);height:min(410px,91vh);display:grid;grid-template-columns:62px minmax(0,1fr) 72px;gap:11px;padding:14px;background:linear-gradient(145deg,#746f5d,#44483e 42%,#292f2f 80%,#636153);border:2px solid #a29b78;border-radius:17px 9px 15px 11px;box-shadow:inset 0 0 0 3px #262b27,inset 0 0 24px #d1c58b20,0 18px 70px #000b;position:relative;color:#d6efcf;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .nd-pc:before,.nd-pc:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;background:#1e211d;border:1px solid #aaa17b;box-shadow:inset 1px 1px 2px #000;top:7px}.nd-pc:before{left:8px}.nd-pc:after{right:8px}
    .nd-pc-side{border:1px solid #272e29;background:linear-gradient(#595a4d,#353b34);box-shadow:inset 0 0 10px #0007;display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px 7px;border-radius:7px;min-height:0}
    .nd-pc-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:7px;letter-spacing:2px;color:#c2b98d;opacity:.8;margin-bottom:auto}
    .nd-pc-led{width:9px;height:9px;border-radius:50%;background:#79d78b;box-shadow:0 0 7px #7ef392,0 0 1px 1px #17231b}.nd-pc-led.amber{background:#e5b45c;box-shadow:0 0 7px #e9b352}
    .nd-pc-switch{width:25px;height:42px;border-radius:4px;background:#202722;border:1px solid #8b876e;box-shadow:inset 0 0 5px #000;position:relative}.nd-pc-switch:after{content:'';position:absolute;left:4px;top:5px;width:15px;height:18px;border-radius:2px;background:linear-gradient(#aaa58c,#666756);border:1px solid #d1c9a3;box-shadow:0 3px 5px #0007}
    .nd-pc-sidebtn{width:48px;min-height:37px;padding:4px 2px;border-radius:4px;border:1px solid #171d19;background:linear-gradient(#696953,#393d35);box-shadow:inset 0 1px #b4ad82,0 3px 0 #1b1e1b;color:#e8e0b3;font:700 7px ui-monospace,monospace;letter-spacing:.5px}.nd-pc-sidebtn:active{transform:translateY(2px);box-shadow:inset 0 1px #b4ad82,0 1px 0 #1b1e1b}.nd-pc-sidebtn.danger{color:#ffb397;border-color:#612f29}
    .nd-crt{position:relative;min-width:0;min-height:0;border:7px solid #1a201c;border-radius:12px;background:#07130f;box-shadow:inset 0 0 28px #000,0 0 0 2px #87836a;overflow:hidden}
    .nd-crt:after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,#0000 0,#0000 2px,#0b140e33 3px,#0b140e33 4px),radial-gradient(ellipse at center,#0000 55%,#0008 100%);mix-blend-mode:multiply;z-index:5}
    .nd-crt-inner{position:absolute;inset:0;overflow:auto;padding:14px 16px 18px;scrollbar-width:thin;scrollbar-color:#7da879 #0b1b13}
    .nd-crt-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #61826166;padding-bottom:7px;margin-bottom:9px;color:#9bce95;font-size:8px;letter-spacing:1.2px;text-transform:uppercase}.nd-crt-head b{color:#d9f6c8;font-weight:700}
    .nd-pc-tabs{display:flex;gap:5px;margin-bottom:11px}.nd-pc-tab{border:1px solid #49694b;background:#0d1e15;color:#8cb88b;padding:7px 11px;font:700 8px ui-monospace,monospace;letter-spacing:.8px;border-radius:2px}.nd-pc-tab.active{background:#769270;color:#07130f;border-color:#a5c79c;box-shadow:0 0 8px #81c37c33}
    .nd-pc-title{font-size:18px;letter-spacing:1px;color:#d8efc7;margin:2px 0 12px;text-shadow:0 0 6px #8eb8874a}.nd-pc-kicker{font-size:8px;color:#729176;letter-spacing:1.4px;margin-bottom:4px}
    .nd-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.nd-stat{border:1px solid #355039;background:#0b1b13b8;padding:8px;min-width:0}.nd-stat small{display:block;color:#6f9270;font-size:7px;letter-spacing:.8px;margin-bottom:4px}.nd-stat strong{display:block;color:#d4ebc4;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nd-pc-line{border-top:1px dashed #365039;margin:10px 0}.nd-pc-copy{font-size:9px;line-height:1.55;color:#9fc19a;margin:5px 0}
    .nd-loadout{display:grid;grid-template-columns:1fr 1fr;gap:8px}.nd-item-card{border:1px solid #3c5b40;background:#0a1a12cc;padding:9px;min-height:64px}.nd-item-card h4{font-size:9px;margin:0 0 5px;color:#d4ebc4;letter-spacing:.5px}.nd-item-card p{font-size:8px;line-height:1.45;color:#8eae8b;margin:0}.nd-item-card .nd-glyph{float:right;font-size:14px;color:#a8dca2;margin-left:8px}.nd-section-label{font-size:7px;color:#68896b;letter-spacing:1.2px;margin:12px 0 6px}
    .nd-setting{display:grid;grid-template-columns:150px 1fr 56px;align-items:center;gap:9px;margin:8px 0;padding:7px 8px;border:1px solid #2f4933;background:#0a1a12b8}.nd-setting label{font-size:8px;color:#a8c7a1}.nd-setting output{font-size:8px;color:#d4efca;text-align:right}.nd-setting input[type=range]{width:100%;accent-color:#90b785}.nd-setting select{width:100%;min-height:28px;background:#0a1911;color:#cbe0bf;border:1px solid #49654b;font:8px ui-monospace,monospace;padding:4px}.nd-setting input[type=checkbox]{width:18px;height:18px;accent-color:#8eae80}.nd-setting-note{font-size:7px;color:#6f906f;line-height:1.5;margin-top:2px}
    .nd-pc-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.nd-crt-btn{border:1px solid #5c7b5e;background:#15271b;color:#bdd8b6;padding:8px 12px;font:700 8px ui-monospace,monospace;letter-spacing:.6px;border-radius:2px}.nd-crt-btn.primary{background:#78966f;color:#07130f;border-color:#a7c69d}.nd-crt-btn.danger{color:#ffb49d;border-color:#70463b;background:#211612}
    @media(max-height:450px){.nd-pc{height:94vh;padding:9px;grid-template-columns:50px minmax(0,1fr) 58px;gap:7px}.nd-pc-side{padding:7px 4px;gap:7px}.nd-pc-sidebtn{width:39px;min-height:30px;font-size:6px}.nd-crt-inner{padding:10px 12px}.nd-status-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.nd-item-card{min-height:55px;padding:7px}.nd-setting{margin:5px 0;padding:5px 7px}}
    @media(max-width:720px){.nd-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nd-loadout{grid-template-columns:1fr}.nd-setting{grid-template-columns:118px 1fr 46px}}
  `;
  document.head.appendChild(style);

  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const itemCard=(id,label,fallbackName,fallbackDesc,extra='')=>{
    const it=id?item[id]:null,name=it?.name||fallbackName,desc=it?.desc||fallbackDesc,glyph=it?.glyph||'·';
    return `<div class="nd-item-card"><span class="nd-glyph" style="color:${it?.color||'#a8dca2'}">${esc(glyph)}</span><h4>${esc(label)} / ${esc(name)}</h4><p>${esc(desc)}${extra?`<br>${esc(extra)}`:''}</p></div>`;
  };

  function statusPage(){
    const p=Game.p,weapon=p.hand?item[p.hand].name:'Shock Baton',back=p.back?item[p.back].name:'Standard Suit';
    return `<div class="nd-pc-kicker">ACTIVE RUN TELEMETRY</div><div class="nd-pc-title">SECTOR STATUS</div><div class="nd-status-grid">
      <div class="nd-stat"><small>STAGE</small><strong>${Game.stage} / 4</strong></div><div class="nd-stat"><small>HEALTH</small><strong>${p.hp} / ${p.maxHp}</strong></div>
      <div class="nd-stat"><small>CREDITS</small><strong>¤ ${p.money}</strong></div><div class="nd-stat"><small>RUN TIME</small><strong>${UI.clock(Game.runTime)}</strong></div>
      <div class="nd-stat"><small>WEAPON</small><strong>${esc(weapon)}${Number.isFinite(p.ammo)?' · '+p.ammo:''}</strong></div><div class="nd-stat"><small>BACK UNIT</small><strong>${esc(back)}</strong></div>
      <div class="nd-stat"><small>CHARGES</small><strong>✳ ${p.bombs}</strong></div><div class="nd-stat"><small>MAG-CABLES</small><strong>⌁ ${p.cables}</strong></div>
    </div><div class="nd-pc-line"></div><div class="nd-pc-copy">SEED <b>${Game.seed}</b> · ${esc(Game.l?.modifier||'Nominal Systems')} · KEYCARDS ${p.keys.length?esc(p.keys.join(' / ')):'NONE'}${Game.wanted?' · <b>Q-9 WANTED FLAG ACTIVE</b>':''}</div>
    <div class="nd-pc-actions"><button class="nd-crt-btn primary" id="nd-resume">RESUME DESCENT</button><button class="nd-crt-btn" id="nd-guide">FIELD GUIDE</button><button class="nd-crt-btn danger" id="nd-restart">NEW RUN</button></div>`;
  }

  function inventoryPage(){
    const p=Game.p,passives=Array.from(p.passives||[]).filter(id=>item[id]);
    const passiveHtml=passives.length?passives.map(id=>itemCard(id,'PASSIVE',item[id].name,item[id].desc)).join(''):'<div class="nd-item-card"><h4>PASSIVE AUGMENTS / NONE</h4><p>No passive upgrade modules installed.</p></div>';
    return `<div class="nd-pc-kicker">SUIT BUS / EQUIPMENT MANIFEST</div><div class="nd-pc-title">INVENTORY</div><div class="nd-section-label">ACTIVE EQUIPMENT</div><div class="nd-loadout">
      ${itemCard(p.hand,'HAND', 'Shock Baton','Standard close-range shock weapon.',Number.isFinite(p.ammo)?`${p.ammo} remaining`:'' )}
      ${itemCard(p.back,'BACK','Standard Suit','No powered back module installed.')}
    </div><div class="nd-section-label">PASSIVE AUGMENTS</div><div class="nd-loadout">${passiveHtml}</div>
    <div class="nd-section-label">FIELD SUPPLIES</div><div class="nd-loadout"><div class="nd-item-card"><h4>PLASMA CHARGES / ${p.bombs}</h4><p>Thrown demolition charges. Down + charge places one.</p></div><div class="nd-item-card"><h4>MAG-CABLES / ${p.cables}</h4><p>Deployable powered climbing lines for vertical traversal.</p></div>${p.keys.length?`<div class="nd-item-card"><h4>KEYCARDS / ${esc(p.keys.join(' · '))}</h4><p>Security credentials collected during this run.</p></div>`:''}</div>`;
  }

  function settingsPage(){
    const api=window.NeonPolishSettings,s=api?.get?.()||{controlMode:'dpad',touchVisible:true,zoom:Render.zoom||1.18};
    return `<div class="nd-pc-kicker">LOCAL SUIT / DISPLAY CONFIGURATION</div><div class="nd-pc-title">SETTINGS</div>
      <div class="nd-setting"><label for="nd-zoom">CAMERA ZOOM</label><input id="nd-zoom" type="range" min=".80" max="1.50" step=".01" value="${Number(s.zoom||1.18).toFixed(2)}"><output id="nd-zoom-out">${Math.round((s.zoom||1.18)*100)}%</output></div><div class="nd-setting-note">80% = wider / farther out · 150% = closer in. Changes apply immediately.</div>
      <div class="nd-setting"><label for="nd-control">MOVEMENT INPUT</label><select id="nd-control"><option value="dpad">D-PAD</option><option value="fixed">FIXED ANALOG</option><option value="floating">FLOATING ANALOG</option></select><output></output></div>
      <div class="nd-setting"><label for="nd-touch">TOUCH CONTROLS</label><input id="nd-touch" type="checkbox" ${s.touchVisible!==false?'checked':''}><output>${s.touchVisible!==false?'ON':'OFF'}</output></div>
      <div class="nd-setting"><label for="nd-opacity">TOUCH OPACITY</label><input id="nd-opacity" type="range" min=".25" max="1" step=".05" value="${UI.opacity}"><output id="nd-opacity-out">${Math.round(UI.opacity*100)}%</output></div>
      <div class="nd-setting"><label for="nd-size">TOUCH SIZE</label><input id="nd-size" type="range" min=".8" max="1.2" step=".05" value="${UI.size}"><output id="nd-size-out">${Math.round(UI.size*100)}%</output></div>
      <div class="nd-pc-actions"><button class="nd-crt-btn" id="nd-defaults">RESTORE DEFAULTS</button></div>`;
  }

  function confirmPage(){
    return `<div class="nd-pc-kicker">RUN CONTROL / DESTRUCTIVE ACTION</div><div class="nd-pc-title">END CURRENT RUN?</div><div class="nd-pc-copy">Current equipment, passive augments, credits, and stage progress will be discarded.</div><div class="nd-pc-actions"><button class="nd-crt-btn danger" id="nd-confirm-new">CONFIRM NEW RUN</button><button class="nd-crt-btn primary" id="nd-cancel-new">CANCEL</button></div>`;
  }

  function shell(page){
    const title=page==='inventory'?'EQUIPMENT BUS':page==='settings'?'LOCAL CONFIG':page==='confirm'?'RUN CONTROL':'SECTOR LINK';
    const tabs=page==='confirm'?'':`<div class="nd-pc-tabs"><button class="nd-pc-tab ${page==='status'?'active':''}" data-nd-page="status">STATUS</button><button class="nd-pc-tab ${page==='inventory'?'active':''}" data-nd-page="inventory">INVENTORY</button><button class="nd-pc-tab ${page==='settings'?'active':''}" data-nd-page="settings">SETTINGS</button></div>`;
    const body=page==='inventory'?inventoryPage():page==='settings'?settingsPage():page==='confirm'?confirmPage():statusPage();
    return `<div class="nd-pc"><aside class="nd-pc-side"><div class="nd-pc-led"></div><div class="nd-pc-switch"></div><div class="nd-pc-label">ND-88 FIELD TERMINAL</div><div class="nd-pc-led amber"></div></aside><section class="nd-crt"><div class="nd-crt-inner"><div class="nd-crt-head"><span>NEON DESCENT // ${title}</span><b>LINK HOLD</b></div>${tabs}${body}</div></section><aside class="nd-pc-side"><button class="nd-pc-sidebtn" id="nd-side-resume">RESUME</button><button class="nd-pc-sidebtn" data-nd-page="inventory">ITEMS</button><button class="nd-pc-sidebtn" data-nd-page="settings">CONFIG</button><div class="nd-pc-label">SYS / AUX</div><button class="nd-pc-sidebtn danger" id="nd-side-new">RESET</button></aside></div>`;
  }

  function wireSettings(){
    const api=window.NeonPolishSettings,control=document.getElementById('nd-control'),zoom=document.getElementById('nd-zoom'),touch=document.getElementById('nd-touch');
    const opacity=document.getElementById('nd-opacity'),size=document.getElementById('nd-size');
    const current=api?.get?.()||{};if(control)control.value=current.controlMode||'dpad';
    if(zoom)zoom.oninput=()=>{const s=api?.update?.({zoom:Number(zoom.value)});const value=s?.zoom??Number(zoom.value);document.getElementById('nd-zoom-out').textContent=Math.round(value*100)+'%';};
    if(control)control.onchange=()=>api?.update?.({controlMode:control.value});
    if(touch)touch.onchange=()=>{const s=api?.update?.({touchVisible:touch.checked});touch.parentElement.querySelector('output').textContent=s?.touchVisible!==false?'ON':'OFF';};
    if(opacity)opacity.oninput=()=>{UI.opacity=Number(opacity.value);UI.applyControls();document.getElementById('nd-opacity-out').textContent=Math.round(UI.opacity*100)+'%';};
    if(size)size.oninput=()=>{UI.size=Number(size.value);UI.applyControls();document.getElementById('nd-size-out').textContent=Math.round(UI.size*100)+'%';};
    const defaults=document.getElementById('nd-defaults');if(defaults)defaults.onclick=()=>{api?.reset?.();UI.opacity=.62;UI.size=1;UI.applyControls();showPause('settings');};
  }

  function showPause(page='status'){
    UI.show(shell(page));
    document.querySelectorAll('[data-nd-page]').forEach(b=>b.onclick=()=>showPause(b.dataset.ndPage));
    const sideResume=document.getElementById('nd-side-resume');if(sideResume)sideResume.onclick=()=>Game.pause();
    const sideNew=document.getElementById('nd-side-new');if(sideNew)sideNew.onclick=()=>showPause('confirm');
    const resume=document.getElementById('nd-resume');if(resume)resume.onclick=()=>Game.pause();
    const guide=document.getElementById('nd-guide');if(guide)guide.onclick=()=>UI.help();
    const restart=document.getElementById('nd-restart');if(restart)restart.onclick=()=>showPause('confirm');
    const confirm=document.getElementById('nd-confirm-new');if(confirm)confirm.onclick=()=>Game.start();
    const cancel=document.getElementById('nd-cancel-new');if(cancel)cancel.onclick=()=>showPause('status');
    if(page==='settings')wireSettings();
  }

  UI.pause=function(){showPause('status');};
  UI.confirmRestart=function(){showPause('confirm');};
})();
