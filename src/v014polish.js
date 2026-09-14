'use strict';
(() => {
  // --- Smart Disc v0.14 ----------------------------------------------------
  const previousUpdateShots=Game.updateShots;
  const clearance=(l,x,y,a)=>{let free=0;for(let d=10;d<=90;d+=10){const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(ND.tileAt(l,Math.floor(px/32),Math.floor(py/32)))break;free=d;}return free;};

  function chooseRebound(game,s){
    const reverse=Math.atan2(-s.vy,-s.vx),toPlayer=Math.atan2(game.p.y-14-s.y,game.p.x-s.x);
    const offsets=[0,-.18,.18,-.34,.34,-.5,.5];
    let best=reverse,bestScore=-Infinity;
    for(const off of offsets){
      const a=reverse+off,space=clearance(game.l,s.x,s.y,a);
      // Prefer the clearest nearby lane. When several lanes are equally open,
      // prefer a slight angle rather than a perfectly straight rebound.
      const slightBonus=Math.abs(off)>=.15?8:0;
      const score=space*4+Math.cos(a-toPlayer)*24+slightBonus-Math.abs(off)*5;
      if(score>bestScore){bestScore=score;best=a;}
    }
    return best;
  }

  function beginReturn(game,s,bounce=false){
    if(!s.returning){s.returning=true;s.hits=new Set();}
    s.life=Math.min(s.life,.79);
    if(bounce){const a=chooseRebound(game,s),speed=405;s.vx=Math.cos(a)*speed;s.vy=Math.sin(a)*speed;s.bounceTimer=.12;}
  }

  function dropDisc(game,s){
    const p=game.p;if(s.from===p&&p.hand==='disc'){p.hand=null;p.ammo=0;}
    game.spawn({kind:'item',id:'disc',x:s.x,y:s.y,vx:s.vx*.08,vy:20,pickDelay:.35});
    game.fx(s.x,s.y,'#ffcf84',7,55);game.sound('ui');game.message('SMART DISC BLOCKED  /  Recover it from the floor.',2.2);s.life=0;
  }

  Game.updateShots=function(dt){
    const discs=this.shots.filter(s=>s.type==='disc');if(!discs.length)return previousUpdateShots.call(this,dt);
    this.shots=this.shots.filter(s=>s.type!=='disc');previousUpdateShots.call(this,dt);

    for(const s of discs){
      if(s.life<=0)continue;s.hits=s.hits||new Set();s.life-=dt;if(s.life<=0)continue;
      if(!s.returning&&s.life<.8)beginReturn(this,s,false);
      if(s.returning){
        const dx=this.p.x-s.x,dy=this.p.y-14-s.y,d=Math.hypot(dx,dy);if(d<18){s.life=0;continue;}
        if((s.bounceTimer||0)>0)s.bounceTimer=Math.max(0,s.bounceTimer-dt);else{s.vx=dx/d*420;s.vy=dy/d*420;}
      }

      const steps=Math.max(1,Math.ceil(Math.hypot(s.vx,s.vy)*dt/5));
      for(let j=0;j<steps&&s.life>0;j++){
        const oldX=s.x,oldY=s.y,nx=s.x+s.vx*dt/steps,ny=s.y+s.vy*dt/steps;
        if(ND.tileAt(this.l,Math.floor(nx/32),Math.floor(ny/32))){
          s.x=oldX;s.y=oldY;
          if(!s.returning){this.fx(s.x,s.y,'#ffcf84',6,65);beginReturn(this,s,true);}else dropDisc(this,s);
          break;
        }
        s.x=nx;s.y=ny;
        for(const e of [...this.entities,this.p]){
          if(e===s.from||e.dead||e.held||s.hits.has(e)||!(e===this.p||e.kind==='enemy'||e.kind==='crate'||e.kind==='bomb'||e.kind==='switch'))continue;
          if(Math.abs(s.x-e.x)<e.w/2+3&&s.y>e.y-e.h&&s.y<e.y){
            if(e===this.p&&this.p.hand==='shield'&&Math.sign(s.x-this.p.x)===this.p.face){this.fx(s.x,s.y,'#8ff7ff',6);s.life=0;break;}
            if(e.kind==='bomb')e.fuse=.05;else if(e.kind==='crate')this.openCrate(e,s.owner);else if(e.kind==='switch')this.togglePower(e);else this.damage(e,s.damage+(s.owner==='player'&&this.p.back==='core'?1:0),s.x-s.vx*.03,s.y,s.owner);
            s.hits.add(e);break;
          }
        }
      }
    }
    this.shots.push(...discs.filter(s=>s.life>0));
  };

  // --- Climbing visuals v0.14 ---------------------------------------------
  if(typeof Render!=='undefined'){
    const previousHumanoid=Render.humanoid;
    function electricTrail(r,x,y,dir,magnitude=1){
      const c=r.ctx;c.save();c.globalAlpha=.65;const step=dir*30*magnitude/4;let px=x,py=y;
      for(let i=1;i<=4;i++){const nx=x+(i%2?3:-3),ny=y+step*i;r.line(px,py,nx,ny,i===4?'#73dff2':'#a6ffff',i===4?1:1.5);px=nx;py=ny;}c.restore();
    }
    function contactSparks(r,x,y,flip=1){
      const c=r.ctx;c.save();c.globalAlpha=.55+.45*Math.sin(r.t*18);r.line(x,y,x+flip*7,y-4,'#b7ffff',1);r.line(x,y,x+flip*8,y+2,'#74e9ff',1);r.line(x,y,x+flip*4,y+7,'#9affee',1);c.restore();
    }
    function drawBackClimber(e){
      const r=Render,c=r.ctx,t=e.anim||r.t,moving=Math.abs(e.vy)>8,step=moving?Math.sin(t*11)*4:0,trailDir=e.vy<0?1:-1;
      const armor='#d9d4bb',dark='#436170',glow='#72eafb',boot=(e.passives?.has('jump')||e.passives?.has('traction'))?'#62d7b9':'#bd9374';
      c.save();c.translate(e.x,e.y);if(e.inv>0&&Math.floor(r.t*18)%2)c.globalAlpha=.5;if(e.hit>0)c.filter='brightness(1.8)';
      if(moving){electricTrail(r,-9,-29,trailDir,1);electricTrail(r,9,-25,trailDir,.9);}
      // Back-facing pose: exactly two legs, no front visor.
      r.line(-4,-13,-7,-5+step,dark,5);r.line(4,-13,7,-5-step,dark,5);r.rect(-12,-7+step,9,4,boot);r.rect(3,-7-step,9,4,boot);
      if(e.back){r.rect(-10,-28,20,16,'#516b7b');r.rect(-7,-25,14,10,'#233c4b');r.circle(0,-20,4,item[e.back]?.color||glow);}
      r.polygon([[-8,-27],[8,-27],[10,-18],[6,-11],[-6,-11],[-10,-18]],armor);r.rect(-5,-23,10,8,dark);r.line(-3,-18,3,-18,glow,2);
      r.polygon([[-9,-36],[9,-36],[12,-31],[9,-24],[-9,-24],[-12,-31]],armor);r.rect(-7,-33,14,6,'#304c5a');r.line(-5,-30,5,-30,glow,2);r.rect(-2,-37,4,2,'#f1ede0');
      const lhY=-31-step,rhY=-27+step;r.line(-6,-23,-10,lhY,dark,5);r.line(6,-23,10,rhY,dark,5);r.circle(-10,lhY,3,'#b9fff0');r.circle(10,rhY,3,'#b9fff0');r.glow(-10,lhY,10,'#75f4ff24');r.glow(10,rhY,10,'#75f4ff24');
      if(!moving){contactSparks(r,-10,lhY,-1);contactSparks(r,10,rhY,1);}else{r.line(-10,lhY,-13,lhY+trailDir*8,'#b7ffff',1);r.line(10,rhY,13,rhY+trailDir*8,'#7fefff',1);}c.restore();
    }

    Render.humanoid=function(e,player=true){
      const ladderClimb=player&&e.climb&&!e.ledge&&!e.gripCling&&Game.l&&ND.ladder(Game.l,e);if(ladderClimb){drawBackClimber(e);return;}
      previousHumanoid.call(this,e,player);
      if(player&&e.gripCling&&!e.ledge){
        const c=this.ctx,side=Math.sign(e.gripCling)||1,moving=Math.abs(e.vy)>8,trailDir=e.vy<0?1:-1;c.save();c.translate(e.x,e.y);const x=side*15;
        if(moving){electricTrail(this,x,-26,trailDir,1.05);electricTrail(this,x,-17,trailDir,.8);}else{contactSparks(this,x,-29,side);contactSparks(this,x,-19,side);}c.restore();
      }
    };
  }
})();
