'use strict';
Object.assign(window,{ND});
const {C,TILE,ITEMS,item,rng,clamp,approach,dist,tileAt,setTile,solid,blocked,body,move,ladder,generate}=ND;
const Game = {
  mode:'title',time:0,stage:1,seed:0,runTime:0,kills:0,wanted:false,cam:{x:0,y:0},shake:0,
  entities:[],shots:[],particles:[],rings:[],texts:[],messages:[],p:null,l:null,audio:null,muted:false,
  start(seed){
    this.seed=seed===undefined?(Math.random()*0xffffffff)>>>0:seed>>>0;
    this.stage=1;this.runTime=0;this.kills=0;this.wanted=false;
    this.p=Object.assign(body(0,0),{hp:5,maxHp:8,bombs:4,cables:4,money:0,face:1,passives:new Set(),back:null,hand:null,ammo:0,keys:[],fuel:1,inv:0,attack:0,cool:0,climb:false,coyote:0,jumpBuffer:0,held:null,drop:0,anim:0});
    this.loadStage();this.mode='play';UI.close();Input.reset();this.sound('start');
  },
  loadStage(){
    this.l=generate(this.seed,this.stage);this.entities=[];this.shots=[];this.particles=[];this.rings=[];this.texts=[];this.time=0;this.warden=null;this.warned=false;
    Object.assign(this.p,{x:this.l.entrance.x,y:this.l.entrance.y-.01,vx:0,vy:0,ground:true,fallStart:this.l.entrance.y,inv:1.5,climb:false,ledge:null,held:null,fuel:1,drop:0});
    this.l.spawns.forEach(s=>this.spawn(s));
    if(this.wanted)this.l.shops.forEach(s=>{s.angry=true;});
    this.cam={x:this.p.x,y:this.p.y-60};
    this.message('SECTOR 01 / '+String(this.stage).padStart(2,'0')+'  ·  '+this.l.modifier,4);
    if(this.stage===1)this.message('Find the lift below. UP / DOWN climbs ladders. USE interacts.',7);
  },
  spawn(s){
    const e=Object.assign(body(s.x,s.y,s.kind==='enemy'?22:18,s.kind==='enemy'?26:18),{age:0,idle:Math.random()*6,dead:false,hit:0,stun:0,freeze:0,foam:0,dir:Math.random()<.5?-1:1,cool:1},s);
    if(s.kind==='enemy'){
      e.hp=({crawler:2,skitter:2,flyer:2,slug:3,sentry:3,burrow:3,enforcer:6,detonator:1,phase:3,mimic:3,merchant:14})[s.type]||2;
      e.maxHp=e.hp;e.homeX=e.x;e.homeY=e.y;e.active=s.type!=='mimic'&&s.type!=='burrow';
      if(s.type==='merchant'){e.h=34;e.w=24;e.dir=-1;}
    }
    if(s.kind==='crate')e.hp=2;
    if(s.kind==='bomb'){e.fuse=s.fuse||2.4;e.w=e.h=10;}
    this.entities.push(e);return e;
  },
  message(t,duration=2.5){this.messages.push({t,life:duration,total:duration});if(this.messages.length>3)this.messages.shift();},
  float(t,x,y,color='#bffcf4'){this.texts.push({t,x,y,life:1.4,color});},
  fx(x,y,color,n=12,power=110){
    for(let i=0;i<n;i++){if(this.particles.length>=C.maxParticles)this.particles.shift();let a=Math.random()*Math.PI*2,v=(.2+Math.random())*power;
      this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.25+Math.random()*.65,color,size:1+Math.random()*3});}
  },
  initAudio(){
    if(!this.audio){try{this.audio=new(window.AudioContext||window.webkitAudioContext)();this.master=this.audio.createGain();this.master.gain.value=this.muted?0:.16;this.master.connect(this.audio.destination);}catch(e){return;}}
    this.audio.resume().catch(()=>{});
  },
  tone(freq,length=.1,type='square',vol=.25,end=80){
    if(!this.audio||this.muted)return;const a=this.audio,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(freq,a.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),a.currentTime+length);
    g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+length);o.connect(g);g.connect(this.master);o.start();o.stop(a.currentTime+length);
  },
  sound(type){
    const sounds={jump:[240,.14,'triangle',.4,520],land:[95,.06,'triangle',.4,40],hit:[150,.15,'sawtooth',.3,40],coin:[850,.1,'sine',.35,1500],pickup:[440,.25,'triangle',.5,1100],shot:[180,.15,'sawtooth',.5,40],attack:[350,.12,'triangle',.4,70],bomb:[70,.65,'sawtooth',1,22],door:[180,.25,'square',.2,520],cable:[550,.2,'triangle',.25,220],alarm:[880,.45,'square',.25,440],start:[220,.5,'triangle',.4,880],step:[65,.025,'triangle',.13,40],ui:[650,.07,'sine',.25,900],freeze:[1400,.24,'sine',.4,400]};this.tone(...(sounds[type]||sounds.ui));
  },
  damage(target,amount,sx,sy,source='world',blast=false){
    if(target.dead||target.inv>0)return false;
    const player=target===this.p;
    if(target.type==='merchant'&&source==='player')this.anger(target.shop);
    if(!player&&target.type==='phase'&&target.phased)return false;
    if(!player&&target.type==='enforcer'&&Math.sign(sx-target.x)===target.dir&&!blast&&!target.freeze)amount=Math.max(1,Math.floor(amount/2));
    if(target.freeze>0){amount+=4;this.fx(target.x,target.y-15,'#a3efff',18);}
    target.hp-=amount;target.hit=.18;target.stun=player?.24:.6;target.vx=Math.sign(target.x-sx||1)*(player?180:230);target.vy=-155;
    if(player){target.inv=1.3;target.climb=false;target.ledge=null;this.shake=Math.max(this.shake,5);this.sound('hit');}
    this.float('-'+amount,target.x,target.y-35,player?'#ff797f':'#fff2ce');this.fx(target.x,target.y-14,player?'#ef8b72':'#73d9de',10);
    if(target.hp<=0){
      if(player){target.dead=true;this.mode='dead';this.fx(target.x,target.y-16,'#a5eff8',40,200);UI.end(false);}
      else{target.dead=true;this.kills++;this.fx(target.x,target.y-14,'#ffa777',16,160);this.spawn({kind:'coin',value:target.type==='merchant'?300:30,x:target.x,y:target.y-12,vx:Math.random()*70-35,vy:-170});if(target.type==='merchant')this.spawn({kind:'item',id:'shotgun',x:target.x,y:target.y});}
    }
    return true;
  },
  anger(shopId){
    const s=this.l.shops[shopId];if(!s)return;
    if(!s.angry){s.angry=true;this.wanted=true;this.message('WANTED  /  Q-9 has marked your signal.',4);this.sound('alarm');this.fx(s.x+s.w/2,s.y+30,'#ff5874',20);}
  },
  breakTile(tx,ty,power=1,source='player'){
    const l=this.l,t=tileAt(l,tx,ty);if(!t||t===6||t===8)return false;
    if(t===2&&power<2){const key=ty*C.cols+tx;l.damage=l.damage||{};l.damage[key]=(l.damage[key]||0)+power;if(l.damage[key]<2){this.fx(tx*32+16,ty*32+16,'#8cb1ca',5);return false;}}
    setTile(l,tx,ty,0);this.fx(tx*32+16,ty*32+16,t===3?'#7aeaf5':'#8399ae',t===3?12:7,135);
    if(t===4)this.spawn({kind:'bomb',x:tx*32+16,y:ty*32+28,fuse:.12,owner:source,static:true});
    if(t===7){l.doors.filter(d=>d.x===tx&&ty>=d.y&&ty<d.y+2).forEach(d=>{d.open=true;setTile(l,d.x,d.y,0);setTile(l,d.x,d.y+1,0);});}
    if(source==='player')for(const s of l.shops)if(tx*32>=s.x-1&&tx*32<=s.x+s.w&&ty*32>=s.y&&ty*32<=s.y+s.h+1)this.anger(s.id);
    return true;
  },
  explode(x,y,radius=90,owner='player'){
    this.shake=Math.max(this.shake,10);this.sound('bomb');this.fx(x,y,'#ff9d65',70,250);this.fx(x,y,'#87f1ff',25,170);this.rings.push({x,y,r:radius,life:.55,total:.55});
    const core=owner==='player'&&this.p.back==='core';
    for(let ty=Math.floor((y-radius)/32);ty<=Math.floor((y+radius)/32);ty++)for(let tx=Math.floor((x-radius)/32);tx<=Math.floor((x+radius)/32);tx++)if(Math.hypot(tx*32+16-x,ty*32+16-y)<radius)this.breakTile(tx,ty,core?2:1,owner);
    for(const e of [...this.entities,this.p]){
      if(e.dead)continue;let d=Math.hypot(e.x-x,e.y-e.h/2-y);if(d>radius+15)continue;
      if(e.kind==='bomb'){e.fuse=Math.min(e.fuse,.1);continue;}
      if(e.kind==='switch'){this.togglePower(e);continue;}
      if(e===this.p||e.kind==='enemy')this.damage(e,e===this.p?4:8,x,y,owner,true);
      else if(e.kind==='crate')this.openCrate(e,owner);
      e.vx=(e.x-x)*5;e.vy=-260-Math.random()*120;e.thrown=owner;e.throwTime=.8;
      if(e.shop!==undefined&&owner==='player')this.anger(e.shop);
    }
    for(const t of this.l.traps)if(Math.hypot(t.x-x,t.y-y)<radius&&t.type==='mine'&&!t.dead){t.armed=.08;}
  },
  openCrate(e,owner='player'){
    if(e.dead)return;e.dead=true;this.fx(e.x,e.y-10,'#ddb983',18,150);
    const r=rng((this.seed+Math.floor(e.x*3+e.y*7)+this.stage*333)>>>0),roll=r();
    if(roll<.25)this.spawn({kind:'coin',value:180,x:e.x,y:e.y-10,vy:-140});
    else this.spawn({kind:'item',id:roll<.60?['bombs','cables','health'][Math.floor(r()*3)]:ITEMS[Math.floor(r()*ITEMS.length)].id,x:e.x,y:e.y-10,vy:-140});
    this.sound('pickup');
  },
  togglePower(e){
    if(e.on)return;e.on=true;const d=this.l.doors.find(d=>d.key===e.doorKey);
    if(d){d.open=true;setTile(this.l,d.x,d.y,0);setTile(this.l,d.x,d.y+1,0);this.fx(d.x*32+16,d.y*32+16,'#82f5ff',20);}
    this.message('Power relay disabled. Energy barrier offline.');this.sound('door');
  },
  equip(e){
    const p=this.p,it=item[e.id];if(!it)return;
    if(it.slot==='supply'){
      if(it.id==='bombs')p.bombs+=3;if(it.id==='bombcrate')p.bombs+=10;if(it.id==='cables')p.cables+=3;if(it.id==='health')p.hp=Math.min(p.maxHp,p.hp+2);
    }else if(it.slot==='passive')p.passives.add(it.id);
    else{
      const key=it.slot==='back'?'back':'hand',old=p[key];
      if(old)this.spawn({kind:'item',id:old,x:p.x-p.face*24,y:p.y,ammo:p.ammo,pickDelay:.5});
      p[key]=it.id;if(key==='hand')p.ammo=e.ammo??({shotgun:24,cryo:30,bolt:16,foam:35,phase:16,cutter:35}[it.id]??Infinity);if(key==='back')p.fuel=1;
    }
    e.dead=true;if(p.held===e)p.held=null;this.sound('pickup');this.fx(p.x,p.y-20,it.color,16);this.message(it.name+'  /  '+it.desc,4);
  },
  context(){
    const p=this.p;if(!p)return null;
    if(p.held){if(p.held.shop!==undefined)return {type:'buy',e:p.held,label:'BUY  ¤'+p.held.price,desc:item[p.held.id].name+' · DOWN + USE to put back'};return {type:'drop',e:p.held,label:'DROP',desc:'ATTACK to throw · DOWN + USE to set down'};}
    if(dist(p,this.l.exit)<47)return {type:'exit',label:this.stage===4?'EXTRACT':'DESCEND',desc:this.stage===4?'Extraction lift · complete the run':'Transit lift · next stage'};
    const door=this.l.doors.find(d=>!d.open&&Math.hypot(p.x-(d.x+.5)*32,p.y-(d.y+2)*32)<60);
    if(door)return {type:'door',e:door,label:door.energy?'POWERED':'UNLOCK',desc:door.energy?'Disable the nearby relay, or breach surrounding walls':p.passives.has('override')||p.keys.includes(door.key)?'Access accepted':'Needs '+door.key+' · or blast through'};
    const relay=this.entities.find(e=>e.kind==='switch'&&!e.on&&dist(p,e)<40);if(relay)return {type:'switch',e:relay,label:'DISABLE',desc:'Power relay · opens energy barrier'};
    const near=this.entities.filter(e=>!e.dead&&!e.held&&!(e.pickDelay>0)&&dist(p,e)<43&&((e.kind==='item')||e.kind==='crate'||e.kind==='key'||e.kind==='scrap'||e.kind==='enemy'&&e.stun>0)).sort((a,b)=>dist(p,a)-dist(p,b));
    const e=near[0];if(!e)return null;
    if(e.kind==='item')return {type:e.shop!==undefined?'inspect':'equip',e,label:e.shop!==undefined?'INSPECT':'EQUIP',desc:item[e.id].name+(e.shop!==undefined?' · ¤'+e.price:'')};
    if(e.kind==='key')return {type:'key',e,label:'KEYCARD',desc:'Collect '+e.id};
    return {type:'carry',e,label:'PICK UP',desc:e.kind==='crate'?'Supply crate · strike to open':'ATTACK to throw'};
  },
  interact(down=false){
    const p=this.p,c=this.context();if(!c)return;
    if(down&&p.held){const e=p.held;e.held=false;e.x=p.x+p.face*23;e.y=p.y;e.vx=0;e.vy=0;p.held=null;return;}
    if(c.type==='exit'){if(this.stage===4){this.mode='win';UI.end(true);}else{this.stage++;this.loadStage();}this.sound('door');}
    else if(c.type==='switch')this.togglePower(c.e);
    else if(c.type==='door'){
      if(c.e.energy){this.message('Find the power relay below this room.');return;}
      const d=c.e,idx=p.keys.indexOf(d.key);if(idx>=0||p.passives.has('override')){if(!p.passives.has('override'))p.keys.splice(idx,1);d.open=true;setTile(this.l,d.x,d.y,0);setTile(this.l,d.x,d.y+1,0);this.sound('door');}else this.message('Locked. Find '+d.key+', use an override, or breach the wall.');
    } else if(c.type==='equip')this.equip(c.e);
    else if(c.type==='key'){p.keys.push(c.e.id);c.e.dead=true;this.sound('pickup');this.message(c.e.id+' acquired');}
    else if(c.type==='buy'){
      if(p.money>=c.e.price){p.money-=c.e.price;delete c.e.shop;this.equip(c.e);}
      else this.message('Need ¤'+(c.e.price-p.money)+' more. ATTACK to steal, or DOWN + USE to return.');
    } else if(c.type==='drop'){this.throwHeld(false);}
    else {p.held=c.e;c.e.held=true;this.sound('ui');if(c.type==='inspect')this.message(item[c.e.id].desc+'  · USE buys · ATTACK steals',5);}
  },
  throwHeld(force=true){
    const p=this.p,e=p.held;if(!e)return;
    if(e.shop!==undefined){this.anger(e.shop);delete e.shop;this.equip(e);return;}
    e.held=false;e.x=p.x+p.face*20;e.y=p.y-12;e.vx=force?p.face*360:0;e.vy=force?-150:0;e.thrown='player';e.throwTime=1.1;if(e.kind==='enemy')e.stun=2;p.held=null;this.sound('attack');p.attack=.22;
  },
  fire(e,weapon='pulse',dir=1,owner='enemy',angle=0){
    const speed=weapon==='bolt'?560:weapon==='foam'?330:470,spread=weapon==='shotgun'?[-.18,-.09,0,.09,.18]:[0];
    for(const a of spread){this.shots.push({x:e.x+dir*18,y:e.y-e.h*.55,vx:Math.cos(angle+a)*speed*dir,vy:Math.sin(angle+a)*speed,life:weapon==='disc'?1.25:1.8,owner,from:e,type:weapon,damage:weapon==='bolt'?3:weapon==='shotgun'?2:1,hits:new Set()});}
    this.fx(e.x+dir*20,e.y-e.h*.55,weapon==='cryo'?'#a7f6ff':'#ffcf84',6,100);this.sound(weapon==='cryo'?'freeze':'shot');
  },
  attack(){
    const p=this.p;if(p.cool>0||p.stun>0)return;
    if(p.held){this.throwHeld();p.cool=.3;return;}
    const w=p.hand,core=p.back==='core';p.attack=.22;p.cool=.3;
    if(['shotgun','cryo','bolt','foam','phase','cutter'].includes(w)&&p.ammo<=0){this.message('Empty. DOWN + ATTACK drops the weapon.');return;}
    if(['shotgun','cryo','bolt','foam'].includes(w)){
      this.fire(p,w,p.face,'player',Input.down('up')?-.55:Input.down('down')?.55:0);p.ammo--;p.vx-=p.face*(w==='shotgun'?(core?45:135):30);p.cool=w==='shotgun'?.65:.38;if(w==='shotgun')this.shake=3;
    }else if(w==='phase'){
      let target=null;for(let d=128;d>=48;d-=8){let x=p.x+p.face*d;if(!blocked(this.l,x,p.y,p.w,p.h)){target=x;break;}}
      if(target!==null){this.fx(p.x,p.y-14,'#bd99ff',24);p.x=target;p.inv=.35;p.ammo--;this.fx(p.x,p.y-14,'#bd99ff',24);this.sound('pickup');}else this.message('Phase blocked.');p.cool=.7;
    }else if(w==='disc'){
      if(!this.shots.some(s=>s.type==='disc'&&s.from===p)){this.fire(p,'disc',p.face,'player');p.cool=.65;}
    }else{
      const reach=w==='blade'?65:w==='cutter'?49:40,dmg=(w==='blade'?3:w==='shield'?1:1)+(core?1:0);
      for(const e of this.entities)if(!e.dead&&Math.abs(e.y-p.y)<35&&(e.x-p.x)*p.face>-8&&(e.x-p.x)*p.face<reach){
        if(e.kind==='enemy')this.damage(e,dmg,p.x,p.y,'player');
        else if(e.kind==='crate')this.openCrate(e);
        else if(e.kind==='switch')this.togglePower(e);
        else if(e.kind!=='bomb'){e.vx=p.face*250;e.vy=-150;e.thrown='player';e.throwTime=.7;if(e.shop!==undefined)this.anger(e.shop);}
      }
      let tx=Math.floor((p.x+p.face*reach*.7)/32),ty=Math.floor((p.y-15)/32);
      if(tileAt(this.l,tx,ty)===3)this.breakTile(tx,ty,1);
      if(w==='cutter'){if(this.breakTile(tx,ty,1))p.ammo--;p.cool=.22;this.fx(p.x+p.face*30,p.y-14,'#ffbe74',10);}
      this.sound('attack');
    }
  },
  dropWeapon(){const p=this.p;if(p.hand){this.spawn({kind:'item',id:p.hand,ammo:p.ammo,x:p.x+p.face*25,y:p.y,pickDelay:.5});p.hand=null;p.ammo=0;this.sound('ui');}},
  bomb(down=false){const p=this.p;if(!p.bombs)return this.message('No plasma charges.');p.bombs--;this.spawn({kind:'bomb',x:p.x+p.face*14,y:p.y-12,vx:down?p.face*25:p.face*230+p.vx*.3,vy:down?0:-270,owner:'player',sticky:p.passives.has('adhesive')});p.attack=.15;this.sound('ui');},
  cable(){
    const p=this.p,l=this.l;if(!p.cables)return this.message('No mag-cables.');
    let x=(Math.floor(p.x/32)+.5)*32,base=p.y-4,top=base;
    for(let y=base-16;y>=Math.max(35,base-7*32);y-=8){if(solid(l,Math.floor(x/32),Math.floor(y/32)))break;top=y;}
    if(base-top<30){this.message('No room above. Step away from the ceiling.');return;}
    p.cables--;l.cables.push({x,top,bottom:Input.down('down')?Math.min(C.rows*32-35,base+6*32):base+10,age:0});this.fx(x,top,'#77e8ff',16);this.sound('cable');
  },
  updatePlayer(dt){
    const p=this.p,l=this.l;p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);p.stun=Math.max(0,(p.stun||0)-dt);p.attack=Math.max(0,p.attack-dt);p.drop=Math.max(0,p.drop-dt);p.anim+=dt;
    let axis=Input.axis(),up=Input.down('up'),down=Input.down('down'),jump=Input.down('jump');
    p.crouch=down&&p.ground&&!ladder(l,p);p.h=p.crouch?20:blocked(l,p.x,p.y,p.w,28)?20:28;if(axis)p.face=Math.sign(axis);
    if(Input.pressed('jump'))p.jumpBuffer=.13;else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    p.coyote=p.ground?.1:Math.max(0,p.coyote-dt);
    const onLadder=ladder(l,p),wallGrip=p.passives.has('grip')&&(blocked(l,p.x+p.face*4,p.y,p.w,p.h));
    if((up||down)&&onLadder)p.climb=true;if(!onLadder&&!wallGrip)p.climb=false;
    if(up&&wallGrip)p.climb=true;
    // A directional hold catches an exposed ledge while falling. UP/JUMP vaults onto it.
    if(p.ledge){
      if(down||axis&&Math.sign(axis)!==p.ledge.dir){p.ledge=null;p.vy=40;}
      else if(up||p.jumpBuffer>0){const h=p.ledge;if(!blocked(l,h.x,h.y,p.w,p.h)){p.x=h.x;p.y=h.y;p.vy=0;p.fallStart=p.y;p.ledge=null;p.jumpBuffer=0;}}
      if(p.ledge){p.vx=p.vy=0;p.fallStart=p.y;p.climb=true;}
    }
    if(p.stun<=0){
      const speed=p.crouch||Input.down('careful')?70:C.speed;p.vx=approach(p.vx,axis*speed,(p.ground?(p.passives.has('traction')?2100:1350):650)*dt);
      if(p.climb){p.vy=(down?1:up?-1:0)*120;p.fallStart=p.y;if(!axis&&onLadder){let lx=Math.floor(p.x/32)*32+16;if(l.ladders[Math.floor((p.y-12)/32)*C.cols+Math.floor(p.x/32)])p.x=approach(p.x,lx,120*dt);}}
      if(p.jumpBuffer>0&&(p.coyote>0||p.climb)){
        if(down&&p.platform){p.drop=.25;p.y+=4;p.platform=null;}else{p.vy=-C.jump*(p.passives.has('jump')?1.4:1);this.sound('jump');this.fx(p.x,p.y,'#c3e3ef',5,50);}
        p.ground=false;p.climb=false;p.coyote=0;p.jumpBuffer=0;p.fallStart=p.y;
      }
      if(Input.pressed('interact'))this.interact(down);
      if(Input.pressed('attack')&&down&&!p.held&&p.hand)this.dropWeapon();else if(Input.down('attack')||Input.pressed('attack'))this.attack();
      if(Input.pressed('bomb'))this.bomb(down);if(Input.pressed('cable'))this.cable();
    }
    if(!p.climb){
      p.vy=Math.min(720,p.vy+C.gravity*dt);
      if(!jump&&p.vy< -150)p.vy=approach(p.vy,-150,1500*dt);
      if(jump&&!p.ground&&p.fuel>0&&(p.back==='jet'||p.back==='hover')){
        p.vy=approach(p.vy,p.back==='jet'?-195:-12,1800*dt);p.fuel=Math.max(0,p.fuel-dt/(p.back==='jet'?2.1:4.5));p.fallStart=p.y;this.fx(p.x-6,p.y+2,'#78e6ff',1,50);this.fx(p.x+6,p.y+2,'#ffb875',1,50);
      }
      if(jump&&p.back==='glide'&&p.vy>85){p.vy=85;p.fallStart=p.y;}
      if(p.passives.has('decel')&&p.y-p.fallStart>C.fallLimit-20&&p.vy>350){p.passives.delete('decel');p.decel=2;this.message('Emergency decelerator deployed.');this.sound('cable');}
      if(p.decel>0){p.decel-=dt;p.vy=Math.min(p.vy,75);p.fallStart=p.y;}
    }
    if(p.vy<0)p.fallStart=Math.min(p.fallStart,p.y);
    const oldY=p.y,oldVy=p.vy,wasGround=p.ground;move(l,p,dt);
    if(p.wall&&p.vy>=0&&oldVy>30&&axis&&!down&&!p.ground&&!p.climb){
      const tx=Math.floor((p.x+p.face*(p.w/2+3))/32),ty=Math.floor((p.y-p.h+10)/32),top=ty*32;
      if(solid(l,tx,ty)&&!solid(l,tx,ty-1)&&Math.abs(p.y-p.h-top)<15&&!blocked(l,(tx+.5)*32,top-.01,p.w,p.h)){
        p.ledge={x:(tx+.5)*32,y:top-.01,dir:p.face};p.vy=0;p.y=top+p.h-8;p.fallStart=p.y;
      }
    }
    if(p.ground){
      if(!wasGround){this.sound('land');if(p.y-p.fallStart>C.fallLimit&&!p.climb){this.damage(p,Math.min(5,Math.max(1,Math.floor((p.y-p.fallStart-C.fallLimit)/55)+1)),p.x,p.y+1);this.message('Hard landing. Use ladders or cables on long drops.');}}
      p.fallStart=p.y;p.fuel=Math.min(1,p.fuel+dt*2);p.platform=p.platform&&p.y===p.platform.y?p.platform:null;
      let tx=Math.floor(p.x/32),ty=Math.floor((p.y+1)/32);if(tileAt(l,tx,ty)===5){l.crumbling=l.crumbling||{};l.crumbling[ty*C.cols+tx]=(l.crumbling[ty*C.cols+tx]||0)+dt;if(l.crumbling[ty*C.cols+tx]>.55)this.breakTile(tx,ty);}
      if(Math.abs(p.vx)>70&&Math.floor(p.anim*9)!==Math.floor((p.anim-dt)*9))this.sound('step');
    }
    if(p.held){const e=p.held;e.x=p.x+p.face*15;e.y=p.y-p.h+4;
      if(e.shop!==undefined){const s=l.shops[e.shop];if(p.x<s.x-12||p.x>s.x+s.w+12||p.y>s.y+s.h+40||p.y<s.y-20){this.anger(e.shop);delete e.shop;this.equip(e);}}}
    for(const e of this.entities){
      if(e.dead||e.held)continue;
      if(e.kind==='coin'&&dist(p,e)<30){p.money+=e.value;e.dead=true;this.sound('coin');this.float('¤'+e.value,e.x,e.y-20,'#ffd780');this.fx(e.x,e.y-8,'#ffd780',5,70);}
      if(e.kind==='enemy'&&e.stun<=0&&!e.phased&&!(e.type==='merchant'&&!l.shops[e.shop]?.angry)&&Math.abs(e.x-p.x)<(e.w+p.w)/2-1&&Math.abs((e.y-e.h/2)-(p.y-p.h/2))<(e.h+p.h)/2){
        if(oldVy>90&&oldY<=e.y-e.h+12&&e.type!=='slug'){
          this.damage(e,p.passives.has('traction')?4:2,p.x,p.y,'player');p.vy=-280;p.fallStart=p.y;this.sound('hit');
        }else if(p.hand==='shield'&&Math.sign(e.x-p.x)===p.face){e.vx=p.face*250;e.stun=.25;}
        else this.damage(p,e.type==='enforcer'?2:1,e.x,e.y);
      }
    }
    if(p.y>C.rows*32+60)this.damage(p,99,p.x,p.y-20);
  },
  updateEnemy(e,dt){
    const p=this.p,l=this.l;e.cool-=dt;e.hit=Math.max(0,e.hit-dt);e.stun=Math.max(0,e.stun-dt);e.foam=Math.max(0,e.foam-dt);e.freeze=Math.max(0,e.freeze-dt);
    if(e.freeze>0||e.foam>0){e.vx=0;e.vy+=C.gravity*dt;move(l,e,dt);return;}
    if(e.stun>0){e.vy=Math.min(700,e.vy+C.gravity*dt);e.vx*=.985;move(l,e,dt);return;}
    let dx=p.x-e.x,dy=p.y-e.y,near=Math.hypot(dx,dy),flying=['flyer','detonator','phase'].includes(e.type);
    if(e.type==='skitter'){
      e.surface=e.surface||0;
      if(e.surface===0){e.vx=e.dir*60;e.vy+=C.gravity*dt;move(l,e,dt);if(e.wall){e.surface=1;e.side=e.dir;e.vx=0;}}
      else if(e.surface===1){e.vx=e.side*20;e.vy=-65;const old=e.y;move(l,e,dt);if(e.y===old){e.surface=2;e.dir=-e.side;}else if(!blocked(l,e.x+e.side*4,e.y,e.w,e.h)){e.surface=0;e.vx=e.side*60;}}
      else {e.vx=e.dir*65;e.vy=-30;move(l,e,dt);if(!blocked(l,e.x,e.y-4,e.w,e.h)||e.wall){e.surface=0;e.vy=20;}}
      return;
    }
    if(e.type==='merchant'){
      if(!l.shops[e.shop]?.angry){e.vx=Math.sin(e.age*.8)*16;e.dir=Math.sign(dx)||1;e.vy+=C.gravity*dt;move(l,e,dt);return;}
      e.dir=Math.sign(dx)||e.dir;e.vx=approach(e.vx,e.dir*195,900*dt);
      if(e.ground&&(e.wall||!solid(l,Math.floor((e.x+e.dir*26)/32),Math.floor((e.y+5)/32))||dy<-40))e.vy=-420;
      if(e.cool<0&&near<450&&Math.abs(dy)<100){this.fire(e,'shotgun',e.dir,'enemy');e.cool=1.0;}
    }else if(e.type==='sentry'){
      e.vx=0;e.dir=Math.sign(dx)||1;if(e.cool<0&&Math.abs(dy)<32&&near<350){this.fire(e,'pulse',e.dir,'enemy');e.cool=1.65;}
    }else if(e.type==='mimic'||e.type==='burrow'){
      if(!e.active&&near<105){e.active=true;e.vy=-260;this.fx(e.x,e.y-15,'#dbb783',12);}
      if(e.active){e.dir=Math.sign(dx)||1;e.vx=e.dir*95;if(e.ground&&e.cool<0){e.vy=-280;e.cool=1.6;}}else e.vx=0;
    }else if(e.type==='enforcer'){
      e.dir=Math.sign(dx)||1;e.vx=e.dir*(near<220&&Math.abs(dy)<40?160:35);if(e.wall&&e.ground)e.vy=-330;
    }else if(e.type==='slug'){
      e.vx=e.dir*22;if(e.cool<0&&near<70){this.rings.push({x:e.x,y:e.y-12,r:65,life:.4,total:.4,electric:true});for(const t of [...this.entities,p])if(t!==e&&(t===p||t.kind==='enemy')&&!t.dead&&dist(t,e)<65)this.damage(t,1,e.x,e.y);e.cool=2.4;this.sound('freeze');}
    }else if(flying){
      if(e.type==='phase'){e.phased=Math.sin(e.age*1.5)> .55;if(e.phased){e.x+=Math.sign(dx)*35*dt;e.y+=Math.sign(dy)*25*dt;return;}}
      let tx=near<280?p.x:e.homeX+Math.sin(e.age)*50,ty=near<280?p.y-14:e.homeY-30+Math.sin(e.age*2)*15;
      if(e.type==='skitter'){tx=e.homeX+Math.sin(e.age*.8)*75;ty=e.homeY-55+Math.sin(e.age*1.6)*35;}
      e.vx=approach(e.vx,clamp((tx-e.x)*1.6,-75,75),200*dt);e.vy=approach(e.vy,clamp((ty-e.y)*1.5,-65,65),200*dt);e.dir=Math.sign(e.vx)||1;
      if(e.type==='detonator'&&near<64)e.primed=(e.primed||0)+dt;
      if(e.primed>.75){e.dead=true;this.explode(e.x,e.y-12,80,'enemy');return;}
    }else {e.vx=e.dir*48;}
    if(!flying)e.vy=Math.min(700,e.vy+C.gravity*dt);
    const oldY=e.y,fall=e.vy;move(l,e,dt);
    if(e.ground&&fall>610)this.damage(e,3,e.x,e.y+10,'world');
    if(e.wall){e.dir*=-1;if(e.type==='merchant'||e.type==='enforcer'){if(e.ground)e.vy=-C.jump;}}
    if(e.ground&&!['merchant','enforcer','mimic','burrow'].includes(e.type)&&!solid(l,Math.floor((e.x+e.dir*18)/32),Math.floor((e.y+3)/32)))e.dir*=-1;
    // Bodies obey the same contact rule: falling robots can crush one another.
    if(fall>250)for(const t of this.entities)if(t!==e&&!t.dead&&t.kind==='enemy'&&Math.abs(t.x-e.x)<18&&oldY<=t.y-t.h+8&&e.y>=t.y-t.h&&e.y<t.y){this.damage(t,2,e.x,e.y,'world');e.vy=-130;break;}
  },
  updateObject(e,dt){
    if(e.held||e.kind==='switch')return;e.pickDelay=Math.max(0,(e.pickDelay||0)-dt);
    if(e.kind==='bomb'){
      e.fuse-=dt;if(e.attached&&!e.attached.dead){e.x=e.attached.x;e.y=e.attached.y-12;}
      if(e.fuse<=0){e.dead=true;this.explode(e.x,e.y-5,e.owner==='player'&&this.p.back==='core'?118:88,e.owner);return;}
      if(e.static)return;
    }
    const vx=e.vx,vy=e.vy;e.vy=Math.min(700,e.vy+C.gravity*dt);move(this.l,e,dt);
    if(e.kind==='bomb'){
      if(e.sticky&&(e.wall||e.ground)){e.static=true;e.vx=e.vy=0;}
      else{if(e.wall)e.vx=-vx*.45;if(e.ground&&vy>80)e.vy=-vy*.35;}
      if(e.sticky)for(const t of this.entities)if(t.kind==='enemy'&&!t.dead&&dist(t,e)<24){e.attached=t;e.static=true;break;}
    }
    if(e.ground)e.vx=approach(e.vx,0,500*dt);
    if(e.throwTime>0){e.throwTime-=dt;for(const t of this.entities)if(t!==e&&!t.dead&&t.kind==='enemy'&&dist(t,e)<25&&Math.hypot(vx,vy)>130){this.damage(t,2,e.x-vx*.1,e.y,e.thrown);e.vx=-vx*.2;e.throwTime=0;if(e.kind==='crate')this.openCrate(e);break;}}
    if(e.kind==='item'&&e.shop!==undefined){const s=this.l.shops[e.shop];if((e.x<s.x-20||e.x>s.x+s.w+20||e.y>s.y+s.h+40)&&s.angry){delete e.shop;}}
  },
  updateShots(dt){
    for(const s of this.shots){
      s.life-=dt;if(s.type==='disc'&&s.life<.8){const dx=this.p.x-s.x,dy=this.p.y-14-s.y,d=Math.hypot(dx,dy);if(d<18){s.life=0;continue;}s.vx=dx/d*420;s.vy=dy/d*420;}
      const steps=Math.ceil(Math.hypot(s.vx,s.vy)*dt/6);for(let j=0;j<steps&&s.life>0;j++){
        s.x+=s.vx*dt/steps;s.y+=s.vy*dt/steps;let tx=Math.floor(s.x/32),ty=Math.floor(s.y/32),t=tileAt(this.l,tx,ty);
        if(t&&s.type!=='disc'){
          if(t===3||t===4)this.breakTile(tx,ty,1,s.owner);
          if(s.type==='bolt')this.spawn({kind:'boltPickup',x:s.x-Math.sign(s.vx)*12,y:s.y,vy:0});
          if(t===2&&!s.bounced&&s.type==='pulse'){s.vx*=-.8;s.bounced=true;this.fx(s.x,s.y,'#c4e9ff',4);}
          else s.life=0;
        }
        for(const e of [...this.entities,this.p]){
          if(e===s.from||e.dead||e.held||s.hits.has(e)||!(e===this.p||e.kind==='enemy'||e.kind==='crate'||e.kind==='bomb'||e.kind==='switch'))continue;
          if(Math.abs(s.x-e.x)<e.w/2+3&&s.y>e.y-e.h&&s.y<e.y){
            if(e===this.p&&this.p.hand==='shield'&&Math.sign(s.x-this.p.x)===this.p.face){this.fx(s.x,s.y,'#8ff7ff',6);s.life=0;break;}
            if(e.kind==='bomb')e.fuse=.05;else if(e.kind==='crate')this.openCrate(e,s.owner);else if(e.kind==='switch')this.togglePower(e);
            else{this.damage(e,s.damage+(s.owner==='player'&&this.p.back==='core'?1:0),s.x-s.vx*.03,s.y,s.owner);if(s.type==='cryo'&&e!==this.p)e.freeze=3;if(s.type==='foam'&&e!==this.p)e.foam=4;}
            s.hits.add(e);if(s.type!=='disc')s.life=0;break;
          }
        }
      }
    }
    this.shots=this.shots.filter(s=>s.life>0);
  },
  updateTraps(dt){
    const targets=[this.p,...this.entities.filter(e=>e.kind==='enemy'||e.kind==='crate')];
    for(const t of this.l.traps){
      if(t.dead)continue;t.cool=Math.max(0,t.cool-dt);const cycle=(this.time+t.phase)%3.3;
      t.active=t.type==='electric'||t.type==='spikes'?cycle<1.7:t.type==='laser'?cycle<1.2:true;
      if(t.type==='mine'){
        if(t.armed!==undefined){t.armed-=dt;if(t.armed<=0){t.dead=true;this.explode(t.x,t.y-7,74,'world');}}
        else if(targets.some(e=>!e.dead&&Math.abs(e.x-t.x)<23&&Math.abs(e.y-t.y)<24))t.armed=.45;
      }else if(t.type==='turret'){
        const e=targets.find(e=>!e.dead&&Math.abs(e.y-t.y)<26&&Math.abs(e.x-t.x)<280);if(e&&t.cool<=0){this.fire({x:t.x,y:t.y,h:24},'pulse',Math.sign(e.x-t.x),'world');t.cool=1.9;}
      }else{
        if(t.type==='crusher'){t.headY=t.y-100+(Math.pow(Math.max(0,Math.sin((this.time+t.phase)*1.6)),5))*92;}
        for(const e of targets){if(e.dead||!t.active||e.kind==='crate')continue;
          const hit=t.type==='laser'?Math.abs(e.y-(t.y-12))<27&&Math.abs(e.x-t.x)<70:t.type==='crusher'?Math.abs(e.x-t.x)<23&&e.y-e.h<t.headY+20&&e.y>t.headY:Math.abs(e.x-t.x)<20&&Math.abs(e.y-t.y)<18;
          if(hit&&!(t.type==='electric'&&e===this.p&&e.passives.has('traction'))&&t.cool<=0){this.damage(e,t.type==='crusher'?4:t.type==='spikes'?2:1,t.x,t.y);t.cool=.5;}
        }
      }
    }
  },
  step(dt){
    if(this.mode!=='play')return;this.time+=dt;this.runTime+=dt;this.shake=approach(this.shake,0,18*dt);
    this.updatePlayer(dt);if(this.mode!=='play')return;
    for(const e of this.entities){if(e.dead)continue;e.age+=dt;if(e.held)continue;if(e.kind==='enemy')this.updateEnemy(e,dt);else this.updateObject(e,dt);
      if(e.kind==='boltPickup'&&dist(e,this.p)<28&&this.p.hand==='bolt'){this.p.ammo++;e.dead=true;this.sound('coin');}}
    this.updateShots(dt);this.updateTraps(dt);
    for(const c of this.l.cables)c.age+=dt;
    for(const p of this.l.platforms)if(p.moving){let oldX=p.x;p.x=p.originX+Math.sin(this.time+p.phase)*36;if(this.p.ground&&this.p.platform===p&&!blocked(this.l,this.p.x+p.x-oldX,this.p.y,this.p.w,this.p.h))this.p.x+=p.x-oldX;}
    if(this.time>C.pursuerTime-15&&!this.warned){this.warned=true;this.message('NULL WARDEN APPROACHING  /  15 seconds',6);this.sound('alarm');}
    if(this.time>C.pursuerTime){
      if(!this.warden){this.warden={x:this.p.x<C.cols*16?C.cols*32+100:-100,y:this.p.y-220};this.message('THE NULL WARDEN IS HERE. FIND THE LIFT.',5);}
      const w=this.warden,d=Math.hypot(this.p.x-w.x,this.p.y-15-w.y);w.x+=(this.p.x-w.x)/d*55*dt;w.y+=(this.p.y-15-w.y)/d*55*dt;if(d<34)this.damage(this.p,99,w.x,w.y);
    }
    for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=240*dt;p.vx*=.985;}
    this.particles=this.particles.filter(p=>p.life>0);this.rings.forEach(p=>p.life-=dt);this.rings=this.rings.filter(p=>p.life>0);this.texts.forEach(p=>{p.life-=dt;p.y-=22*dt;});this.texts=this.texts.filter(p=>p.life>0);
    this.messages.forEach(m=>m.life-=dt);this.messages=this.messages.filter(m=>m.life>0);this.entities=this.entities.filter(e=>!e.dead);
    const look=Input.down('up')?-85:Input.down('down')?100:0;this.cam.x=approach(this.cam.x,this.p.x+this.p.vx*.3,Math.max(80,Math.abs(this.p.x-this.cam.x)*5)*dt);this.cam.y+=(this.p.y-65+look-this.cam.y)*Math.min(1,dt*5);
    if(Math.floor(this.time/4)!==Math.floor((this.time-dt)/4)){this.tone([55,65.4,49,73.4][Math.floor(this.time/4)%4],1.8,'sine',.08,55);}
  },
  pause(){if(this.mode==='play'){this.mode='pause';Input.reset();UI.pause();}else if(this.mode==='pause'){this.mode='play';UI.close();Input.reset();}},
};
window.Game=Game;
