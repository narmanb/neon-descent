const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const I={state:{},edges:{},analog:{x:0,y:0},reset(){this.state={};this.edges={};this.analog={x:0,y:0}},down(a){return !!this.state[a]},pressed(a){return !!this.edges[a]},axis(){const d=(+!!this.state.right)-(+!!this.state.left);return Math.abs(this.analog.x)>.02?this.analog.x:d}};
const ctx={window:{},console,Math,Set,Uint8Array,Input:I,UI:{close(){},end(){}}};vm.createContext(ctx);
const src=['core','genpolish','game','grip','ledge','climbpolish','v015polish'].map(n=>fs.readFileSync(root+'/src/'+n+'.js','utf8')).join('\n');
vm.runInContext(src,ctx);
const G=ctx.window.Game,N=ctx.window.ND;

function arena(){
  G.start(915);G.entities=[];G.shots=[];G.l.tiles.fill(0);G.l.ladders.fill(0);G.l.platforms=[];G.l.traps=[];G.l.shops=[];G.l.doors=[];G.l.cables=[];
  for(let x=0;x<N.C.cols;x++){G.l.tiles[20*N.C.cols+x]=1;G.l.tiles[33*N.C.cols+x]=6;}
  const cableX=20*32+16;G.l.cables.push({x:cableX,top:300,bottom:640,age:10});
  Object.assign(G.p,{x:cableX,y:500,vx:0,vy:0,ground:false,platform:null,fallStart:500,inv:0,hp:8,stun:0,climb:false,gripCling:0,ledge:null,coyote:0,jumpBuffer:0,climbRegrabLock:0,gripRegrabLock:0,_climbAnalogUpStrong:false,climbSurface:null,climbCableX:null});
  I.reset();return {p:G.p,cableX};
}
function update(state={},edges={},analog={x:0,y:0},frames=1){I.state=state;I.edges=edges;I.analog=analog;for(let i=0;i<frames;i++){G.updatePlayer(1/60);I.edges={};}}

{
  const {p,cableX}=arena();p.y=640-.001;p.ground=true;p.x=cableX-10;
  update({right:true});
  assert.equal(p.climb,false,'walking horizontally through a grounded Mag-Cable must not auto-grab');
  assert(p.vx>20,'grounded horizontal movement should remain normal beside a Mag-Cable');
}
{
  const {p}=arena();update({up:true},{up:true});
  assert.equal(p.climb,true,'fresh deliberate UP while overlapping a Mag-Cable should attach');
  assert.equal(p.climbSurface,'cable','attached Mag-Cable should be tagged for the cable-specific pose');
}
{
  const {p}=arena();update({up:true,right:true},{},{x:.7,y:-.4});
  assert.equal(p.climb,false,'weak upward analog drift must not attach to a Mag-Cable');
}
{
  const {p}=arena();update({up:true},{},{x:.12,y:-.82});
  assert.equal(p.climb,true,'strong deliberate upward analog input should attach to a Mag-Cable');
  assert.equal(p.climbSurface,'cable');
}
{
  const {p,cableX}=arena();Object.assign(p,{x:cableX,y:500,climb:true,climbSurface:'cable'});
  update({right:true},{},{x:0,y:0},12);
  assert.equal(p.climb,true,'left/right alone should not slide a midair player off a Mag-Cable');
  assert(Math.abs(p.x-cableX)<1,'midair cable attachment should suppress casual horizontal drift');
}
{
  const {p,cableX}=arena();Object.assign(p,{x:cableX,y:640-.001,ground:true,climb:true,climbSurface:'cable',coyote:.1});
  update({right:true});
  assert.equal(p.climb,false,'grounded player at the cable bottom should walk away normally');
  assert(p.vx>20,'bottom-of-cable walkoff should preserve normal horizontal movement');
}
{
  const {p}=arena();Object.assign(p,{climb:true,climbSurface:'cable'});
  update({right:true,jump:true},{jump:true});
  assert.equal(p.climb,false,'direction + jump should detach from a Mag-Cable');
  assert(p.vx>N.C.speed*.9,'cable jump-off should keep full horizontal jump momentum');
  assert(p.vy<-N.C.jump*.9,'cable jump-off should keep full normal upward jump momentum');
  assert(p.climbRegrabLock>.1,'cable jump-off should start re-grab protection');
  update({up:true},{up:true});
  assert.equal(p.climb,false,'re-grab lockout should prevent immediate Mag-Cable reattachment');
}

const visual=fs.readFileSync(root+'/src/v015polish.js','utf8');
assert(visual.includes('drawCableClimber'),'v0.15 must contain a dedicated cable climber renderer');
assert(visual.includes('leftHandX=contactX-2,rightHandX=contactX+2'),'cable hands must stay clasped together at the overhead contact point');
assert(visual.includes('movementTrail'),'moving cable pose must have a localized electrical trail');
assert(visual.includes('if(cableClimb){drawCableClimber(e,cable);return;}'),'cable pose must replace, not layer over, the normal humanoid renderer');
console.log('PASS v0.15 Mag-Cable attachment, walkoff, jump/re-grab, and dedicated visual pose regressions');
