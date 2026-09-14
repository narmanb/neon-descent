'use strict';
(() => {
  const cableAt=(l,p)=>l?.cables?.find(c=>Math.abs(p.x-c.x)<18&&p.y>c.top&&p.y-20<c.bottom)||null;
  const ladderAt=(l,p)=>{
    if(!l||!p)return false;
    const tx=Math.floor(p.x/32),ty=Math.floor((p.y-12)/32);
    return !!l.ladders?.[ty*ND.C.cols+tx];
  };

  // Remember which kind of climbable owns the active attachment. Physics still
  // comes from the existing climb system; this state only prevents cable visuals
  // from being confused with the ladder pose when both use p.climb.
  const previousUpdatePlayer=Game.updatePlayer;
  Game.updatePlayer=function(dt){
    const p=this.p;
    if(!p)return previousUpdatePlayer.call(this,dt);
    const previousKind=p.climbSurface||null,beforeCable=cableAt(this.l,p),beforeLadder=ladderAt(this.l,p);
    previousUpdatePlayer.call(this,dt);
    if(!p.climb||p.ledge||p.gripCling){p.climbSurface=null;p.climbCableX=null;return;}
    const afterCable=cableAt(this.l,p),afterLadder=ladderAt(this.l,p);
    if(previousKind==='cable'&&(afterCable||beforeCable)){
      p.climbSurface='cable';p.climbCableX=(afterCable||beforeCable).x;
    }else if(previousKind==='ladder'&&(afterLadder||beforeLadder)){
      p.climbSurface='ladder';p.climbCableX=null;
    }else if(afterCable){
      p.climbSurface='cable';p.climbCableX=afterCable.x;
    }else if(afterLadder){
      p.climbSurface='ladder';p.climbCableX=null;
    }
  };

  if(typeof Render==='undefined')return;
  const previousHumanoid=Render.humanoid;

  function contactSparks(r,x,y){
    const c=r.ctx,pulse=.58+.32*Math.sin(r.t*20);c.save();c.globalAlpha=pulse;
    r.glow(x,y,14,'#72edff38');
    r.line(x-1,y,x-8,y-5,'#c6ffff',1);r.line(x+1,y,x+8,y-3,'#74eaff',1);
    r.line(x,y+1,x-6,y+7,'#95fff0',1);r.line(x+1,y+1,x+6,y+6,'#d1ffff',1);c.restore();
  }

  function movementTrail(r,x,y,vy){
    const c=r.ctx,tail=vy<0?1:-1;c.save();c.globalAlpha=.62;
    let px=x-2,py=y+tail*5;
    for(let i=1;i<=4;i++){
      const nx=x+(i%2?5:-4),ny=y+tail*(5+i*5);
      r.line(px,py,nx,ny,i===4?'#72e9ff':'#b8ffff',i===4?1:1.5);px=nx;py=ny;
    }
    px=x+3;py=y+tail*8;
    for(let i=1;i<=3;i++){
      const nx=x+(i%2?-3:4),ny=y+tail*(8+i*4);
      r.line(px,py,nx,ny,'#7ff7e8',1);px=nx;py=ny;
    }
    c.restore();
  }

  function drawCableClimber(e,cable){
    const r=Render,c=r.ctx,t=e.anim||r.t,moving=Math.abs(e.vy)>8;
    const armor='#d9d4bb',dark='#436170',glow='#72eafb',boot=(e.passives?.has('jump')||e.passives?.has('traction'))?'#62d7b9':'#bd9374';
    const contactX=ND.clamp((cable?.x??e.climbCableX??e.x)-e.x,-17,17),contactY=-43;
    const sway=moving?Math.sin(t*10)*1.5:0;
    c.save();c.translate(e.x,e.y);if(e.inv>0&&Math.floor(r.t*18)%2)c.globalAlpha=.5;if(e.hit>0)c.filter='brightness(1.8)';

    // Cable pose replaces the normal humanoid entirely: two legs, back-facing
    // torso/helmet, and both arms reaching to one overhead cable contact point.
    r.line(-4,-13,-7+sway,-5,dark,5);r.line(4,-13,7+sway,-5,dark,5);
    r.rect(-12+sway,-7,9,4,boot);r.rect(3+sway,-7,9,4,boot);
    if(e.back){r.rect(-10,-28,20,16,'#516b7b');r.rect(-7,-25,14,10,'#233c4b');r.circle(0,-20,4,item[e.back]?.color||glow);}
    r.polygon([[-8,-27],[8,-27],[10,-18],[6,-11],[-6,-11],[-10,-18]],armor);r.rect(-5,-23,10,8,dark);r.line(-3,-18,3,-18,glow,2);
    r.polygon([[-9,-36],[9,-36],[12,-31],[9,-24],[-9,-24],[-12,-31]],armor);r.rect(-7,-33,14,6,'#304c5a');r.line(-5,-30,5,-30,glow,2);r.rect(-2,-37,4,2,'#f1ede0');

    const leftHandX=contactX-2,rightHandX=contactX+2;
    r.line(-7,-24,leftHandX,contactY,dark,5);r.line(7,-24,rightHandX,contactY,dark,5);
    r.circle(leftHandX,contactY,3,'#b9fff0');r.circle(rightHandX,contactY,3,'#b9fff0');
    r.glow(contactX,contactY,12,'#75f4ff35');
    if(moving)movementTrail(r,contactX,contactY,e.vy);else contactSparks(r,contactX,contactY);
    c.restore();
  }

  Render.humanoid=function(e,player=true){
    const cable=player&&e.climb&&!e.ledge&&!e.gripCling&&Game.l?cableAt(Game.l,e):null;
    const cableClimb=!!cable&&(e.climbSurface==='cable'||(!e.climbSurface&&!ladderAt(Game.l,e)));
    if(cableClimb){drawCableClimber(e,cable);return;}
    previousHumanoid.call(this,e,player);
  };
})();
