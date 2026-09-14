'use strict';
(() => {
  const defaults={controlMode:'dpad',touchVisible:true,zoom:1.12};
  let settings={...defaults};
  try{settings={...settings,...JSON.parse(localStorage.getItem('neon-polish-settings')||'{}')};}catch{}
  settings.zoom=Math.max(.95,Math.min(1.28,Number(settings.zoom)||defaults.zoom));
  if(!['dpad','fixed','floating'].includes(settings.controlMode))settings.controlMode='dpad';
  settings.touchVisible=settings.touchVisible!==false;

  const save=()=>{try{localStorage.setItem('neon-polish-settings',JSON.stringify(settings));}catch{}};

  // Slightly closer default camera, with an options slider for personal preference.
  Render.zoom=settings.zoom;
  Render.resize=function(){
    const d=Math.min(window.devicePixelRatio||1,2),viewH=440/(this.zoom||1);
    this.canvas.width=Math.round(innerWidth*d);this.canvas.height=Math.round(innerHeight*d);
    this.w=innerWidth/innerHeight*viewH;this.h=viewH;this.scale=this.canvas.height/viewH;
  };
  Render.resize();

  const style=document.createElement('style');
  style.textContent=`
    #analog-layer{position:fixed;inset:0;pointer-events:none;z-index:2}
    #analog-catch{position:fixed;left:0;top:58px;width:48vw;bottom:0;pointer-events:none;touch-action:none}
    #analog-base{position:fixed;width:116px;height:116px;border-radius:50%;border:1px solid #9bcad36b;background:#173c525c;box-shadow:inset 0 0 0 14px #0c263557,0 5px 18px #04111e55;backdrop-filter:blur(2px);pointer-events:none;display:none}
    #analog-knob{position:absolute;left:33px;top:33px;width:50px;height:50px;border-radius:50%;background:#75cbbcaa;border:1px solid #caffedaa;box-shadow:0 3px 12px #04111e88;transform:translate(0,0)}
    body.touch-off #touch,body.touch-off #analog-layer{display:none!important}
    body.control-fixed #touch .pad,body.control-floating #touch .pad{display:none!important}
    body.control-fixed #analog-base{display:block;left:max(27px,env(safe-area-inset-left));top:auto;bottom:25px;pointer-events:auto}
    body.control-floating #analog-catch{pointer-events:auto}
    body.control-floating #analog-base.active{display:block}
    .options-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin:18px 0 24px}
    .options-grid label{display:flex;flex-direction:column;gap:8px;color:#a9c4d0;font-size:11px}
    .options-grid select,.options-grid input[type=range]{width:100%;min-height:36px;background:#071e2b;color:#d3e9e9;border:1px solid #365c6e;border-radius:4px;padding:6px;accent-color:var(--cyan)}
    .options-grid .check{flex-direction:row;align-items:center;min-height:36px}.options-grid .check input{width:18px;height:18px;accent-color:var(--cyan)}
    @media(max-width:620px){.options-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const layer=document.createElement('div');layer.id='analog-layer';
  layer.innerHTML='<div id="analog-catch"></div><div id="analog-base"><div id="analog-knob"></div></div>';
  document.body.appendChild(layer);
  const catchZone=document.getElementById('analog-catch'),base=document.getElementById('analog-base'),knob=document.getElementById('analog-knob');
  Input.analog={x:0,y:0};
  const baseDown=Input.down,baseAxis=Input.axis,baseReset=Input.reset;
  Input.down=function(a){
    if(a==='left'&&this.analog.x<-.24)return true;if(a==='right'&&this.analog.x>.24)return true;
    if(a==='up'&&this.analog.y<-.30)return true;if(a==='down'&&this.analog.y>.30)return true;
    return baseDown.call(this,a);
  };
  Input.axis=function(){return Math.abs(this.analog.x)>.15?this.analog.x:baseAxis.call(this);};
  Input.reset=function(){this.analog.x=this.analog.y=0;knob.style.transform='translate(0px,0px)';base.classList.remove('active');return baseReset.call(this);};

  let pointer=null,origin={x:0,y:0};const radius=39;
  const placeBase=(x,y)=>{base.style.left=(x-58)+'px';base.style.top=(y-58)+'px';base.style.bottom='auto';};
  const updateAnalog=(x,y)=>{
    let dx=x-origin.x,dy=y-origin.y,d=Math.hypot(dx,dy);if(d>radius){dx*=radius/d;dy*=radius/d;}
    Input.analog.x=dx/radius;Input.analog.y=dy/radius;knob.style.transform=`translate(${dx}px,${dy}px)`;
  };
  const start=(e,floating)=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;e.currentTarget.setPointerCapture?.(e.pointerId);if(floating){origin={x:e.clientX,y:e.clientY};placeBase(origin.x,origin.y);base.classList.add('active');}else{const r=base.getBoundingClientRect();origin={x:r.left+r.width/2,y:r.top+r.height/2};}updateAnalog(e.clientX,e.clientY);};
  const move=e=>{if(e.pointerId===pointer){e.preventDefault();updateAnalog(e.clientX,e.clientY);}};
  const end=e=>{if(e.pointerId!==pointer)return;pointer=null;Input.analog.x=Input.analog.y=0;knob.style.transform='translate(0px,0px)';if(settings.controlMode==='floating')base.classList.remove('active');};
  base.addEventListener('pointerdown',e=>start(e,false));base.addEventListener('pointermove',move);base.addEventListener('pointerup',end);base.addEventListener('pointercancel',end);
  catchZone.addEventListener('pointerdown',e=>start(e,true));catchZone.addEventListener('pointermove',move);catchZone.addEventListener('pointerup',end);catchZone.addEventListener('pointercancel',end);

  function apply(){
    pointer=null;Input.analog.x=Input.analog.y=0;knob.style.transform='translate(0px,0px)';base.classList.remove('active');
    if(settings.controlMode==='fixed'){base.style.left='';base.style.top='';base.style.bottom='';}
    document.body.classList.toggle('touch-off',!settings.touchVisible);
    document.body.classList.remove('control-dpad','control-fixed','control-floating');document.body.classList.add('control-'+settings.controlMode);
    Render.zoom=settings.zoom;Render.resize();save();
  }

  function decorateTitle(){
    const row=document.querySelector('.title-card .start-row');if(row&&!document.getElementById('title-options')){const b=document.createElement('button');b.className='secondary';b.id='title-options';b.textContent='OPTIONS';b.onclick=()=>showOptions('title');row.appendChild(b);}
  }
  function decoratePause(){
    const row=document.querySelector('.menu-card .pause-row');if(row&&!document.getElementById('pause-options')){const b=document.createElement('button');b.className='secondary';b.id='pause-options';b.textContent='OPTIONS';b.onclick=()=>showOptions('pause');row.appendChild(b);}
  }
  const oldTitle=UI.title.bind(UI),oldPauseMenu=UI.pause.bind(UI);
  UI.title=function(){oldTitle();decorateTitle();};
  UI.pause=function(){oldPauseMenu();decoratePause();};

  function showOptions(returnTo='pause'){
    const wasPlaying=Game.mode==='play';if(wasPlaying){Game.mode='pause';Input.reset();}
    UI.show(`<div class="menu-card"><div class="eyebrow">SYSTEM OPTIONS</div><h2>Controls & view</h2><div class="options-grid">
      <label>Movement control<select id="opt-control"><option value="dpad">D-pad</option><option value="fixed">Fixed analog stick</option><option value="floating">Floating analog stick</option></select></label>
      <label class="check"><input id="opt-touch" type="checkbox"> Show on-screen touch controls</label>
      <label>Camera zoom <input id="opt-zoom" type="range" min=".95" max="1.28" step=".01"><span id="opt-zoom-value"></span></label>
      <label>Touch opacity <input id="opt-opacity" type="range" min=".25" max="1" step=".05"></label>
      <label>Touch size <input id="opt-size" type="range" min=".8" max="1.2" step=".05"></label>
    </div><div class="pause-row"><button class="primary" id="opt-back">BACK</button><button class="secondary" id="opt-defaults">DEFAULTS</button></div></div>`);
    const control=document.getElementById('opt-control'),touch=document.getElementById('opt-touch'),zoom=document.getElementById('opt-zoom'),zv=document.getElementById('opt-zoom-value'),opacity=document.getElementById('opt-opacity'),size=document.getElementById('opt-size');
    control.value=settings.controlMode;touch.checked=settings.touchVisible;zoom.value=settings.zoom;opacity.value=UI.opacity;size.value=UI.size;
    const refreshZoom=()=>zv.textContent=Math.round(settings.zoom*100)+'%';refreshZoom();
    control.onchange=()=>{settings.controlMode=control.value;apply();};touch.onchange=()=>{settings.touchVisible=touch.checked;apply();};
    zoom.oninput=()=>{settings.zoom=Number(zoom.value);apply();refreshZoom();};
    opacity.oninput=()=>{UI.opacity=Number(opacity.value);UI.applyControls();};size.oninput=()=>{UI.size=Number(size.value);UI.applyControls();};
    document.getElementById('opt-defaults').onclick=()=>{settings={...defaults};UI.opacity=.62;UI.size=1;UI.applyControls();apply();showOptions(returnTo);};
    document.getElementById('opt-back').onclick=()=>{
      if(returnTo==='title'){Game.mode='title';UI.title();}
      else if(returnTo==='play'||wasPlaying){Game.mode='play';UI.close();Input.reset();}
      else{Game.mode='pause';UI.pause();}
    };
  }

  const tools=document.querySelector('.tools');if(tools&&!document.getElementById('options')){const b=document.createElement('button');b.id='options';b.setAttribute('aria-label','Options');b.textContent='⚙';b.onclick=()=>showOptions(Game.mode==='play'?'play':Game.mode==='title'?'title':'pause');tools.insertBefore(b,document.getElementById('pause'));}
  decorateTitle();decoratePause();apply();

  // Make Magnetic Grip activation unmistakable without replacing the base character art.
  const baseHumanoid=Render.humanoid;
  Render.humanoid=function(e,player=true){
    baseHumanoid.call(this,e,player);if(!player||!e.gripCling||e.ledge)return;
    const c=this.ctx,dir=e.gripCling,pulse=.7+.3*Math.sin(this.t*14);c.save();c.translate(e.x,e.y);c.scale(dir,1);
    this.line(7,-27,14,-30,'#73e0b6',3);this.line(7,-17,14,-20,'#73e0b6',3);this.circle(14,-30,3,'#b9fff0');this.circle(14,-20,3,'#b9fff0');
    c.globalAlpha=pulse;this.line(16,-34,20,-38,'#8ff7ff',1);this.line(17,-25,22,-26,'#8ff7ff',1);this.line(16,-15,20,-11,'#8ff7ff',1);c.restore();
  };
})();
