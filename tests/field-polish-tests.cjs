const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const I={state:{},edges:{},reset(){this.state={};this.edges={}},down(a){return !!this.state[a]},pressed(a){return !!this.edges[a]},axis(){return (+!!this.state.right)-(+!!this.state.left)}};
const ctx={window:{},console,Math,Set,Uint8Array,Input:I,UI:{close(){},end(){}}};vm.createContext(ctx);
const src=['core','genpolish','game','grip','ledge','climbpolish','trappolish'].map(n=>fs.readFileSync(root+'/src/'+n+'.js','utf8')).join('\n');
vm.runInContext(src,ctx);
const G=ctx.window.Game,N=ctx.window.ND;

for(let seed=1;seed<=128;seed++)for(let stage=1;stage<=4;stage++){
  const l=N.generate(seed,stage);assert(l.validation.ok,'polished map must remain traversable');
  for(const t of l.traps){
    if(t.type==='crusher'){
      assert(Number.isFinite(t.mountY)&&Number.isFinite(t.floorY)&&Number.isFinite(t.restY)&&Number.isFinite(t.downY),'crusher must have real mount/floor geometry');
      assert(t.mountY<t.downY,'crusher needs a usable gap');
      assert(Math.abs((t.downY+18)-t.floorY)<.01,'crusher head must reach the target floor');
    }
    if(t.type==='laser')for(const s of l.spawns){
      if(s.shop!==undefined||!['coin','item','key','crate','scrap'].includes(s.kind))continue;
      const overlap=Math.abs(s.y-(t.y-12))<30&&Math.abs(s.x-t.x)<82;
      assert(!overlap,`laser overlap seed=${seed} stage=${stage} trap=(${t.x},${t.y}) pickup=${s.kind}:${s.id||s.value||''}@(${s.x},${s.y})`);
    }
  }
}

G.start(77123);G.entities=[];G.l.traps=[];
const r=G.l.route[0],x=(r.shaft+.5)*32,y=(r.floor+3)*32,p=G.p;

// Left/right alone must no longer drift the player off a ladder or Mag-Cable.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={right:true};I.edges={};
for(let i=0;i<12;i++)G.updatePlayer(1/60);
assert.equal(p.climb,true,'side input alone should keep the player attached');
assert(Math.abs(p.x-x)<1,'side input alone should not slide off the ladder/cable');
assert(Math.abs(p.vx)<1,'attached horizontal velocity should stay zero');

// Direction + jump explicitly detaches with a full normal jump and a re-grab grace period.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={right:true,jump:true};I.edges={jump:true};
G.updatePlayer(1/60);
assert(p.vx>N.C.speed*.9,'directional ladder jump should preserve full horizontal momentum');
assert(p.vy<-N.C.jump*.9,'directional ladder jump should retain normal upward launch');
assert.equal(p.climb,false,'jump should detach from ladder/cable');
assert(p.climbRegrabLock>.1,'ladder/cable jump should start a re-grab grace period');
I.state={right:true,up:true};I.edges={};
for(let i=0;i<4;i++)G.updatePlayer(1/60);
assert.equal(p.climb,false,'held climb input must not immediately re-catch the ladder/cable');
assert(p.vx>N.C.speed*.45,'jump-off momentum should survive the detach frames');

// Magnetic Grip uses the same strong directional jump and cannot instantly re-stick.
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,gripCling:1,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0});
I.state={left:true,jump:true};I.edges={jump:true};
G.updatePlayer(1/60);
assert(p.vx<-N.C.speed*.9,'Magnetic Grip wall jump should launch strongly away from the wall');
assert(p.vy<-N.C.jump*.9,'Magnetic Grip wall jump should retain normal jump height');
assert.equal(p.gripCling,0,'wall jump should release Magnetic Grip');
assert(p.gripRegrabLock>.1,'wall jump should start a Magnetic Grip re-grab grace period');
console.log('PASS locked ladder/cable attachment, jump momentum, wall detach, laser separation, and dynamic crusher geometry');
