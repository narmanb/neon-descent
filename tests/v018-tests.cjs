const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'src',name),'utf8');

// Geometry layer: half tiles must have real 16px collision instead of behaving
// like invisible full 32px blocks.
const ctx={console,Math,Set,Map,Uint8Array,Object,Array,String,Number};
vm.createContext(ctx);
for(const file of ['core.js','genpolish.js','v017gen.js','v018geometry.js'])vm.runInContext(read(file),ctx);
const N=vm.runInContext('ND',ctx);
assert.equal(N.TILE.HALF_TOP,9);assert.equal(N.TILE.HALF_BOTTOM,10);
const empty=()=>({tiles:new Uint8Array(N.C.cols*N.C.rows),ladders:new Uint8Array(N.C.cols*N.C.rows),platforms:[],cables:[],route:[],shops:[],rooms:[],spawns:[],traps:[]});
let l=empty();N.setTile(l,5,5,N.TILE.HALF_TOP);
assert.equal(N.pointBlocked(l,176,168),true,'upper half of HALF_TOP must be solid');
assert.equal(N.pointBlocked(l,176,184),false,'lower half of HALF_TOP must remain open');
assert.equal(N.blocked(l,176,204,20,28),false,'player should fit 16px closer beneath a thin suspended slab');
assert.equal(N.blocked(l,176,203,20,28),true,'player head must still collide with the visible slab');
let b=N.body(176,130);b.vy=400;N.move(l,b,.12,false);assert(b.ground&&Math.abs(b.y-159.999)<.02,'falling body must land on HALF_TOP at the original platform height');

l=empty();N.setTile(l,5,5,N.TILE.HALF_BOTTOM);b=N.body(176,145);b.vy=400;N.move(l,b,.12,false);assert(b.ground&&Math.abs(b.y-175.999)<.02,'HALF_BOTTOM must expose a raised 16px landing surface');

// Procedural generation should deliberately mix old full shop floors and new
// half-height slabs while retaining the certified natural route.
let sawHalf=false,sawFull=false,totalHalf=0;
for(let seed=1;seed<=40;seed++){
  const stage=N.generate(seed,1);assert(stage.validation.ok,`seed ${seed} must remain naturally traversable`);
  totalHalf+=stage.halfBlocks||0;
  for(const q of stage.shops||[]){if(q.floorProfile==='half')sawHalf=true;if(q.floorProfile==='full')sawFull=true;}
}
assert(sawHalf,'generation must produce thin shop floors');
assert(sawFull,'generation must preserve some full-depth shop floors for variety');
assert(totalHalf>20,'generation should use half slabs beyond a token single example');

// BEGIN DESCENT must request fullscreen inside the same user activation before
// the run begins. This ordering matters on mobile browsers.
let events=[];const startButton={};
const uiCtx={
  console,Math,Promise,
  window:{},screen:{orientation:{lock(){events.push('lock');return Promise.resolve();}}},
  document:{fullscreenElement:null,documentElement:{requestFullscreen(){events.push('fullscreen');return Promise.resolve();}},getElementById(id){return id==='start'?startButton:null;}},
  Render:{cache:{}},UI:{title(){events.push('title');}},Game:{initAudio(){events.push('audio');},start(){events.push('start');}}
};
vm.createContext(uiCtx);vm.runInContext(read('v018polish.js'),uiCtx);
assert.equal(typeof startButton.onclick,'function','current title screen must be rewired immediately');
startButton.onclick();
assert(events.includes('fullscreen'),'BEGIN DESCENT must request fullscreen');
assert(events.indexOf('fullscreen')<events.indexOf('start'),'fullscreen request must occur before Game.start within the click activation');

const gameplay=read('v017gameplay.js'),polish=read('v018polish.js');
assert(gameplay.includes('ND.pointBlocked?ND.pointBlocked'),'projectiles and LOS must respect the open half of half blocks');
assert(polish.includes("Render.cache[ND.TILE.HALF_TOP+'_'+v]"),'renderer must install dedicated half-slab tile art');
assert(polish.includes('requestRunFullscreen'),'title start must retain automatic fullscreen wiring');

console.log('PASS v0.18 real half-block collision/generation/rendering, projectile openings, and BEGIN DESCENT fullscreen');
