const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,'src',n),'utf8');
const ctx={console,Math,Set,Map,Uint8Array,Object,Array,String,Number};vm.createContext(ctx);
for(const f of ['core.js','genpolish.js','v017gen.js','v018geometry.js','v019geometry.js'])vm.runInContext(read(f),ctx);
const N=vm.runInContext('ND',ctx),T=N.TILE;
for(const id of ['HALF_LEFT','HALF_RIGHT','THIN_PLATFORM','GLASS_PARTITION','BREAKABLE_WALL','SLOPE_SHALLOW_R','SLOPE_MEDIUM_R','SLOPE_STEEP_R','CEIL_SHALLOW_R','CEIL_MEDIUM_R','CEIL_STEEP_R'])assert(Number.isInteger(T[id]),`${id} must exist`);
const empty=()=>({tiles:new Uint8Array(N.C.cols*N.C.rows),ladders:new Uint8Array(N.C.cols*N.C.rows),platforms:[],cables:[],route:[],shops:[],rooms:[],spawns:[],traps:[]});
let l=empty();
N.setTile(l,5,5,T.HALF_LEFT);assert.equal(N.pointBlocked(l,166,176),true);assert.equal(N.pointBlocked(l,184,176),false,'half-left must leave right half open');
N.setTile(l,6,5,T.HALF_RIGHT);assert.equal(N.pointBlocked(l,214,176),true);assert.equal(N.pointBlocked(l,198,176),false,'half-right must leave left half open');
N.setTile(l,7,5,T.THIN_PLATFORM);assert.equal(N.pointBlocked(l,240,164),true);assert.equal(N.pointBlocked(l,240,172),false,'thin platform must leave most of its cell open below');
N.setTile(l,8,5,T.GLASS_PARTITION);assert.equal(N.pointBlocked(l,272,176),true);assert.equal(N.pointBlocked(l,260,176),false,'glass partition must be a narrow vertical collision strip');
N.setTile(l,9,5,T.SLOPE_MEDIUM_R);assert.equal(N.pointBlocked(l,296,190),true);assert.equal(N.pointBlocked(l,296,174),false,'medium slope must use angled collision rather than a full tile');
N.setTile(l,10,5,T.CEIL_MEDIUM_R);assert.equal(N.pointBlocked(l,344,170),true);assert.equal(N.pointBlocked(l,344,190),false,'ceiling slope must leave open space beneath its angle');

l=empty();N.addOneWayPlatform(l,160,160,64);let b=N.body(176,145);b.vy=220;N.move(l,b,.12,true);assert(b.ground&&Math.abs(b.y-160)<.02,'one-way platform must catch a falling body from above');
b=N.body(176,145);b.vy=220;b.drop=.25;N.move(l,b,.12,true);assert(b.y>160&&!b.ground,'drop flag must allow Down+Jump style passage through a one-way platform');

let thin=0,ramps=0,oneWays=0;for(let seed=1;seed<=48;seed++){const s=N.generate(seed,1);assert(s.validation.ok,`seed ${seed} must remain valid`);thin+=s.v019Geometry?.thin||0;ramps+=s.v019Geometry?.ramps||0;oneWays+=s.v019Geometry?.oneWays||0;}assert(thin>0,'procedural generation should use thin solid geometry');assert(ramps>0,'procedural generation should include angled geometry');assert(oneWays>0,'procedural generation should include static one-way platforms');

const game=read('game.js'),polish=read('v019polish.js');assert(game.includes("if(down&&p.platform){p.drop=.25"),'existing Down+Jump drop-through behavior must remain wired to platform collision');assert(polish.includes('T.HALF_LEFT')&&polish.includes('T.SLOPE_MEDIUM_R')&&polish.includes('T.CEIL_MEDIUM_R'),'renderer must install art for new half and slope geometry');
console.log('PASS v0.19 half-width/thin geometry, floor and ceiling slopes, one-way drop-through, rendering, and procedural variety');
