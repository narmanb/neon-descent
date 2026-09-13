// Offline DOM + Canvas integration checks; complementary to live browser QA, not a browser emulator.
const {JSDOM}=require(process.env.NEON_JSDOM||'jsdom');
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(root+'/Neon-Descent.html','utf8');let frames=[],errors=[],registered=[];
const dom=new JSDOM(html,{url:'https://neon.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
Object.defineProperty(w,'innerWidth',{value:873,writable:true});Object.defineProperty(w,'innerHeight',{value:393,writable:true});Object.defineProperty(w,'devicePixelRatio',{value:1});
w.requestAnimationFrame=cb=>(frames.push(cb),1);w.HTMLElement.prototype.setPointerCapture=function(){};
Object.defineProperty(w.document,'modelContext',{value:{registerTool(t){registered.push(t)}}});
for(const prop of ['width','height'])Object.defineProperty(w.HTMLCanvasElement.prototype,prop,{get(){return this._backing?this._backing[prop]:+(this.getAttribute(prop)||(prop==='width'?300:150));},set(v){this.setAttribute(prop,String(v));if(this._backing)this._backing[prop]=v;}});
w.HTMLCanvasElement.prototype.getContext=function(){if(!this._backing){this._backing=createCanvas(this.width,this.height);const c=this._backing.getContext('2d');const draw=c.drawImage.bind(c);c.drawImage=(img,...args)=>draw(img._backing||img,...args);this._ctx=c;}return this._ctx;};
w.addEventListener('error',e=>errors.push(e.message));for(const s of w.document.querySelectorAll('script'))if(s.textContent)require('node:vm').runInContext(s.textContent,dom.getInternalVMContext());
let now=w.performance.now();function tick(n=1,delta=1000/60){for(let i=0;i<n;i++){now+=delta;let q=frames;frames=[];q.forEach(cb=>cb(now));}}
function tap(action){let el=w.document.querySelector(`[data-input="${action}"]`);for(const type of ['pointerdown','pointerup']){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:3});el.dispatchEvent(e);}}
assert.equal(w.Game.mode,'title');w.document.getElementById('start').click();tick(2);assert.equal(w.Game.mode,'play');assert(w.document.getElementById('panel').hidden);
const p=w.Game.p;const cableCount=p.cables;tap('cable');tick(2);assert.equal(p.cables,cableCount-1,'instant touch cable tap must be retained');
const bombs=p.bombs;tap('bomb');tick(2);assert.equal(p.bombs,bombs-1,'instant touch charge tap must be retained');
const y=p.y;tap('jump');tick(5);assert(p.y<y,'quick jump must lift player');
w.document.getElementById('pause').click();const time=w.Game.time;tick(30);assert.equal(w.Game.time,time);assert.equal(w.Game.mode,'pause');w.document.getElementById('resume').click();tick(3);assert.equal(w.Game.mode,'play');
// Retain an input edge across a rendering frame with no physics step (120 Hz devices).
w.Input.reset();w.Input.pressedKeys.cable=true;w.Input.poll();w.Input.poll();assert(w.Input.pressed('cable'));w.Input.consume();assert(!w.Input.pressed('cable'));
// Exercise all renderer branches, equipment, enemies, traps, darkness and aspect ratios.
for(const id of w.ND.ITEMS.map(i=>i.id)){w.Game.equip(w.Game.spawn({kind:'item',id,x:p.x,y:p.y}));}
for(const type of ['crawler','skitter','burrow','flyer','slug','sentry','enforcer','detonator','phase','mimic'])w.Game.spawn({kind:'enemy',type,x:p.x+Math.random()*180-90,y:p.y-100});
for(const [width,height] of [[873,393],[1280,720],[720,480],[1024,440],[393,873]]){w.innerWidth=width;w.innerHeight=height;w.dispatchEvent(new w.Event('resize'));tick(2);assert.equal(w.document.getElementById('game').width,width);assert.equal(w.document.getElementById('game').height,height);}
w.innerWidth=873;w.innerHeight=393;w.dispatchEvent(new w.Event('resize'));tick(2);
assert.equal(errors.length,0,errors.join('\n'));assert.equal(registered.length,2);assert.equal(registered[0].execute().mode,'play');assert.throws(()=>registered[1].execute({buttons:['invalid'],frames:10}),/Invalid/);
fs.writeFileSync(root+'/tests/canvas-check.png',w.document.getElementById('game')._backing.toBuffer('image/png'));
console.log('PASS full HTML boot, DOM controls, fast taps, pause/resume, 120 Hz edges, all render branches, 5 canvas aspect ratios, agent-tool schema and invalid-input validation');
dom.window.close();
