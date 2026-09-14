const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const context={window:{},console,Math,Set,Uint8Array};
context.UI={close(){},end(){},pause(){}};
context.Input={state:{},edges:{},reset(){this.state={};this.edges={}},down(a){return !!this.state[a]},axis(){return (+!!this.state.right)-(+!!this.state.left)},pressed(a){return !!this.edges[a]}};
vm.createContext(context);
for(const file of ['core.js','genpolish.js','game.js','grip.js'])vm.runInContext(fs.readFileSync(root+'/src/'+file,'utf8'),context);
const N=context.window.ND,G=context.window.Game,I=context.Input;

let shops=0;
for(let seed=1;seed<=64;seed++)for(let stage=1;stage<=4;stage++){
  const l=N.generate(seed*3571,stage);assert(l.validation.ok);
  const isSecretMimic=s=>s.type==='mimic'&&l.secrets.some(q=>Math.hypot(q.x-s.x,q.y-s.y)<70);
  const ambient=l.spawns.filter(s=>s.kind==='enemy'&&s.type!=='merchant'&&!isSecretMimic(s));
  assert(ambient.length<=l.spawnSafety.maxAmbient);
  assert(ambient.every(s=>Math.hypot(s.x-l.entrance.x,s.y-l.entrance.y)>=l.spawnSafety.radius));
  assert(l.traps.every(t=>Math.hypot(t.x-l.entrance.x,t.y-l.entrance.y)>=l.spawnSafety.trapRadius));
  for(const q of l.shops){
    shops++;assert(q.enclosed);
    const x0=Math.round(q.x/32),y0=Math.round(q.y/32),x1=x0+Math.round(q.w/32)-1;
    assert(N.solid(l,x0,y0));assert(N.solid(l,x1,y0+2));assert.equal(N.tileAt(l,x0,y0+2),0);assert.equal(N.tileAt(l,x0,y0+3),0);
    const m=l.spawns.find(s=>s.kind==='enemy'&&s.type==='merchant'&&s.shop===q.id);assert(m);assert(m.x>q.x+q.w*.7&&m.x<q.x+q.w);
  }
}
assert(shops>20);

function arena(){
  G.start(77);G.l.tiles.fill(0);G.l.ladders.fill(0);G.l.platforms=[];G.l.traps=[];G.l.shops=[];G.l.doors=[];G.l.cables=[];G.entities=[];G.shots=[];
  for(let x=0;x<42;x++){G.l.tiles[20*42+x]=1;G.l.tiles[33*42+x]=6;}
  Object.assign(G.p,{x:400,y:640-.001,ground:true,vy:0,vx:0,fallStart:640,inv:0,hp:8,cool:0});I.reset();return G.p;
}
function step(frames,state={}){I.state=state;for(let i=0;i<frames;i++){G.step(1/60);I.edges={};}}
const p=arena();G.equip(G.spawn({kind:'item',id:'grip',x:p.x,y:p.y}));for(let y=12;y<20;y++)N.setTile(G.l,13,y,1);p.x=13*32-p.w/2-1;p.face=1;
step(45,{up:true,right:true});assert(p.y<570);assert.equal(p.gripCling,1);assert(p.climb);
console.log('PASS polish generation safety, enclosed shops, and magnetic grip climbing');
// CI trigger after workflow branch registration.
