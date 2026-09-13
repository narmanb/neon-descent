'use strict';
const Input={
  keys:new Set(),touch:new Map(),pad:{},now:{},prev:{},pressedKeys:{},script:null,
  bindings:{ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyZ:'jump',KeyJ:'attack',KeyX:'attack',KeyK:'bomb',KeyC:'bomb',KeyL:'cable',KeyV:'cable',KeyE:'interact',ShiftLeft:'careful',ShiftRight:'careful'},
  init(){
    window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const action=this.bindings[e.code];if(action){e.preventDefault();if(!this.keys.has(action))this.pressedKeys[action]=true;this.keys.add(action);}if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)Game.pause();}if(e.code==='Enter'&&Game.mode==='title')Game.start();});
    window.addEventListener('keyup',e=>{const a=this.bindings[e.code];if(a){this.keys.delete(a);e.preventDefault();}});
    document.querySelectorAll('[data-input]').forEach(el=>{
      el.addEventListener('pointerdown',e=>{e.preventDefault();Game.initAudio();el.setPointerCapture(e.pointerId);this.touch.set(e.pointerId,el.dataset.input);this.pressedKeys[el.dataset.input]=true;el.classList.add('held');});
      const clear=e=>{this.touch.delete(e.pointerId);el.classList.remove('held');};el.addEventListener('pointerup',clear);el.addEventListener('pointercancel',clear);el.addEventListener('lostpointercapture',clear);
    });
    window.addEventListener('blur',()=>{this.reset();if(Game.mode==='play')Game.pause();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.reset();if(Game.mode==='play')Game.pause();}});
    window.addEventListener('contextmenu',e=>e.preventDefault());
  },
  reset(){this.keys.clear();this.touch.clear();this.now={};this.prev={};this.pressedKeys={};document.querySelectorAll('.held').forEach(x=>x.classList.remove('held'));},
  poll(){
    this.pad={};let pads=[];try{pads=navigator.getGamepads?navigator.getGamepads():[];}catch{}
    const g=Array.from(pads).find(Boolean);if(g){
      const b=i=>!!g.buttons[i]?.pressed;this.pad={left:g.axes[0]<-.22||b(14),right:g.axes[0]>.22||b(15),up:g.axes[1]<-.35||b(12),down:g.axes[1]>.35||b(13),jump:b(0),attack:b(2),bomb:b(1)||b(5),cable:b(3)||b(4),interact:b(7)||b(6),careful:b(10)};
      if(b(9)&&!this.pauseHeld)Game.pause();this.pauseHeld=b(9);UI.padConnected=true;
    }
    const next={};for(const a of Object.values(this.bindings))next[a]=this.keys.has(a)||Array.from(this.touch.values()).includes(a)||this.pad[a]||this.script?.buttons.includes(a)||false;
    for(const a in next)this.pressedKeys[a]=this.pressedKeys[a]||next[a]&&!this.prev[a];this.now=next;this.prev={...next};
  },
  down(a){return !!this.now[a];},pressed(a){return !!this.pressedKeys[a];},axis(){return (this.down('right')?1:0)-(this.down('left')?1:0);},consume(){this.pressedKeys={};}
};
const UI={
  panel:null,padConnected:false,opacity:.62,size:1,lastHUD:'',
  init(){
    this.panel=document.getElementById('panel');document.getElementById('pause').onclick=()=>Game.pause();document.getElementById('full').onclick=()=>this.fullscreen();document.getElementById('sound').onclick=()=>this.sound();
    try{const settings=JSON.parse(localStorage.getItem('neon-settings')||'{}');this.opacity=settings.opacity??.62;this.size=settings.size??1;Game.muted=settings.muted??false;}catch{}
    this.applyControls();this.title();
  },
  applyControls(){document.documentElement.style.setProperty('--control-opacity',this.opacity);document.documentElement.style.setProperty('--control-size',this.size);try{localStorage.setItem('neon-settings',JSON.stringify({opacity:this.opacity,size:this.size,muted:Game.muted}));}catch{}},
  sound(){Game.muted=!Game.muted;if(Game.master)Game.master.gain.value=Game.muted?0:.16;document.getElementById('sound').textContent=Game.muted?'♪ OFF':'♪';this.applyControls();},
  async fullscreen(){
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{Game.message('Fullscreen is unavailable in this viewer. Open the HTML in your browser.');}
    try{if(document.fullscreenElement&&screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{}
  },
  close(){this.panel.innerHTML='';this.panel.hidden=true;document.body.dataset.mode=Game.mode;},
  show(html){this.panel.hidden=false;this.panel.innerHTML=html;document.body.dataset.mode=Game.mode;},
  title(){
    this.show(`<div class="title-card"><div class="eyebrow"><span class="status-dot"></span> SECTOR 01 · ABANDONED RESEARCH MEGASTRUCTURE</div><h1>NEON<br><span>DESCENT</span></h1><p class="tagline">Go deeper. Take risks. Get out alive.</p><div class="start-row"><button class="primary" id="start">BEGIN DESCENT <span>↘</span></button><button class="secondary" id="how">CONTROLS</button></div><div class="title-meta">4 PROCEDURAL STAGES <b>·</b> DESTRUCTIBLE WORLD <b>·</b> ONE LIFE</div><div class="title-note">Headphones recommended · Landscape · Touch + controller</div></div><div class="version">NEON DESCENT / 0.1.0</div>`);
    document.getElementById('start').onclick=()=>{Game.initAudio();Game.start();};document.getElementById('how').onclick=()=>this.help(true);
  },
  help(title=false){
    this.show(`<div class="menu-card help"><div class="eyebrow">FIELD GUIDE</div><h2>Read the room. Then descend.</h2><div class="help-grid"><div><h3>MOVE & EXPLORE</h3><p><b>Arrows / WASD</b> move, crouch and climb.<br><b>Space / Z</b> jump. Hold for height.<br><b>Up / Down</b> on ladders or cables to climb.<br>Hold still + Up / Down to look around.<br><b>Shift</b> walks carefully.</p></div><div><h3>FIGHT & INTERACT</h3><p><b>J / X</b> attack, fire, or throw a carried object.<br><b>K / C</b> throw charge. Down + charge places it.<br><b>L / V</b> deploy cable. Down extends it below.<br><b>E</b> interact, buy, equip, carry or enter lift.<br><b>Down + E</b> put back. <b>Down + attack</b> drops weapon.</p></div><div><h3>CONTROLLER</h3><p>Left stick / D-pad moves and climbs.<br><b>A</b> jump · <b>X</b> attack · <b>B / RB</b> charge<br><b>Y / LB</b> cable · <b>RT / LT</b> interact<br><b>Start</b> pause. Button names use Xbox layout.</p></div><div><h3>SURVIVE</h3><p>Every fresh stage has a route using normal movement and permanent ladders. Long drops hurt. Charges hurt you too.<br>Inspect shop gear with USE; USE again buys. ATTACK or leaving with it steals.<br>After 3 minutes, the Null Warden pursues.</p></div></div><button class="primary" id="back">${title?'BACK':'RESUME'}</button></div>`);
    document.getElementById('back').onclick=()=>title?this.title():(Game.mode='play',this.close());
  },
  pause(){
    const p=Game.p;
    this.show(`<div class="menu-card"><div class="eyebrow">SIGNAL HELD · STAGE ${Game.stage} / 4</div><h2>Take a breath.</h2><div class="pause-row"><button class="primary" id="resume">RESUME ↘</button><button class="secondary" id="guide">CONTROLS</button><button class="secondary" id="restart">NEW RUN</button></div><div class="equipment-list"><h3>EQUIPPED</h3><p>${[p.hand&&item[p.hand].name,p.back&&item[p.back].name,...Array.from(p.passives).map(id=>item[id].name)].filter(Boolean).join(' · ')||'Shock baton · standard suit'}</p></div><div class="settings"><label>Touch opacity <input id="opacity" type="range" min=".25" max="1" step=".05" value="${this.opacity}"></label><label>Touch size <input id="size" type="range" min=".8" max="1.2" step=".05" value="${this.size}"></label></div><div class="seed-line">SEED <b>${Game.seed}</b> · ${Game.l.modifier} · ${UI.clock(Game.time)}</div><div class="seed-entry"><input id="seed" type="text" inputmode="numeric" placeholder="Enter a seed to replay" aria-label="Run seed"><button class="secondary" id="seed-run">PLAY SEED</button></div></div>`);
    document.getElementById('resume').onclick=()=>Game.pause();document.getElementById('guide').onclick=()=>this.help();document.getElementById('restart').onclick=()=>this.confirmRestart();
    for(const key of ['opacity','size'])document.getElementById(key).oninput=e=>{this[key]=Number(e.target.value);this.applyControls();};
    document.getElementById('seed-run').onclick=()=>{let s=document.getElementById('seed').value.trim();if(/^\d+$/.test(s))Game.start(Number(s));};
  },
  confirmRestart(){this.show(`<div class="menu-card compact"><div class="eyebrow">NEW SIGNAL</div><h2>End this run?</h2><p>Your current equipment and progress will be lost.</p><div class="pause-row"><button class="primary" id="new">NEW RUN</button><button class="secondary" id="cancel">KEEP PLAYING</button></div></div>`);document.getElementById('new').onclick=()=>Game.start();document.getElementById('cancel').onclick=()=>{Game.mode='play';this.close();};},
  end(win){
    this.show(`<div class="menu-card compact"><div class="eyebrow">${win?'EXTRACTION CONFIRMED':'SIGNAL LOST'}</div><h2>${win?'You made it out.':'The complex keeps its secrets.'}</h2><div class="stats"><div><strong>${Game.stage}/4</strong><span>STAGES</span></div><div><strong>¤${Game.p.money}</strong><span>RECOVERED</span></div><div><strong>${Game.kills}</strong><span>DISABLED</span></div><div><strong>${this.clock(Game.runTime)}</strong><span>RUN TIME</span></div></div><button class="primary" id="retry">${win?'DESCEND AGAIN':'NEW RUN'} ↘</button><button class="secondary" id="same">REPLAY SEED</button><div class="seed-line">SEED ${Game.seed}</div></div>`);
    document.getElementById('retry').onclick=()=>Game.start();document.getElementById('same').onclick=()=>Game.start(Game.seed);
  },
  clock(s){return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;},
  update(){
    const p=Game.p;if(!p)return;document.body.dataset.mode=Game.mode;
    const content=`<div class="health" aria-label="${p.hp} health">${Array.from({length:Math.max(5,p.hp)},(_,i)=>`<i class="${i<p.hp?'full':''}"></i>`).join('')}</div><span class="resource money">¤ ${p.money}</span><span class="resource charge">✳ ${p.bombs}</span><span class="resource cable">⌁ ${p.cables}</span><span class="stage-number">01—${String(Game.stage).padStart(2,'0')}</span>${Game.wanted?'<span class="wanted">WANTED</span>':''}`;
    if(this.lastHUD!==content){document.getElementById('hud-content').innerHTML=content;this.lastHUD=content;}
    document.getElementById('weapon').textContent=(p.held?(p.held.kind==='item'?'INSPECTING '+item[p.held.id].name:'CARRYING '+(p.held.type||p.held.kind).toUpperCase()):p.hand?item[p.hand].name+(Number.isFinite(p.ammo)?' · '+p.ammo:''):'SHOCK BATON')+(p.back?'  /  '+item[p.back].name:'');
    const fuel=document.getElementById('fuel');fuel.hidden=!['jet','hover'].includes(p.back);fuel.style.setProperty('--fuel',`${p.fuel*100}%`);
    document.getElementById('keycards').textContent=p.keys.length?'▰ '+p.keys.join(' · '):'';
    const context=Game.context(),hint=document.getElementById('context');hint.hidden=!context||Game.mode!=='play';hint.textContent=context?context.label+'  /  '+context.desc:'';
    document.getElementById('use-label').textContent=context?context.label:'USE';
    document.getElementById('messages').innerHTML=Game.messages.slice(-2).map(m=>`<div style="opacity:${Math.min(1,m.life*2)}">${m.t}</div>`).join('');
    document.getElementById('timer').textContent=this.clock(Game.time)+(Game.warned?' / NULL SIGNAL':'');
  }
};
window.Input=Input;window.UI=UI;
function registerAgentControls(){
  const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const status=()=>({mode:Game.mode,seed:Game.seed,stage:Game.stage,health:Game.p.hp,money:Game.p.money,charges:Game.p.bombs,cables:Game.p.cables,weapon:Game.p.hand||'baton',context:Game.context()?.label||null,position:{x:Math.round(Game.p.x),y:Math.round(Game.p.y)}});
  const tools=[
    {name:'inspect_run',title:'Inspect current run',description:'Read the current player status, seed, position and available contextual interaction.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>status()},
    {name:'play_controls',title:'Play game controls',description:'Hold normal gameplay buttons for 1–180 simulation frames. Uses the same movement, combat and resource costs as touch controls. Requires a running game.',inputSchema:{type:'object',properties:{buttons:{type:'array',items:{type:'string',enum:['left','right','up','down','jump','attack','bomb','cable','interact','careful']},maxItems:5},frames:{type:'integer',minimum:1,maximum:180}},required:['buttons','frames'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{
      const allowed=['left','right','up','down','jump','attack','bomb','cable','interact','careful'];if(!input||!Array.isArray(input.buttons)||input.buttons.length>5||input.buttons.some(a=>!allowed.includes(a))||!Number.isInteger(input.frames)||input.frames<1||input.frames>180)throw Error('Invalid buttons or frame count.');if(Game.mode!=='play')throw Error('Start or resume the game first.');if(Input.script)throw Error('A control action is already running.');
      return new Promise(resolve=>{for(const a of input.buttons)Input.pressedKeys[a]=true;Input.script={buttons:input.buttons,frames:input.frames,done:()=>resolve(status())};});
    }}
  ];for(const tool of tools)try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
}
function boot(){
  UI.panel=document.getElementById('panel');Game.start(8276401);Game.mode='title';Game.messages=[];Render.init();Input.init();UI.init();
  let last=performance.now(),acc=0;
  function loop(now){
    const dt=Math.min(.075,(now-last)/1000);last=now;Input.poll();acc+=dt;let steps=0;
    while(acc>=1/60&&steps<5){Game.step(1/60);Input.consume();if(Input.script){Input.script.frames--;if(Input.script.frames<=0||Game.mode!=='play'){const done=Input.script.done;Input.script=null;UI.update();done();}}acc-=1/60;steps++;}
    Render.frame(dt);UI.update();requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  registerAgentControls();
  if(location.protocol.startsWith('http')&&location.hostname!=='terminal.local'&&'serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
boot();
