'use strict';
(() => {
  if(typeof Game==='undefined')return;

  const destructibleTrap=t=>t&&!t.dead&&['turret','laser','mine'].includes(t.type);
  function prepTrap(t){
    if(!t)return t;t.kind=t.kind||'trap';
    if(t.type==='turret'){t.w=t.w||28;t.h=t.h||24;t.maxHp=t.maxHp||4;t.hp=t.hp??t.maxHp;}
    else if(t.type==='laser'){t.w=t.w||18;t.h=t.h||28;t.maxHp=t.maxHp||3;t.hp=t.hp??t.maxHp;}
    else if(t.type==='mine'){t.w=t.w||28;t.h=t.h||12;}
    return t;
  }
  function lineClear(l,ax,ay,bx,by){
    const dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(d/7));
    for(let i=1;i<steps;i++){
      const x=ax+dx*i/steps,y=ay+dy*i/steps;
      if(ND.pointBlocked?ND.pointBlocked(l,x,y):ND.solid(l,Math.floor(x/32),Math.floor(y/32)))return false;
    }
    return true;
  }
  function trapContains(t,x,y,pad=3){
    prepTrap(t);return destructibleTrap(t)&&Math.abs(x-t.x)<t.w/2+pad&&y>t.y-t.h-pad&&y<t.y+pad;
  }
  function damageTrap(t,amount,sx=t.x,sy=t.y,source='world',attacker=null){
    prepTrap(t);if(!destructibleTrap(t))return false;
    if(t.type==='mine'){
      t.armed=Math.min(t.armed??.08,.08);t.hit=.14;Game.fx(t.x,t.y-7,'#ffad86',6,70);return true;
    }
    t.hp-=amount;t.hit=.18;Game.float('-'+amount,t.x,t.y-t.h-5,'#fff2ce');Game.fx(t.x,t.y-t.h*.45,'#73d9de',7,80);
    if(t.hp<=0){t.dead=true;Game.fx(t.x,t.y-t.h*.45,'#ffad73',18,150);Game.float('OFFLINE',t.x,t.y-t.h-12,'#a6fff1');Game.sound('hit');}
    return true;
  }
  Game.lineClear=lineClear;Game.damageTrap=damageTrap;

  // Merchants only flag the player when the player is actually responsible.
  // If a world device/enemy shoots Q-9, remember that attacker for a temporary
  // retaliation run, then return to the normal shop home position afterwards.
  const previousDamage=Game.damage;
  Game.damage=function(target,amount,sx,sy,source='world',blast=false,attacker=null){
    const hit=previousDamage.call(this,target,amount,sx,sy,source,blast);
    if(hit&&!target.dead&&target.type==='merchant'&&source!=='player'&&attacker&&attacker!==target&&!attacker.dead){
      if(target.retaliate!==attacker)this.message('Q-9 / hostile source acquired.',1.8);
      target.retaliate=attacker;target.returningToShop=false;
    }
    return hit;
  };

  function updateMerchantRetaliation(e,dt){
    const l=Game.l,shop=l.shops[e.shop];if(shop?.angry)return false;
    if(e.retaliate?.dead){e.retaliate=null;e.returningToShop=true;}
    if(!e.retaliate&&!e.returningToShop)return false;
    e.cool-=dt;e.hit=Math.max(0,e.hit-dt);e.stun=Math.max(0,e.stun-dt);e.foam=Math.max(0,e.foam-dt);e.freeze=Math.max(0,e.freeze-dt);
    if(e.freeze>0||e.foam>0){e.vx=0;e.vy+=ND.C.gravity*dt;ND.move(l,e,dt);return true;}
    if(e.stun>0){e.vy=Math.min(700,e.vy+ND.C.gravity*dt);e.vx*=.985;ND.move(l,e,dt);return true;}
    const target=e.retaliate,tx=target?target.x:e.homeX,ty=target?target.y:e.homeY,dx=tx-e.x,dy=ty-e.y,near=Math.hypot(dx,dy);
    if(!target&&near<18&&Math.abs(dy)<34){e.returningToShop=false;e.vx=0;e.dir=-1;e.vy=Math.min(700,e.vy+ND.C.gravity*dt);ND.move(l,e,dt);return true;}
    e.dir=Math.sign(dx)||e.dir||1;e.vx=ND.approach(e.vx,e.dir*195,900*dt);
    if(e.ground&&(e.wall||!ND.solid(l,Math.floor((e.x+e.dir*26)/32),Math.floor((e.y+5)/32))||dy<-40))e.vy=-420;
    if(target&&e.cool<0&&near<450&&Math.abs(dy)<125&&lineClear(l,e.x+e.dir*13,e.y-e.h*.55,target.x,target.y-(target.h||24)*.5)){
      const angle=ND.clamp(Math.atan2((target.y-(target.h||24)*.5)-(e.y-e.h*.55),Math.max(1,Math.abs(dx))),-.48,.48);
      Game.fire(e,'shotgun',e.dir,'merchant',angle);e.cool=1.0;
    }
    e.vy=Math.min(700,e.vy+ND.C.gravity*dt);ND.move(l,e,dt);
    if(e.wall&&e.ground)e.vy=-ND.C.jump;
    return true;
  }
  const previousUpdateEnemy=Game.updateEnemy;
  Game.updateEnemy=function(e,dt){if(e.type==='merchant'&&updateMerchantRetaliation(e,dt))return;return previousUpdateEnemy.call(this,e,dt);};

  // Turrets now require an unobstructed firing lane. Laser emitters also respect
  // intervening walls for damage, matching what the player can see on screen.
  Game.updateTraps=function(dt){
    const targets=[this.p,...this.entities.filter(e=>e.kind==='enemy'||e.kind==='crate')];
    for(const t of this.l.traps){
      if(t.dead)continue;t.cool=Math.max(0,t.cool-dt);t.hit=Math.max(0,(t.hit||0)-dt);prepTrap(t);const cycle=(this.time+t.phase)%3.3;
      t.active=t.type==='electric'||t.type==='spikes'?cycle<1.7:t.type==='laser'?cycle<1.2:true;
      if(t.type==='mine'){
        if(t.armed!==undefined){t.armed-=dt;if(t.armed<=0){t.dead=true;this.explode(t.x,t.y-7,74,'world');}}
        else if(targets.some(e=>!e.dead&&Math.abs(e.x-t.x)<23&&Math.abs(e.y-t.y)<24))t.armed=.45;
      }else if(t.type==='turret'){
        const target=targets.find(e=>!e.dead&&(e===this.p||e.kind==='enemy')&&Math.abs(e.y-t.y)<34&&Math.abs(e.x-t.x)<300&&lineClear(this.l,t.x,t.y-13,e.x,e.y-e.h*.5));
        if(target&&t.cool<=0){t.dir=Math.sign(target.x-t.x)||1;this.fire(t,'pulse',t.dir,'world');t.cool=1.9;}
      }else{
        if(t.type==='crusher'){t.headY=t.y-100+(Math.pow(Math.max(0,Math.sin((this.time+t.phase)*1.6)),5))*92;}
        for(const e of targets){if(e.dead||!t.active||e.kind==='crate')continue;
          const hit=t.type==='laser'?Math.abs(e.y-(t.y-12))<27&&Math.abs(e.x-t.x)<70&&lineClear(this.l,t.x,t.y-12,e.x,e.y-e.h*.5):t.type==='crusher'?Math.abs(e.x-t.x)<23&&e.y-e.h<t.headY+20&&e.y>t.headY:Math.abs(e.x-t.x)<20&&Math.abs(e.y-t.y)<18;
          if(hit&&!(t.type==='electric'&&e===this.p&&e.passives.has('traction'))&&t.cool<=0){this.damage(e,t.type==='crusher'?4:t.type==='spikes'?2:1,t.x,t.y,'world',false,t.type==='laser'?t:null);t.cool=.5;}
        }
      }
    }
  };

  // Projectile collision now includes the visible trap hardware. Mines detonate;
  // turrets and laser emitters can be shot offline.
  Game.updateShots=function(dt){
    for(const s of this.shots){
      s.life-=dt;if(s.type==='disc'&&s.life<.8){const dx=this.p.x-s.x,dy=this.p.y-14-s.y,d=Math.hypot(dx,dy);if(d<18){s.life=0;continue;}s.vx=dx/d*420;s.vy=dy/d*420;}
      const steps=Math.ceil(Math.hypot(s.vx,s.vy)*dt/6);for(let j=0;j<steps&&s.life>0;j++){
        s.x+=s.vx*dt/steps;s.y+=s.vy*dt/steps;let tx=Math.floor(s.x/32),ty=Math.floor(s.y/32),tile=ND.tileAt(this.l,tx,ty);
        if((ND.pointBlocked?ND.pointBlocked(this.l,s.x,s.y):tile)&&s.type!=='disc'){
          if(tile===ND.TILE.GLASS||tile===ND.TILE.REACTOR)this.breakTile(tx,ty,1,s.owner);
          if(s.type==='bolt')this.spawn({kind:'boltPickup',x:s.x-Math.sign(s.vx)*12,y:s.y,vy:0});
          if(tile===ND.TILE.STEEL&&!s.bounced&&s.type==='pulse'){s.vx*=-.8;s.bounced=true;this.fx(s.x,s.y,'#c4e9ff',4);}
          else s.life=0;
        }
        if(s.life<=0)continue;
        let hitTrap=false;
        for(const t of this.l.traps){
          if(!destructibleTrap(t)||s.hits.has(t)||!trapContains(t,s.x,s.y))continue;
          damageTrap(t,s.damage+(s.owner==='player'&&this.p.back==='core'?1:0),s.x-s.vx*.03,s.y,s.owner,s.from);s.hits.add(t);if(s.type!=='disc')s.life=0;hitTrap=true;break;
        }
        if(hitTrap&&s.life<=0)continue;
        for(const e of [...this.entities,this.p]){
          if(e===s.from||e.dead||e.held||s.hits.has(e)||!(e===this.p||e.kind==='enemy'||e.kind==='crate'||e.kind==='bomb'||e.kind==='switch'))continue;
          if(Math.abs(s.x-e.x)<e.w/2+3&&s.y>e.y-e.h&&s.y<e.y){
            if(e===this.p&&this.p.hand==='shield'&&Math.sign(s.x-this.p.x)===this.p.face){this.fx(s.x,s.y,'#8ff7ff',6);s.life=0;break;}
            if(e.kind==='bomb')e.fuse=.05;else if(e.kind==='crate')this.openCrate(e,s.owner);else if(e.kind==='switch')this.togglePower(e);
            else{this.damage(e,s.damage+(s.owner==='player'&&this.p.back==='core'?1:0),s.x-s.vx*.03,s.y,s.owner,false,s.from);if(s.type==='cryo'&&e!==this.p)e.freeze=3;if(s.type==='foam'&&e!==this.p)e.foam=4;}
            s.hits.add(e);if(s.type!=='disc')s.life=0;break;
          }
        }
      }
    }
    this.shots=this.shots.filter(s=>s.life>0);
  };

  // Keep the original weapon balance but make close-range contact edge-aware.
  // This especially helps low-profile slugs and allows melee to disable traps.
  function meleeContains(p,x,y,w,h,reach){
    const forward=(x-p.x)*p.face,pt=p.y-p.h-8,pb=p.y+8,et=y-h,eb=y;
    return forward>-(w/2+5)&&forward<reach+w/2&&eb>pt&&et<pb;
  }
  const previousAttack=Game.attack;
  Game.attack=function(){
    const p=this.p;if(!p)return previousAttack.call(this);
    const hand=p.hand,ready=p.cool<=0&&p.stun<=0&&!p.held,melee=ready&&!['shotgun','cryo','bolt','foam','phase','disc'].includes(hand),ammoOk=hand!=='cutter'||p.ammo>0;
    const before=new Map(this.entities.filter(e=>e.kind==='enemy'&&!e.dead).map(e=>[e,e.hp]));
    previousAttack.call(this);
    if(!melee||!ammoOk||p.attack<=0)return;
    const reach=hand==='blade'?76:hand==='cutter'?58:50,dmg=(hand==='blade'?3:1)+(p.back==='core'?1:0);
    for(const e of this.entities){
      if(e.dead||e.kind!=='enemy'||before.get(e)!==e.hp)continue;
      if(meleeContains(p,e.x,e.y,e.w,e.h,reach))this.damage(e,dmg,p.x,p.y,'player');
    }
    for(const t of this.l.traps){
      if(!destructibleTrap(t)){continue;}prepTrap(t);
      if(meleeContains(p,t.x,t.y,t.w,t.h,reach))damageTrap(t,dmg,p.x,p.y,'player',p);
    }
  };
})();
