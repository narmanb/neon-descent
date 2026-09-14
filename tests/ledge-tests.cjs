const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const context={window:{},console,Math,Set,Uint8Array};
context.UI={close(){},end(){},pause(){}};
context.Input={state:{},edges:{},reset(){this.state={};this.edges={}},down(a){return !!this.state[a]},axis(){return (+!!this.state.right)-(+!!this.state.left)},pressed(a){return !!this.edges[a]}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(root+'/src/core.js','utf8')+'\n'+fs.readFileSync(root+'/src/game.js','utf8')+'\n'+fs.readFileSync(root+'/src/ledge.js','utf8'),context);
const N=context.window.ND,G=context.window.Game,I=context.Input;
function arena(){
  G.start(77);G.l.tiles.fill(0);G.l.ladders.fill(0);G.l.platforms=[];G.l.traps=[];G.l.shops=[];G.l.doors=[];G.l.cables=[];G.entities=[];G.shots=[];
  const p=G.p;Object.assign(p,{x:400,y:404,ground:false,vy:0,vx:0,fallStart:404,inv:0,hp:8,cool:0,stun:0,h:28,crouch:false});I.reset();return p;
}
function hang(dir=1){
  const p=arena(),tx=15,top=12*32,wallEdge=dir===1?tx*32:(tx+1)*32;
  p.x=wallEdge-dir*(p.w/2+.1);p.y=top+p.h-8;p.face=dir;
  p.ledge={x:(tx+.5)*32,y:top-.01,dir,hangX:p.x,hangY:p.y,age:0,catchTime:0};
  N.setTile(G.l,tx,12,1);return p;
}
function tick(state={},edges={}){I.state=state;I.edges=edges;G.updatePlayer(1/60);I.edges={};}
{
  const p=hang(1),x=p.x,y=p.y;
  for(const state of [{up:true},{down:true},{left:true},{right:true},{}]){tick(state);assert(p.ledge);assert.equal(p.x,x);assert.equal(p.y,y);}
  console.log('PASS ledge remains latched until jump');
}
{
  const p=hang(1),x=p.x,y=p.y;tick({jump:true},{jump:true});
  assert.equal(p.ledge,null);assert.equal(p.x,x);assert.equal(p.y,y);assert(p.vx>0);assert(p.vy<0);assert.equal(p.ledgeAction,'climb');
  console.log('PASS neutral/toward jump launches physically instead of warping');
}
{
  const p=hang(1);tick({left:true,jump:true},{jump:true});
  assert.equal(p.ledge,null);assert(p.vx<0);assert(p.vy<0);assert.equal(p.ledgeAction,'away');
  console.log('PASS away + jump kicks away from ledge');
}
{
  const p=hang(1);tick({down:true,jump:true},{jump:true});
  assert.equal(p.ledge,null);assert.equal(p.vx,0);assert(p.vy>0);assert.equal(p.ledgeAction,'drop');
  console.log('PASS down + jump drops');
}
{
  const p=hang(1),tx=Math.floor(p.ledge.x/32);N.setTile(G.l,tx,11,1);tick({jump:true},{jump:true});
  assert(p.ledge);assert.equal(p.vx,0);assert.equal(p.vy,0);
  console.log('PASS blocked climb keeps player hanging');
}
