'use strict';
(() => {
  // Smart Disc: update discs separately so they respect solid level geometry while
  // leaving every other projectile on the original, already-tested update path.
  const baseUpdateShots=Game.updateShots;
  Game.updateShots=function(dt){
    const discs=this.shots.filter(s=>s.type==='disc');
    if(!discs.length)return baseUpdateShots.call(this,dt);

    this.shots=this.shots.filter(s=>s.type!=='disc');
    baseUpdateShots.call(this,dt);

    for(const s of discs){
      if(s.life<=0)continue;
      s.life-=dt;
      if(s.life<=0)continue;
      if(s.life<.8)s.returning=true;

      if(s.returning){
        const dx=this.p.x-s.x,dy=this.p.y-14-s.y,d=Math.hypot(dx,dy);
        if(d<18){s.life=0;continue;}
        s.vx=dx/d*420;s.vy=dy/d*420;
      }

      const steps=Math.max(1,Math.ceil(Math.hypot(s.vx,s.vy)*dt/5));
      for(let j=0;j<steps&&s.life>0;j++){
        const oldX=s.x,oldY=s.y;
        const nx=s.x+s.vx*dt/steps,ny=s.y+s.vy*dt/steps;
        const t=ND.tileAt(this.l,Math.floor(nx/32),Math.floor(ny/32));
        if(t){
          s.x=oldX;s.y=oldY;
          this.fx(s.x,s.y,'#ffcf84',5,55);
          if(!s.returning){
            // First wall impact recalls the disc from the near side of the wall.
            s.returning=true;s.life=Math.min(s.life,.79);
            const dx=this.p.x-s.x,dy=this.p.y-14-s.y,d=Math.max(1,Math.hypot(dx,dy));
            s.vx=dx/d*420;s.vy=dy/d*420;
          }else{
            // If the player moved behind new geometry during the return, recover the
            // disc instead of ever allowing it to tunnel through a wall.
            s.life=0;
          }
          break;
        }

        s.x=nx;s.y=ny;
        for(const e of [...this.entities,this.p]){
          if(e===s.from||e.dead||e.held||s.hits.has(e)||!(e===this.p||e.kind==='enemy'||e.kind==='crate'||e.kind==='bomb'||e.kind==='switch'))continue;
          if(Math.abs(s.x-e.x)<e.w/2+3&&s.y>e.y-e.h&&s.y<e.y){
            if(e===this.p&&this.p.hand==='shield'&&Math.sign(s.x-this.p.x)===this.p.face){this.fx(s.x,s.y,'#8ff7ff',6);s.life=0;break;}
            if(e.kind==='bomb')e.fuse=.05;
            else if(e.kind==='crate')this.openCrate(e,s.owner);
            else if(e.kind==='switch')this.togglePower(e);
            else this.damage(e,s.damage+(s.owner==='player'&&this.p.back==='core'?1:0),s.x-s.vx*.03,s.y,s.owner);
            s.hits.add(e);
            break;
          }
        }
      }
    }
    this.shots.push(...discs.filter(s=>s.life>0));
  };

  // Make ladder/Mag-Cable attachment visually unmistakable. The base character art
  // remains intact; a symmetric two-hand/two-foot climbing pose is drawn over it.
  if(typeof Render!=='undefined'){
    const baseHumanoid=Render.humanoid;
    Render.humanoid=function(e,player=true){
      baseHumanoid.call(this,e,player);
      if(!player||!e.climb||e.ledge||e.gripCling||!Game.l||!ND.ladder(Game.l,e))return;
      const c=this.ctx,t=e.anim||this.t,step=Math.sin(t*11)*3;
      c.save();c.translate(e.x,e.y);
      const limb='#436170',hand=e.passives?.has('grip')?'#73e0b6':'#d9d4bb',boot='#bd9374';
      this.line(-5,-22,-10,-31-step,limb,5);this.line(5,-22,10,-27+step,limb,5);
      this.circle(-10,-31-step,3,hand);this.circle(10,-27+step,3,hand);
      this.line(-4,-12,-9,-5+step,limb,5);this.line(4,-12,9,-5-step,limb,5);
      this.rect(-13,-7+step,8,4,boot);this.rect(5,-7-step,8,4,boot);
      c.globalAlpha=.55;
      this.line(-13,-34-step,-7,-34-step,'#9bf4ee',1);this.line(7,-30+step,13,-30+step,'#9bf4ee',1);
      c.restore();
    };
  }
})();
