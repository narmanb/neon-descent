const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'..');
const I={state:{},edges:{},reset(){this.state={};this.edges={}},down(a){return !!this.state[a]},axis(){return (+!!this.state.right)-(+!!this.state.left)},pressed(a){return !!this.edges[a]}};
const ctx={window:{},console,Math,Set,Uint8Array,Input:I,UI:{close(){},end(){}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/src/core.js','utf8')+'\n'+fs.readFileSync(root+'/src/genpolish.js','utf8')+'\n'+fs.readFileSync(root+'/src/game.js','utf8'),ctx);const G=ctx.window.Game,N=ctx.window.ND;
const outcomes=[];
for(let seed=1;seed<=64;seed++){
 G.start(seed);G.entities=[];G.l.traps=[];let row=0,phase='walk',jumpHold=0,frames=0,failed='';
 for(;frames<9000&&row<4;frames++){
  const p=G.p,s=G.l.route[row],tx=row===3?G.l.exit.x:(s.shaft+.5)*32,dx=tx-p.x;I.state={};I.edges={};
  if(phase==='walk'){
   if(Math.abs(dx)<3){if(row===3){row++;break;}phase='descend';}
   else {I.state[dx>0?'right':'left']=true;
    if(p.ground&&N.blocked(G.l,p.x+Math.sign(dx)*14,p.y,p.w,p.h)){I.edges.jump=true;jumpHold=28;}
    if(jumpHold>0){I.state.jump=true;jumpHold--;}if(p.ledge)I.state.up=true;
   }
  }
  if(phase==='descend'){
   I.state.down=true;if(Math.abs(dx)>2)I.state[dx>0?'right':'left']=true;
   if(p.y>=(s.floor+8)*32-3){row++;phase='walk';}
  }
  G.step(1/60);
  if(G.mode==='dead'){failed='died';break;}
 }
 outcomes.push({seed,pass:row===4&&G.p.bombs===4&&G.p.cables===4&&G.p.hp===5,frames,hp:G.p.hp,row,phase,x:G.p.x,y:G.p.y,failed});
}
const failed=outcomes.filter(x=>!x.pass);fs.writeFileSync(root+'/tests/traversal-results.json',JSON.stringify({passed:outcomes.length-failed.length,failed:failed.length,outcomes},null,2));console.log({passed:outcomes.length-failed.length,failed:failed.length,examples:failed.slice(0,6)});if(failed.length)process.exitCode=1;
