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
      assert(!(Math.abs(s.y-(t.y-12))<30&&Math.abs(s.x-t.x)<82),'pickup must not overlap laser emitter/beam');
    }
  }
}

G.start(77123);G.entities=[];G.l.traps=[];
const r=G.l.route[0],x=(r.shaft+.5)*32,y=(r.floor+3)*32,p=G.p;
Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,ledge:null,coyote:0,jumpBuffer:0});
I.state={right:true,jump:true};I.edges={jump:true};
G.updatePlayer(1/60);
assert(p.vx>N.C.speed*.85,'directional ladder jump should preserve strong horizontal momentum');
assert(p.vy<-N.C.jump*.75,'directional ladder jump should retain a normal upward launch');
assert.equal(p.climb,false,'jump should detach from ladder/cable');

Object.assign(p,{x,y,vx:0,vy:0,ground:false,climb:true,ledge:null,coyote:0,jumpBuffer:0,ladderExitSlow:0});
I.state={right:true};I.edges={};
for(let i=0;i<12;i++)G.updatePlayer(1/60);
assert(p.vx<=N.C.speed*.52,'side dismount without jumping should remain around half movement speed');
console.log('PASS ladder/cable momentum, laser separation, and dynamic crusher geometry');
