const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'src',name),'utf8');

const ctx={console,Math,Set,Map,Uint8Array,Object,Array,String,Number};
vm.createContext(ctx);
for(const file of ['core.js','genpolish.js','v017gen.js','v018geometry.js','v019geometry.js','v020gen.js'])vm.runInContext(read(file),ctx);
const N=vm.runInContext('ND',ctx);

let shops=0,vaults=0,traps=0;
for(let seed=1;seed<=100;seed++)for(let stage=1;stage<=4;stage++){
  const l=N.generate(seed,stage);assert(l.validation.ok,`seed ${seed}:${stage} must remain naturally traversable`);
  for(const t of l.traps||[]){traps++;assert.equal(N.v020LadderConflict(l,t),false,`trap ${t.type} must not overlap a permanent ladder`);}
  for(const room of l.rooms||[])if(room.vault){vaults++;assert.equal(N.v020LadderCutsVault(l,room),false,'a locked optional vault must not be bypassed by a permanent ladder');}
  for(const q of l.shops||[]){
    const merchant=l.spawns.find(s=>s.kind==='enemy'&&s.type==='merchant'&&s.shop===q.id),stock=l.spawns.filter(s=>s.kind==='item'&&s.shop===q.id);
    if(!merchant||!stock.length)continue;shops++;
    if(q.entry!=='right')for(const item of stock)assert(item.x<merchant.x,'shop stock should be spread in front of a back-wall merchant');
    else for(const item of stock)assert(item.x>merchant.x,'right-entry shop stock should be spread in front of its back-wall merchant');
  }
}
assert(shops>20,'test corpus should include many shops');assert(vaults>20,'test corpus should include many still-locked vaults');assert(traps>50,'test corpus should include many traps');

ctx.Game={
  p:null,l:null,entities:[],shots:[],
  updatePlayer(){},updateShots(){},updateEnemy(){},
  fx(){},message(){},lineClear(){return true;},
  anger(id){this.l.shops[id].angry=true;}
};
ctx.Input={down(){return false;}};
vm.runInContext(read('v020gameplay.js'),ctx);
const G=ctx.Game;
const l={tiles:new Uint8Array(N.C.cols*N.C.rows),ladders:new Uint8Array(N.C.cols*N.C.rows),platforms:[],cables:[],shops:[{id:0,x:160,y:96,w:192,h:128,entry:'left',angry:false}]};
N.setTile(l,6,6,N.TILE.WALL);l.ladders[5*N.C.cols+5]=1;
const p=N.body(176,194);p.face=1;
const top=G.findLadderTopOut(l,p);assert(top,'ladder top should find the adjacent walkable deck');assert(Math.abs(top.x-208)<.01&&Math.abs(top.y-191.999)<.02,'top-out should place the player standing on the adjacent deck');

const merchant={kind:'enemy',type:'merchant',shop:0,dead:false,x:320,y:224},enemy={kind:'enemy',type:'crawler',dead:false,x:240,y:224};
G.l=l;G.p={kind:'player'};G.entities=[merchant,enemy];
G.triggerMerchantDefense(0,enemy);assert.equal(merchant.retaliate,enemy,'enemy damage to shop stock should identify the attacker');assert.equal(l.shops[0].angry,false,'enemy damage must not flag the player wanted');
merchant.retaliate=null;l.shops[0].angry=false;G.triggerMerchantDefense(0,G.p);assert.equal(l.shops[0].angry,true,'player damage to shop stock should anger Q-9');

const gameplay=read('v020gameplay.js'),gen=read('v020gen.js');
assert(gameplay.includes('segmentHitsStock'),'shop stock must participate in projectile alert detection');
assert(gameplay.includes('findLadderTopOut'),'ladder top-out helper must remain installed');
assert(gameplay.includes('nearbyThreat'),'neutral shopkeepers must notice nearby hostiles');
assert(gen.includes('sanitizeTraps')&&gen.includes('ladderConflict'),'generation must sanitize ladder-overlapping hazards');
assert(gen.includes('openBypassedVaults'),'ladder-bypassed locked rooms must be converted to open optional rooms');
assert(gen.includes("merchant.shopHome='back'"),'shopkeeper spawn should be moved to the back of the shop');

console.log('PASS v0.20 ladder-safe traps, vault access integrity, automatic ladder top-out, and Q-9 back-wall/alert behavior');
