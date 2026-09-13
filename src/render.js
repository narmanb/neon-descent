'use strict';
const Render={
  canvas:null,ctx:null,w:960,h:480,scale:1,cache:{},t:0,
  init(){this.canvas=document.getElementById('game');this.ctx=this.canvas.getContext('2d',{alpha:false});this.resize();this.makeTiles();window.addEventListener('resize',()=>this.resize());},
  resize(){const d=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(innerWidth*d);this.canvas.height=Math.round(innerHeight*d);this.w=innerWidth/innerHeight*440;this.h=440;this.scale=this.canvas.height/440;},
  polygon(points,fill,stroke){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}},
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(x,y,w,h);},
  line(x,y,x2,y2,color,width=1){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();},
  circle(x,y,r,color,stroke){const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}},
  text(t,x,y,size=10,color='#a8c7d1',align='left'){const c=this.ctx;c.font=`600 ${size}px ui-monospace,monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(t,x,y);},
  glow(x,y,r,color){const c=this.ctx,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);},
  makeTiles(){
    const original=this.ctx;
    for(let t=1;t<=8;t++)for(let v=0;v<4;v++){
      let cv=document.createElement('canvas');cv.width=cv.height=32;this.ctx=cv.getContext('2d');const c=this.ctx;
      const base=t===6?'#1a2935':t===2?'#35465a':t===3?'#184751':t===4?'#253a43':t===7?'#374452':t===8?'#154963':'#293b4b';
      this.rect(0,0,32,32,'#0a1723');this.polygon([[1,4],[4,1],[28,1],[31,4],[31,28],[28,31],[4,31],[1,28]],base);
      this.line(4,2,28,2,t===2?'#7a8b9e':'#4f697a');this.line(2,5,2,27,'#415968');this.line(4,29,28,29,'#101f2b');
      if(t===1||t===6){
        this.rect(5,6,22,18,'#22313f');this.line(7,8,25,8,'#3c5363');this.line(7,23,25,23,'#14222f');
        if(v===0){for(let i=0;i<4;i++)this.line(8,11+i*3,24,11+i*3,'#152632');}
        else if(v===1){this.rect(8,11,4,9,'#3a5262');this.rect(17,11,6,2,'#52697a');this.rect(17,17,6,2,'#355d6c');}
        else if(v===2){this.line(8,12,16,20,'#4a6171');this.line(16,20,24,12,'#4a6171');this.circle(16,12,2,'#536a79');}
        else{this.rect(8,12,17,7,'#172b37');this.rect(10,14,4,2,'#68848a');}
      }else if(t===2){
        this.polygon([[4,4],[9,4],[28,23],[28,28],[23,28],[4,9]],'#627183');this.polygon([[23,4],[28,4],[28,9],[9,28],[4,28],[4,23]],'#46596c');
        this.rect(12,12,8,8,'#243545');this.circle(16,16,2,'#8496a1');
      }else if(t===3){
        this.rect(3,3,26,26,'#285969');this.line(4,4,28,4,'#8ec9d1');this.polygon([[4,4],[13,4],[28,19],[28,26]],'#377b89');this.line(5,26,26,5,'#6eabb5');
      }else if(t===4){
        this.rect(7,5,18,23,'#132a35');this.rect(11,7,10,19,'#be6a3e');this.rect(13,9,6,15,'#ffbf6a');for(let i=0;i<3;i++)this.rect(8,10+i*6,16,2,'#50616c');this.rect(5,3,22,3,'#7c8f94');
      }else if(t===5){
        this.rect(3,4,26,5,'#79857a');for(let x=4;x<29;x+=9)this.polygon([[x,4],[x+5,4],[x+1,9],[x-4,9]],'#bbaa65');this.line(4,13,12,17,'#111f28');this.line(12,17,8,27,'#111f28');this.line(12,17,25,22,'#111f28');
      }else if(t===7){
        this.rect(4,3,24,26,'#203140');this.line(16,3,16,29,'#0e1c28',2);for(let i=0;i<3;i++){this.rect(6,7+i*7,7,3,'#786054');this.rect(19,7+i*7,7,3,'#786054');}this.rect(12,12,8,8,'#0b1d2b');this.rect(15,14,2,4,'#ff9d68');
      }else{for(let x=4;x<30;x+=5)this.rect(x,2,2,28,'#50c7e3');}
      for(const [x,y] of [[4,4],[27,4],[4,27],[27,27]]){this.rect(x,y,2,2,t===3?'#89c9d1':'#667984');this.rect(x,y+2,2,1,'#0e1d29');}
      this.cache[t+'_'+v]=cv;
    }this.ctx=original;
  },
  drawItem(id,x,y,sz=1){
    const c=this.ctx,it=item[id];if(!it)return;c.save();c.translate(x,y);c.scale(sz,sz);
    const col=it.color;this.glow(0,-8,22,col+'1f');
    if(['jump','traction'].includes(id)){
      for(let i=-1;i<=1;i+=2){this.rect(i*6-3,-13,6,9,'#98a8b5');this.polygon([[i*6-3,-5],[i*6+4,-5],[i*6+7,-1],[i*6+7,2],[i*6-3,2]],col);this.rect(i*6-3,2,10,2,'#304555');}
    }else if(id==='grip'){for(let i=-1;i<=1;i+=2){this.polygon([[i*7-4,-12],[i*7+3,-12],[i*7+4,-4],[i*7,-1],[i*7-4,-5]],col);this.rect(i*7-2,-15,4,6,'#bccdd1');}}
    else if(it.slot==='back'){this.polygon([[-9,-17],[9,-17],[12,-10],[10,1],[-10,1],[-12,-10]],'#637685');this.rect(-6,-14,12,12,'#253b4d');this.circle(0,-8,4,col);this.rect(-13,-12,4,16,col);this.rect(9,-12,4,16,col);this.rect(-11,3,6,3,'#95b9c7');this.rect(5,3,6,3,'#95b9c7');}
    else if(it.slot==='hand'){
      if(id==='blade'){this.polygon([[-10,1],[8,-20],[12,-21],[11,-15],[-6,5]],'#dcfbff');this.line(-9,0,8,-18,col,2);this.line(-13,-1,-4,7,'#bd9274',3);}
      else if(id==='shield'){this.polygon([[-9,-18],[9,-18],[10,-2],[0,5],[-10,-2]],'#6d92a5');this.polygon([[-6,-14],[6,-14],[6,-3],[0,1],[-6,-3]],'#23566b');this.line(0,-12,0,-3,col,2);}
      else if(id==='disc'){this.circle(0,-7,12,'#738da0');this.circle(0,-7,8,'#233444',col);this.circle(0,-7,3,col);}
      else{this.polygon([[-14,-12],[9,-12],[13,-8],[10,-4],[-3,-4],[-5,4],[-10,4],[-8,-4],[-14,-4]],'#8293a1');this.rect(-10,-11,18,4,col);this.rect(9,-10,8,4,'#bfd4db');this.rect(-2,-15,4,3,'#475b6e');this.rect(-4,-8,7,3,'#293c4b');}
    }else if(id==='bombs'||id==='bombcrate'){this.circle(-4,-5,8,'#708896');this.circle(-4,-5,4,'#fea76e');this.rect(-7,-16,6,5,'#acc5c9');this.circle(8,-4,6,'#6d7f8c');this.circle(8,-4,3,'#ffb36a');}
    else if(id==='cables'){this.circle(0,-7,11,'#32586b','#84cedb');this.circle(0,-7,7,null,'#65aabc');this.circle(0,-7,3,'#98f1fc');this.line(-10,-17,10,-17,'#abc9d0',3);}
    else if(id==='health'){this.rect(-7,-16,14,18,'#d5e2df');this.rect(-8,-18,16,3,'#82a69e');this.rect(-2,-13,4,12,'#38bca0');this.rect(-5,-9,10,4,'#38bca0');}
    else {this.polygon([[-9,-15],[6,-15],[11,-10],[11,0],[-6,0],[-11,-5]],'#557488');this.rect(-7,-12,14,9,'#192f40');this.text(it.glyph,0,-4,11,col,'center');this.line(-6,3,6,3,col,2);}
    c.restore();
  },
  humanoid(e,player=true){
    const c=this.ctx,t=e.anim||e.age||this.t,dir=player?e.face:e.dir,ground=e.ground,walk=Math.abs(e.vx)>15&&ground&&!e.climb,cyc=t*(player?14:11),stride=walk?Math.sin(cyc)*5:0;
    c.save();c.translate(e.x,e.y);c.scale(dir,1);
    if(player&&e.inv>0&&Math.floor(this.t*18)%2)c.globalAlpha=.5;
    if(e.hit>0)c.filter='brightness(1.8)';
    let crouch=e.crouch?7:0,bob=walk?Math.abs(Math.sin(cyc))*1.5:Math.sin(t*2)*.6;
    c.translate(0,crouch+bob);
    const armor=player?'#d9d4bb':'#bcb4c0',dark=player?'#436170':'#545061',glow=player?'#72eafb':'#ff7592';
    this.line(-4,-12,-5-stride,-4, dark,5);this.line(4,-12,5+stride,-4,dark,5);
    if(!ground&&!e.climb){this.line(-4,-12,-8,-7,dark,5);this.line(4,-12,8,-3,dark,5);}
    const boot=player&&(e.passives.has('jump')||e.passives.has('traction'))?'#62d7b9':'#bd9374';
    this.rect(-8-stride,-5,8,4,boot);this.rect(2+stride,-5,8,4,boot);
    if(player&&e.back){this.rect(-11,-24,5,15,'#728b9b');this.rect(-12,-21,3,7,item[e.back].color);}
    this.polygon([[-7,-25],[5,-25],[9,-19],[6,-12],[-6,-12],[-9,-19]],armor);
    this.rect(-4,-22,8,7,dark);this.rect(-3,-21,6,2,glow);this.rect(-6,-13,13,3,'#263d50');this.rect(-3,-13,3,3,'#ffaf72');
    let armY=e.attack>0?-20:e.climb?-27:player&&e.held?-29:-15,armX=e.attack>0?16:e.climb?5:player&&e.held?12:7+stride*.6;
    this.line(5,-22,armX,armY,dark,5);this.circle(armX,armY,2.7,player&&e.passives.has('grip')?'#73e0b6':armor);
    this.polygon([[-7,-35],[3,-37],[9,-33],[10,-26],[5,-23],[-6,-25],[-9,-30]],armor);
    this.polygon([[-3,-33],[8,-32],[8,-27],[-2,-27]],'#163644');this.line(0,-30,8,-30,glow,2);this.rect(-8,-31,3,6,dark);
    this.rect(-5,-37,6,2,'#f1ede0');
    if(player&&e.hand&&!e.held){c.save();c.translate(13,-14);c.scale(.62,.62);this.drawItem(e.hand,0,0);c.restore();}
    if(!player){this.rect(8,-21,18,5,'#9c899c');this.rect(23,-20,6,3,'#f5adc4');}
    if(e.attack>0&&player&&!['shotgun','cryo','bolt','foam','phase','disc'].includes(e.hand)){
      c.globalAlpha=e.attack/.22;const reach=e.hand==='blade'?64:38;
      this.line(13,-19,reach,-25,'#bcfbff',3);this.line(20,-15,reach-7,-12,'#4acbdc',2);this.polygon([[15,-26],[reach,-30],[reach+4,-24],[25,-22]],'#a2ffff6f');
    }
    if(player&&(e.back==='glide'&&Input.down('jump')&&e.vy>0||e.decel>0)){
      this.line(-4,-25,-21,-48,'#87b9d2');this.line(5,-25,22,-48,'#87b9d2');this.polygon([[-28,-45],[-20,-54],[0,-60],[20,-54],[28,-45],[8,-48],[0,-45],[-8,-48]],'#83c5e0c0');this.line(-20,-53,20,-53,'#c3f7ff');
    }
    c.restore();
  },
  enemy(e){
    if(e.type==='merchant'){this.humanoid(e,false);if(Game.l.shops[e.shop]?.angry)this.text('!',e.x,e.y-47,15,'#ff678d','center');return;}
    const c=this.ctx,t=e.age,phase=e.idle,elect=e.type==='slug';c.save();c.translate(e.x,e.y);if(e.phased)c.globalAlpha=.15;if(e.hit>0)c.filter='brightness(1.8)';
    let bob=Math.sin(t*7+phase)*1.4;
    const color=e.freeze>0?'#a9edff':e.foam>0?'#ca9fdd':elect?'#91a59b':e.type==='enforcer'?'#a6a0ad':'#a3b1b7',accent=elect?'#bcf080':e.type==='phase'?'#c597ff':'#ff987b';
    if(['flyer','detonator','phase'].includes(e.type)){
      this.line(-18,-18,-9,-13,'#657986',3);this.line(18,-18,9,-13,'#657986',3);this.rect(-24,-21,13,3,'#768d9e');this.rect(11,-21,13,3,'#768d9e');
      this.line(-27+Math.sin(t*40)*3,-24,-9,-24,'#b3d8e1');this.line(9,-24,27+Math.cos(t*40)*3,-24,'#b3d8e1');
      this.polygon([[-12,-20],[0,-25],[12,-20],[10,-8],[0,-4],[-10,-8]],color);this.circle(0,-15,6,'#243a4c');this.circle(0,-15,3,e.primed&&Math.floor(t*16)%2?'#fff':accent);this.line(-6,-5,-9,-1,'#70c5df',2);this.line(6,-5,9,-1,'#70c5df',2);
    }else if(e.type==='slug'){
      for(let i=0;i<4;i++){this.circle(-10+i*6,-7+Math.sin(t*4+i)*2,7,color);this.circle(-10+i*6,-8+Math.sin(t*4+i)*2,2,'#cbec87');}
      this.line(9,-13,11,-20,'#b1c48f',2);this.circle(12,-20,2,'#e0ff99');this.glow(0,-10,24,'#b0e58028');
    }else if(e.type==='sentry'){
      this.polygon([[-13,0],[-9,-8],[9,-8],[13,0]],'#687d8b');this.rect(-6,-17,12,11,color);this.circle(0,-20,9,'#728b9a');this.rect(e.dir>0?0:-21,-23,22,6,'#b8c6c7');this.circle(0,-20,4,accent);
    }else if(e.type==='enforcer'){
      this.line(-7,-15,-9+Math.sin(t*9)*4,-3,'#6b7786',7);this.line(7,-15,9-Math.sin(t*9)*4,-3,'#6b7786',7);this.polygon([[-15,-31],[12,-31],[15,-15],[9,-10],[-10,-10],[-16,-20]],color);this.rect(-9,-29,18,13,'#545968');this.rect(-6,-26,12,3,accent);this.rect(-9,-40,18,10,'#8b94a0');this.rect(-5,-36,12,3,'#ffc38f');
    }else if((e.type==='mimic'||e.type==='burrow')&&!e.active){this.crate(0,0,e.type==='burrow');}
    else{
      for(let i=-1;i<=1;i++)for(let d of [-1,1]){let stride=Math.sin(t*12+i*2)*4;this.line(d*6,-10,d*(12+i*2),-5+stride,'#7f96a3',2);this.line(d*(12+i*2),-5+stride,d*(16+i*2),-1,'#9cacb2',2);}
      this.polygon([[-11,-15],[-6,-23],[6,-23],[12,-15],[10,-7],[-10,-7]],color);this.rect(-6,-20,12,8,'#425b6a');this.rect(e.dir>0?3:-9,-16,6,4,accent);this.rect(-4,-24,8,3,'#d2d5c9');
    }
    if(e.freeze>0)this.polygon([[-15,-29],[0,-35],[16,-24],[15,1],[-13,3],[-17,-16]],'#b4f3ff55','#befbff');
    if(e.foam>0){for(let i=0;i<4;i++)this.circle(-12+i*8,-2,7,'#cba1dec0');}
    if(e.stun>0){this.text('· ✦ ·',0,-34,11,'#e9e3ad','center');}
    c.restore();
    if(e.hp<e.maxHp){this.rect(e.x-12,e.y-e.h-12,24,2,'#384a58');this.rect(e.x-12,e.y-e.h-12,24*e.hp/e.maxHp,2,'#ffa881');}
  },
  crate(x,y,burrow=false){this.polygon([[x-11,y-20],[x+9,y-20],[x+12,y-17],[x+12,y-2],[x+9,y],[x-11,y],[x-13,y-4],[x-13,y-17]],burrow?'#697781':'#958b75');this.rect(x-9,y-17,17,14,'#354651');this.line(x-8,y-16,x+7,y-4,'#84948f',3);this.line(x+7,y-16,x-8,y-4,'#84948f',3);this.rect(x-3,y-13,6,7,'#e5c584');},
  trap(t){
    const c=this.ctx,x=t.x,y=t.y;if(t.dead)return;
    if(t.type==='mine'){this.polygon([[x-12,y],[x-10,y-7],[x+10,y-7],[x+12,y]],'#7b8389');this.circle(x,y-7,3,t.armed!==undefined?'#fff4aa':'#ff887b');if(t.armed!==undefined)this.glow(x,y-7,32,'#ff665540');}
    else if(t.type==='spikes'){this.rect(x-16,y-5,32,5,'#3f4d59');for(let i=0;i<4;i++)this.polygon([[x-16+i*8,y-3],[x-12+i*8,y-(t.active?22:7)],[x-8+i*8,y-3]],'#ffb5a0');}
    else if(t.type==='electric'){this.rect(x-15,y-5,30,5,'#697e89');if(t.active){this.glow(x,y-10,33,'#99cfff30');this.line(x-15,y-5,x-6,y-13,'#a7e0ff',2);this.line(x-6,y-13,x+3,y-6,'#a7e0ff',2);this.line(x+3,y-6,x+14,y-11,'#a7e0ff',2);}}
    else if(t.type==='turret'){this.rect(x-10,y-19,20,17,'#747f8e');this.rect(x-16,y-17,32,5,'#dda496');this.circle(x,y-12,4,'#ec9f84');}
    else if(t.type==='laser'){this.rect(x-5,y-26,10,26,'#647b8d');this.circle(x,y-12,4,'#ff7895');if(t.active){this.line(x-70,y-12,x+70,y-12,'#ff659584',5);this.line(x-70,y-12,x+70,y-12,'#ffd6de',1);}}
    else if(t.type==='crusher'){let hy=t.headY||y-100;this.line(x-8,y-112,x-8,hy,'#647785',5);this.line(x+8,y-112,x+8,hy,'#647785',5);this.rect(x-22,hy,44,18,'#738391');this.rect(x-22,hy+12,44,6,'#d8b776');for(let i=0;i<4;i++)this.line(x-20+i*12,hy+18,x-14+i*12,hy+12,'#374650',3);}
  },
  backdrop(l,camX,camY){
    const c=this.ctx;let g=c.createLinearGradient(0,0,0,this.h);g.addColorStop(0,'#071725');g.addColorStop(1,'#0c2431');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);
    c.save();c.translate(-camX*.18,-camY*.12);
    for(let y=-400;y<1400;y+=190)for(let x=-300;x<2000;x+=210){
      this.rect(x,y,110,148,'#0d2c3b');this.rect(x+9,y+8,92,128,'#0b2232');this.line(x+8,y+148,x+108,y+148,'#244553',2);
      for(let i=0;i<5;i++)this.rect(x+20,y+20+i*20,65,4,i%2?'#163d4c':'#174656');
      this.rect(x+140,y-10,8,220,'#163647');this.rect(x+143,y-10,2,220,'#285061');this.glow(x+55,y+65,100,'#1ca4b50a');
    }c.restore();
  },
  world(){
    const c=this.ctx,l=Game.l,p=Game.p;if(!l||!p)return;
    const shake=Game.shake,camX=clamp(Game.cam.x-this.w/2,-12,C.cols*32-this.w+12),camY=clamp(Game.cam.y-this.h/2,-14,C.rows*32-this.h+12);
    this.backdrop(l,camX,camY);c.save();c.translate(-Math.round(camX)+(Math.random()-.5)*shake,-Math.round(camY)+(Math.random()-.5)*shake);
    const minX=Math.max(0,Math.floor(camX/32)),maxX=Math.min(C.cols-1,Math.ceil((camX+this.w)/32)),minY=Math.max(0,Math.floor(camY/32)),maxY=Math.min(C.rows-1,Math.ceil((camY+this.h)/32));
    for(const d of l.decor){if(d.x<camX-150||d.x>camX+this.w+150||d.y<camY-120||d.y>camY+this.h+120)continue;
      const x=d.x,y=d.y;this.line(x-55,y-35,x-55,y+60,'#2e4e5d',5);this.line(x-53,y-35,x-53,y+60,'#456576');this.line(x-55,y+60,x+20,y+60,'#2e4e5d',5);
      if(d.kind===0){this.rect(x-20,y,64,30,'#122d3e');this.rect(x-17,y+3,58,24,'#184251');for(let i=0;i<5;i++){this.rect(x-12,y+7+i*4,12+(i*7)%29,1,'#5fabb375');}this.rect(x+18,y+10,17,11,'#2e6470');this.text('SYS',x+21,y+18,6,'#99c3c5');}
      else if(d.kind===1){this.circle(x+12,y+18,25,'#233f4e');this.circle(x+12,y+18,20,'#122b3a');c.save();c.translate(x+12,y+18);c.rotate(this.t*.7);for(let a=0;a<4;a++){c.rotate(Math.PI/2);this.polygon([[0,0],[4,-17],[12,-12],[10,-3]],'#3a5866');}c.restore();this.circle(x+12,y+18,4,'#647c86');}
      else if(d.kind===2){this.rect(x-8,y-10,38,48,'#203f4d');for(let i=0;i<3;i++){this.rect(x-3+i*10,y-5,5,36,'#345e65');this.rect(x-2+i*10,y+4+Math.sin(this.t+i)*5,3,13,'#70e1c452');}this.text('CRYO',x+12,y+48,7,'#557c8d','center');}
      else{this.text('01',x,y+25,34,'#31505d');this.text('RESEARCH DIVISION',x,y+39,6,'#537789');}
      this.rect(x-10,y-27,44,3,'#517c88');this.rect(x-4,y-26,31,2,'#9be8e1');this.glow(x+12,y-24,65,'#5fe4d816');
    }
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      if(l.ladders[y*C.cols+x]){this.line(x*32+9,y*32,x*32+9,y*32+32,'#42697b',3);this.line(x*32+23,y*32,x*32+23,y*32+32,'#42697b',3);for(let i=0;i<3;i++)this.line(x*32+9,y*32+4+i*11,x*32+23,y*32+4+i*11,'#9cb6bd',2);}
      const t=tileAt(l,x,y);if(!t)continue;c.drawImage(this.cache[t+'_'+((x*13+y*7)%4)],x*32,y*32);
      if(!solid(l,x,y-1)){this.rect(x*32,y*32,32,2,t===2?'#9bacb3':'#6d8d99');this.rect(x*32+3,y*32+3,26,1,'#415f6e');}
      if(t===4){this.glow(x*32+16,y*32+16,50,'#ffac5528');this.rect(x*32+14,y*32+10,4,Math.sin(this.t*5)>0?12:9,'#ffe3a4');}
    }
    for(const q of l.shops){
      this.rect(q.x+5,q.y+2,q.w-10,19,'#122d3e');this.line(q.x+5,q.y+21,q.x+q.w-5,q.y+21,q.angry?'#ff7192':'#eac386',2);this.text(q.angry?'SIGNAL FLAGGED / WANTED':q.name,q.x+q.w/2,q.y+15,9,q.angry?'#ff8b9f':'#e8ca98','center');
      this.glow(q.x+q.w/2,q.y+70,125,q.angry?'#fb638416':'#f0c3760a');
    }
    for(const s of l.secrets){this.rect(s.x-12,s.y-32,24,2,'#b4936860');if(p.passives.has('optics')){this.glow(s.x,s.y,45,'#b79aff30');this.text('◇ CACHE',s.x,s.y-35,8,'#ccaaff','center');}}
    for(const rope of l.cables){let bottom=Math.min(rope.bottom,rope.top+rope.age*500);this.line(rope.x,rope.top,rope.x,bottom,'#416c85',5);this.line(rope.x,rope.top,rope.x,bottom,'#97ecf4',1);for(let y=rope.top;y<bottom;y+=14)this.rect(rope.x-4,y,8,2,'#81dbea');this.polygon([[rope.x-11,rope.top+4],[rope.x-6,rope.top-3],[rope.x+6,rope.top-3],[rope.x+11,rope.top+4]],'#c3dae0');}
    for(const platform of l.platforms){this.rect(platform.x,platform.y,platform.w,7,'#668796');this.rect(platform.x+3,platform.y+2,platform.w-6,2,'#6de3ee');this.rect(platform.x+5,platform.y+7,platform.w-10,4,'#203d4d');}
    for(const [d,label,col] of [[l.entrance,'ENTRY','#739da9'],[l.exit,Game.stage===4?'EXTRACT':'TRANSIT','#69ead3']]){
      const x=d.x,y=d.y;this.polygon([[x-25,y],[x-25,y-49],[x-16,y-58],[x+16,y-58],[x+25,y-49],[x+25,y]],'#425f6a');this.rect(x-19,y-49,38,49,'#102a39');this.rect(x-16,y-45,32,45,'#1b4e52');this.line(x,y-42,x,y-2,'#356c6c');this.line(x-19,y-47,x-19,y-3,col,2);this.line(x+19,y-47,x+19,y-3,col,2);this.text(label,x,y-64,8,col,'center');this.line(x-6,y-23,x,y-17,col,2);this.line(x,y-17,x+6,y-23,col,2);this.glow(x,y-20,63,col+'1b');
    }
    for(const t of l.traps)this.trap(t);
    for(const e of Game.entities){
      if(e.dead||e.x<camX-70||e.x>camX+this.w+70||e.y<camY-70||e.y>camY+this.h+70)continue;
      if(e.kind==='enemy'){this.enemy(e);continue;}
      const x=e.x,y=e.y+(e.kind==='item'&&!e.held?Math.sin(this.t*3+e.idle)*2:0);
      if(e.kind==='item'){this.drawItem(e.id,x,y-3,.8);if(e.shop!==undefined){this.rect(x-20,y+3,40,12,'#0d2435e8');this.text('¤'+e.price,x,y+12,8,'#ffd38c','center');}}
      else if(e.kind==='coin'){
        c.save();c.translate(x,y-8);c.scale(.7+Math.abs(Math.sin(this.t*2+e.idle))*.3,1);this.polygon([[0,-7],[6,-3],[6,4],[0,8],[-6,4],[-6,-3]],'#e6b56b');this.polygon([[0,-4],[3,-2],[3,2],[0,4],[-3,2],[-3,-2]],'#fff0b0');c.restore();
      }else if(e.kind==='crate')this.crate(x,y);
      else if(e.kind==='key'){this.rect(x-9,y-17,18,12,'#719dae');this.rect(x-6,y-14,7,4,'#b6f0eb');this.rect(x+3,y-14,3,7,'#eac081');this.text(e.id,x,y-23,7,'#9dd7d9','center');}
      else if(e.kind==='switch'){this.rect(x-11,y-25,22,25,'#415c72');this.rect(x-8,y-22,16,12,'#122a3e');this.circle(x,y-16,4,e.on?'#77878b':'#7df0f1');this.rect(x-6,y-6,12,3,e.on?'#77938b':'#eabe87');this.text('RELAY',x,y-32,7,'#81b8c6','center');}
      else if(e.kind==='bomb'){this.circle(x,y-5,6,'#6c91a2');this.circle(x,y-5,3,Math.floor(e.fuse*10)%2?'#ffbb77':'#ff6e68');this.glow(x,y-5,22,'#ff8c6330');this.rect(x-2,y-14,4,4,'#efc893');}
      else if(e.kind==='boltPickup'){this.line(x-9,y-6,x+9,y-6,'#ddc4a0',2);this.line(x+5,y-9,x+9,y-6,'#fbdeae',2);}
    }
    if(!p.dead)this.humanoid(p);
    for(const s of Game.shots){let color=s.type==='cryo'?'#a2f0ff':s.type==='foam'?'#dca9ed':'#ffd197';if(s.type==='disc'){c.save();c.translate(s.x,s.y);c.rotate(this.t*18);this.drawItem('disc',0,7,.7);c.restore();}else{this.line(s.x-s.vx*.015,s.y-s.vy*.015,s.x,s.y,color,3);this.circle(s.x,s.y,2,'#fff2de');}}
    for(const q of Game.particles){c.globalAlpha=Math.min(1,q.life*3);this.rect(q.x,q.y,q.size,q.size,q.color);}c.globalAlpha=1;
    for(const q of Game.rings){const progress=1-q.life/q.total;c.globalAlpha=1-progress;this.glow(q.x,q.y,q.r*(.3+progress),q.electric?'#95dcff88':'#ffc478aa');c.lineWidth=2+5*(1-progress);this.circle(q.x,q.y,q.r*progress,null,q.electric?'#a9e9ff':'#fff0c6');}c.globalAlpha=1;
    for(const t of Game.texts){c.globalAlpha=Math.min(1,t.life*2);this.text(t.t,t.x,t.y,12,t.color,'center');}c.globalAlpha=1;
    if(Game.warden){const w=Game.warden;this.glow(w.x,w.y,80,'#c590ff44');for(let i=0;i<5;i++){this.line(w.x-20+i*10,w.y,w.x-30+i*14+Math.sin(this.t*3+i)*14,w.y+60,'#b8a0ff66',5);}this.polygon([[w.x,w.y-38],[w.x+29,w.y-10],[w.x+18,w.y+20],[w.x,w.y+27],[w.x-18,w.y+20],[w.x-29,w.y-10]],'#b5a2ff88');this.line(w.x-15,w.y-5,w.x+15,w.y-5,'#fff',3);}
    c.restore();
    if(l.modifier==='Power Failure'&&!p.passives.has('optics')){
      const g=c.createRadialGradient(p.x-camX,p.y-15-camY,45,p.x-camX,p.y-15-camY,240);g.addColorStop(0,'transparent');g.addColorStop(.6,'#030a1a65');g.addColorStop(1,'#030918dc');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);
    }
    if(Game.warned){this.rect(0,0,this.w,3,'#ff5d87');}
    if(p.passives.has('scanner')){const angle=Math.atan2(l.exit.y-p.y,l.exit.x-p.x);c.save();c.translate(this.w/2,64);c.rotate(angle);this.polygon([[10,0],[-5,-5],[-3,0],[-5,5]],'#6eead5');c.restore();this.text('LIFT '+Math.round(dist(p,l.exit)/32)+'m',this.w/2,84,8,'#8fdfd3','center');}
  },
  frame(dt){this.t+=dt;const c=this.ctx;c.setTransform(this.scale,0,0,this.scale,0,0);c.imageSmoothingEnabled=false;this.world();}
};
