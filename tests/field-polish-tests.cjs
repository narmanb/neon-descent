const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const I={state:{},edges:{},analog:{x:0,y:0},reset(){this.state={};this.edges={};this.analog={x:0,y:0}},down(a){return !!this.state[a]},pressed(a){return !!this.edges[a]},axis(){return (+!!this.state.right)-(+!!this.state.left)}};
const ctx={window:{},console,Math,Set,Uint8Array,Input:I,UI:{close(){},end(){}}};vm.createContext(ctx);
const src=['core','genpolish','game','grip','ledge','climbpolish','trappolish','v013polish','v014polish'].map(n=>fs.readFileSync(root+'/src/'+n+'.js','utf8')).join('\n');
vm.runInContext(src,ctx);
const G=ctx.window.Game,N=ctx.window.ND;

for(let seed=1;seed<=128;seed++)for(let stage=1;stage<=4;stage++){
  const l=N.generate(seed,stage);assert(l.validation.ok,'polished map must remain traversable');
  for(const q of l.shops){
    const x0=Math.round(q.x/32),y0=Math.round(q.y/32),x1=x0+Math.round(q.w/32)-1,floorY=y0+Math.round(q.h/32);
    for(let y=y0;y<=floorY+1;y++)for(let x=x0;x<=x1;x++)assert.equal(l.ladders[y*N.C.cols+x],0,`shop ladder overlap seed=${seed} stage=${stage} shop=${q.id} cell=(${x},${y})`);
  }
  for(const t of l.traps){
    if(t.type==='crusher'){
      assert(Number.isFinite(t.mountY)&&Number.isFinite(t.floorY)&&Number.isFinite(t.restY)&&Number.isFinite(t.downY),'crusher must have real mount/floor geometry');
      assert(t.mountY<t.downY,'crusher needs a usable gap');assert(Math.abs((t.downY+18)-t.floorY)<.01,'crusher head must reach the target floor');
    }
    if(t.type==='laser')for(const s of l.spawns){
      if(s.shop!==undefined||!['coin','item','key','crate','scrap'].includes(s.kind))continue;
      assert(!(Math.abs(s.y-(t.y-12))<30&&Math.abs(s.x-t.x)<82),`laser overlap seed=${seed} stage=${stage}`);
    }
  }
}

G.start(77123);G.entities=[];G.l.traps=[];
const r=G.l.route[0],x=(r.shaft+.5)*32,y=(r.floor+3)*32,p=G.p;

// Merely holding UP while walking into a ladder must not auto-grab. A fresh
// digital UP press while overlapping the ladder must attach.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:false,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0,_climbAnalogUpStrong:false});
I.state={up:true};I.edges={};I.analog={x:0,y:0};G.updatePlayer(1/60);
assert.equal(p.climb,false,'held UP without a fresh press must not auto-grab a ladder');
I.state={up:true};I.edges={up:true};G.updatePlayer(1/60);
assert.equal(p.climb,true,'fresh UP press while overlapping ladder should attach');

// A shallow northeast touch-stick angle is intentional walking, not a climb
// command. Crossing a stronger vertical threshold counts as a deliberate grab.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:false,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0,_climbAnalogUpStrong:false});
I.state={up:true,right:true};I.edges={};I.analog={x:.7,y:-.4};G.updatePlayer(1/60);
assert.equal(p.climb,false,'shallow diagonal touch analog must not grab ladder');
I.state={up:true};I.edges={};I.analog={x:.15,y:-.8};G.updatePlayer(1/60);
assert.equal(p.climb,true,'strong upward touch analog press should grab ladder');
I.reset();

// Left/right alone must not drift the player off a ladder or Mag-Cable in midair.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={right:true};for(let i=0;i<12;i++)G.updatePlayer(1/60);
assert.equal(p.climb,true,'side input alone should keep player attached in midair');assert(Math.abs(p.x-x)<1);assert(Math.abs(p.vx)<1);

// At the actual bottom of a ladder, grounded left/right becomes normal walking.
const bottomTy=r.floor+2,bottomX=(r.shaft+.5)*32,bottomY=(bottomTy+1)*32-.001;
N.setTile(G.l,r.shaft,bottomTy+1,1);G.l.ladders[bottomTy*N.C.cols+r.shaft]=1;
Object.assign(p,{x:bottomX,y:bottomY,vx:0,vy:0,ground:true,climb:true,gripCling:0,ledge:null,coyote:.1,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={right:true};I.edges={};G.updatePlayer(1/60);
assert.equal(p.climb,false,'grounded player at ladder bottom should walk away without jumping');assert(p.vx>20);

// Direction + jump explicitly detaches with full normal jump momentum.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={right:true,jump:true};I.edges={jump:true};G.updatePlayer(1/60);
assert(p.vx>N.C.speed*.9);assert(p.vy<-N.C.jump*.9);assert.equal(p.climb,false);assert(p.climbRegrabLock>.1);
I.state={right:true,up:true};I.edges={};for(let i=0;i<4;i++)G.updatePlayer(1/60);assert.equal(p.climb,false);assert(p.vx>N.C.speed*.45);

// Magnetic Grip uses the same strong directional jump and re-grab grace period.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,gripCling:1,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={left:true,jump:true};I.edges={jump:true};G.updatePlayer(1/60);
assert(p.vx<-N.C.speed*.9);assert(p.vy<-N.C.jump*.9);assert.equal(p.gripCling,0);assert(p.gripRegrabLock>.1);

// Smart Disc outbound wall impact rebounds at a slight angle from the near side.
I.reset();G.shots=[];G.entities=[];p.hand='disc';p.back=null;
Object.assign(p,{x:160,y:200,vx:0,vy:0});
for(let yy=4;yy<=7;yy++)for(let xx=3;xx<=18;xx++)N.setTile(G.l,xx,yy,0);
const wallTx=10,wallTy=5,wallX=wallTx*32;N.setTile(G.l,wallTx,wallTy,1);
G.shots.push({x:wallX-28,y:(wallTy+.5)*32,vx:470,vy:0,life:1.25,owner:'player',from:p,type:'disc',damage:1,hits:new Set()});
let bounced=null;for(let i=0;i<12&&!bounced;i++){G.updateShots(1/60);const d=G.shots.find(s=>s.type==='disc');if(d?.returning)bounced=d;}
assert(bounced,'outbound wall strike should put Smart Disc into return state');assert(bounced.x<wallX,'disc must stay on near side of wall');assert(Math.abs(bounced.vy)>20,'wall rebound should use a visible slight angle when open space permits');

// The same enemy can be cut once outbound and once again on the return pass.
G.shots=[];G.entities=[];p.hand='disc';Object.assign(p,{x:160,y:200,vx:0,vy:0});
for(let yy=4;yy<=7;yy++)for(let xx=3;xx<=18;xx++)N.setTile(G.l,xx,yy,0);
const target=G.spawn({kind:'enemy',type:'crawler',x:245,y:200});
G.shots.push({x:185,y:185,vx:470,vy:0,life:1.25,owner:'player',from:p,type:'disc',damage:1,hits:new Set()});
for(let i=0;i<90&&!target.dead;i++)G.updateShots(1/60);
assert.equal(target.dead,true,'Smart Disc should be able to hit the same enemy on outbound and return passes');

// If the homing return is blocked by a wall, the disc becomes a recoverable
// ground item and leaves the player's hand instead of tunneling through.
G.shots=[];G.entities=[];p.hand='disc';Object.assign(p,{x:(wallTx+3)*32,y:200,vx:0,vy:0});
for(let yy=4;yy<=7;yy++)for(let xx=3;xx<=18;xx++)N.setTile(G.l,xx,yy,0);N.setTile(G.l,wallTx,wallTy,1);
G.shots.push({x:wallX-24,y:(wallTy+.5)*32,vx:420,vy:0,life:.7,returning:true,owner:'player',from:p,type:'disc',damage:1,hits:new Set(),bounceTimer:0});
for(let i=0;i<20&&G.shots.some(s=>s.type==='disc');i++)G.updateShots(1/60);
assert.equal(p.hand,null,'blocked returning disc should leave the equipped hand');
assert(G.entities.some(e=>!e.dead&&e.kind==='item'&&e.id==='disc'),'blocked returning disc should drop as recoverable item');

console.log('PASS v0.14 climb grab, ladder movement, Smart Disc behavior, shop ladders, lasers, and crushers');
