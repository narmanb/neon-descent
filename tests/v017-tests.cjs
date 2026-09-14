const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'src',name),'utf8');

// Camera migration: untouched legacy defaults move to 150%, custom choices survive.
function migrate(saved){
  let value=JSON.stringify(saved);const localStorage={getItem(){return value},setItem(k,v){value=v}};
  const c={localStorage,JSON,Math};vm.createContext(c);vm.runInContext(read('v017pre.js'),c);return JSON.parse(value);
}
let migrated=migrate({zoom:1.18,viewRevision:2});assert.equal(migrated.zoom,1.5);assert.equal(migrated.viewRevision,3);
migrated=migrate({zoom:1.27,viewRevision:2});assert.equal(migrated.zoom,1.27);assert.equal(migrated.viewRevision,3);

// Mobile browser chrome/fullscreen must not change world scale at the same zoom.
const cameraCtx={
  window:{devicePixelRatio:2,screen:{width:800,height:400}},navigator:{maxTouchPoints:5},innerWidth:800,innerHeight:300,
  Render:{zoom:1.5,canvas:{}},Math,Number
};
vm.createContext(cameraCtx);vm.runInContext(read('v017camera.js'),cameraCtx);
const normalScale=cameraCtx.Render.scale,normalH=cameraCtx.Render.h;
cameraCtx.innerHeight=400;cameraCtx.Render.resize();
assert(Math.abs(cameraCtx.Render.scale-normalScale)<1e-9,'fullscreen must preserve world-pixel scale');
assert(cameraCtx.Render.h>normalH,'fullscreen should reveal more vertical world instead of magnifying it');
assert.equal(cameraCtx.window.NeonCameraMath.stableReferenceHeight(300,800,400,5),400);

// Generation + gameplay runtime harness.
const context={window:{},console,Math,Set,Map,Uint8Array,Object,Array,String,Number};
context.UI={close(){},end(){},pause(){},message(){}};
context.Input={state:{},edges:{},reset(){this.state={};this.edges={}},down(a){return !!this.state[a]},axis(){return (+!!this.state.right)-(+!!this.state.left)},pressed(a){return !!this.edges[a]}};
vm.createContext(context);
for(const file of ['core.js','genpolish.js','v017gen.js','game.js','v017gameplay.js'])vm.runInContext(read(file),context);
const N=context.window.ND,G=context.window.Game,I=context.Input;

// The isolated full block pattern from the playtest is removed, leaving two body rows.
let level=N.generate(901,1),x=4,y=5;
N.setTile(level,x,y+1,N.TILE.WALL);N.setTile(level,x,y,N.TILE.WALL);N.setTile(level,x,y-1,N.TILE.AIR);N.setTile(level,x,y-2,N.TILE.WALL);N.setTile(level,x-1,y,N.TILE.AIR);N.setTile(level,x+1,y,N.TILE.AIR);
const repaired=N.softenTightChokes(level);assert(repaired>=1);assert.equal(N.tileAt(level,x,y),N.TILE.AIR);assert(level.validation.ok,'choke repair must preserve a valid route');

function arena(){
  G.start(77);G.l.tiles.fill(0);G.l.ladders.fill(0);G.l.platforms=[];G.l.traps=[];G.l.shops=[];G.l.doors=[];G.l.cables=[];G.entities=[];G.shots=[];G.particles=[];G.rings=[];G.texts=[];
  for(let xx=0;xx<N.C.cols;xx++)N.setTile(G.l,xx,20,N.TILE.WALL);
  Object.assign(G.p,{x:100,y:20*32-.001,w:20,h:28,ground:true,vy:0,vx:0,fallStart:20*32,inv:0,hp:8,maxHp:8,cool:0,stun:0,hand:null,back:null,face:1,held:null,passives:new Set()});I.reset();return G.p;
}

// Turrets may not acquire/fire through a solid wall.
let p=arena(),turret={type:'turret',x:250,y:20*32,phase:0,cool:0,dead:false};G.l.traps=[turret];N.setTile(G.l,5,19,N.TILE.WALL);
G.updateTraps(1/60);assert.equal(G.shots.length,0,'turret must not fire through a wall');
N.setTile(G.l,5,19,N.TILE.AIR);turret.cool=0;G.updateTraps(1/60);assert(G.shots.length>0,'turret should fire once it has clear line of sight');

// Player gunfire can damage the visible turret hardware.
p=arena();turret={type:'turret',x:190,y:20*32,phase:0,cool:9,dead:false};G.l.traps=[turret];
G.fire(p,'shotgun',1,'player');for(let i=0;i<20;i++)G.updateShots(1/60);
assert(turret.dead||turret.hp<turret.maxHp,'Pulse Shotgun pellets must register on a turret');

// Mines are also weapon-reactive instead of swallowing normal horizontal fire.
p=arena();let mine={type:'mine',x:160,y:20*32,w:28,h:16,phase:0,cool:0,dead:false};G.l.traps=[mine];G.fire(p,'pulse',1,'player');for(let i=0;i<12;i++)G.updateShots(1/60);
assert(mine.armed!==undefined&&mine.armed<=.08,'shooting a mine should arm/detonate it');

// Q-9 retaliates against the real non-player attacker without blaming the player.
p=arena();G.l.shops=[{id:0,x:80,y:500,w:220,h:140,angry:false}];let merchant=G.spawn({kind:'enemy',type:'merchant',x:110,y:20*32,shop:0});turret={type:'turret',x:260,y:20*32,phase:0,cool:0,dead:false};G.l.traps=[turret];
G.damage(merchant,1,turret.x,turret.y,'world',false,turret);assert.equal(merchant.retaliate,turret);assert.equal(G.l.shops[0].angry,false);assert.equal(G.wanted,false);
merchant.stun=0;merchant.x=180;turret.dead=true;G.updateEnemy(merchant,1/60);assert.equal(merchant.retaliate,null);assert.equal(merchant.returningToShop,true,'merchant should head back to shop after attacker is destroyed');

// Blade contact uses body edges, fixing misses against low-profile enemies near its tip.
p=arena();p.hand='blade';p.cool=0;p.stun=0;let slug=G.spawn({kind:'enemy',type:'slug',x:176,y:20*32});const hp=slug.hp;G.attack();assert(slug.hp<hp,'Mono-Blade should hit a low-profile enemy whose body edge is within reach');

const polish=read('v017polish.js'),gameplay=read('v017gameplay.js'),gen=read('v017gen.js');
assert(polish.includes("nd-debug-tab")&&polish.includes('GIVE GRIP GLOVES')&&polish.includes('+1000 CREDITS'),'CRT pause computer must restore the temporary DEBUG tools');
assert(polish.includes('MutationObserver'),'DEBUG category must survive v0.16 page re-renders');
assert(polish.includes('zoom:1.50'),'visible restore-default paths must use the new 150% camera default');
assert(gameplay.includes('lineClear')&&gameplay.includes('retaliate')&&gameplay.includes('damageTrap'),'combat polish must retain LOS, retaliation, and destructible trap logic');
assert(gen.includes("t.type==='mine'")&&gen.includes('t.h=Math.max'),'generated mines must receive the forgiving low-profile hitbox');

console.log('PASS v0.17 camera parity/default, debug page, turret LOS/destruction, merchant retaliation, melee reach, and choke repair');
