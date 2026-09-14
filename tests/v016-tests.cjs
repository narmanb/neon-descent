const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const v016=fs.readFileSync(path.join(root,'src/v016polish.js'),'utf8');
const polish=fs.readFileSync(path.join(root,'src/polish.js'),'utf8');

assert(v016.includes('function drawGripClinger(e)'),'v0.16 must define a dedicated Magnetic Grip pose');
assert(v016.includes('function idleGripContact'),'stationary Magnetic Grip needs its own low-intensity contact effect');
assert(v016.includes('function movingGripTrail'),'moving Magnetic Grip needs a stronger movement trail');
assert(v016.includes("if(player&&e.gripCling&&!e.ledge){drawGripClinger(e);return;}"),'grip pose must replace the base humanoid instead of layering duplicate limbs');
assert(v016.includes("Math.abs(e.vy)>8"),'grip visuals must distinguish idle from vertical movement');

for(const page of ['STATUS','INVENTORY','SETTINGS'])assert(v016.includes(page),`pause computer must expose ${page} page`);
assert(v016.includes("it?.desc"),'inventory page must display item/passive descriptions');
assert(v016.includes('PASSIVE AUGMENTS'),'inventory page must list passive upgrades');
assert(v016.includes('nd-pc-switch'),'pause computer must include physical-style side switches');
assert(v016.includes('nd-pc-sidebtn'),'pause computer must include physical-style side buttons');
assert(v016.includes('repeating-linear-gradient'),'CRT screen must include scanline treatment');

assert(polish.includes("window.NeonPolishSettings"),'shared settings API must be available to pause computer');
assert(polish.includes("Math.max(.80,Math.min(1.50"),'camera zoom must support the expanded 80%-150% range');
assert(polish.includes('min=".80" max="1.50" step=".01"'),'legacy options camera slider must use the same fine-grained range');
assert(v016.includes('min=".80" max="1.50" step=".01"'),'pause settings camera slider must use the expanded fine-grained range');
assert(v016.includes('Changes apply immediately.'),'pause camera setting should be live');

// Execute the new wrapper with a minimal renderer. A grip frame must never call
// the previous humanoid renderer; a normal frame still must.
let baseCalls=0,captured='';
const render={
  t:1,ctx:{save(){},restore(){},translate(){},scale(){},filter:'none',globalAlpha:1},
  humanoid(){baseCalls++;},line(){},rect(){},circle(){},polygon(){},glow(){},zoom:1.18
};
const document={
  createElement(){return {style:{},textContent:''};},head:{appendChild(){}},querySelectorAll(){return [];},getElementById(){return null;}
};
const player={gripCling:1,ledge:null,face:1,vy:0,anim:0,inv:0,hit:0,passives:new Set(['grip']),back:null,hand:null,hp:5,maxHp:8,money:0,bombs:4,cables:4,keys:[],ammo:0};
const ctx={window:{},document,Render:render,UI:{opacity:.62,size:1,clock:()=>"0:00",show(html){captured=html;},help(){},applyControls(){}},Game:{p:player,stage:1,seed:77,runTime:0,l:{modifier:'Nominal Systems'},pause(){},start(){}},item:{grip:{name:'Magnetic Grip Gloves',desc:'Hold UP against a wall to climb.',glyph:'⌁',color:'#64ebaf'}},console,Math,Set,Object,Array,String,Number};
vm.createContext(ctx);vm.runInContext(v016,ctx);
ctx.Render.humanoid(player,true);assert.equal(baseCalls,0,'grip frame must replace, not layer over, the previous humanoid renderer');
player.gripCling=0;ctx.Render.humanoid(player,true);assert.equal(baseCalls,1,'ordinary player frames must still reach the previous humanoid renderer');
ctx.UI.pause();assert(captured.includes('SECTOR STATUS'));assert(captured.includes('INVENTORY'));assert(captured.includes('SETTINGS'));

console.log('PASS v0.16 Magnetic Grip idle/moving visuals, retro pause pages, inventory descriptions, and camera zoom settings');
