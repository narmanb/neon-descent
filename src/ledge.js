'use strict';
(() => {
  const baseUpdatePlayer=Game.updatePlayer;

  function anchorLedge(game,p){
    const h=p.ledge;if(!h)return;
    if(h.hangX===undefined){
      h.hangX=p.x;h.hangY=p.y;h.age=0;h.catchTime=.18;
      p.jumpBuffer=0;p.coyote=0;p.vx=0;p.vy=0;p.climb=false;p.face=h.dir;
      game.fx(p.x+h.dir*7,h.y+2,'#8ff7ff',5,38);
      if(!game.ledgeHintShown){game.ledgeHintShown=true;game.message('LEDGE GRAB  /  JUMP climbs · away + JUMP kicks off · down + JUMP drops',5);}
    }
  }

  function release(game,p,kind,vx,vy){
    p.ledge=null;p.climb=false;p.ground=false;p.platform=null;p.jumpBuffer=0;p.coyote=0;
    p.vx=vx;p.vy=vy;p.fallStart=p.y;p.ledgeAction=kind;p.ledgeTransition=.18;
    if(kind!=='drop')game.sound('jump');
  }

  Game.updatePlayer=function(dt){
    const p=this.p;
    if(!p)return baseUpdatePlayer.call(this,dt);
    if(p.ledgeTransition>0){p.ledgeTransition=Math.max(0,p.ledgeTransition-dt);if(!p.ledgeTransition)p.ledgeAction=null;}

    if(!p.ledge){
      baseUpdatePlayer.call(this,dt);
      if(p.ledge)anchorLedge(this,p);
      return;
    }

    anchorLedge(this,p);
    const h=p.ledge,l=this.l;
    p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);p.stun=Math.max(0,(p.stun||0)-dt);p.attack=Math.max(0,p.attack-dt);p.drop=Math.max(0,p.drop-dt);p.anim+=dt;
    h.age=(h.age||0)+dt;h.catchTime=Math.max(0,(h.catchTime||0)-dt);
    p.h=28;p.crouch=false;p.ground=false;p.platform=null;p.climb=false;p.face=h.dir;
    p.x=h.hangX;p.y=h.hangY;p.vx=0;p.vy=0;p.fallStart=p.y;

    const ledgeTileX=Math.floor(h.x/32),ledgeTileY=Math.floor((h.y+1)/32);
    if(!ND.solid(l,ledgeTileX,ledgeTileY)||p.stun>0){release(this,p,'drop',0,85);return;}

    const axis=Input.axis(),down=Input.down('down'),jumpPressed=Input.pressed('jump');
    if(jumpPressed){
      if(down){release(this,p,'drop',0,95);return;}
      if(axis&&Math.sign(axis)!==h.dir){p.face=-h.dir;release(this,p,'away',-h.dir*225,-ND.C.jump*.72);return;}
      if(!ND.blocked(l,h.x,h.y,p.w,28)){
        p.face=h.dir;release(this,p,'climb',h.dir*185,-ND.C.jump*.82);this.fx(p.x+h.dir*7,h.y,'#c8ffff',7,55);return;
      }
      this.sound('ui');this.message('No room to climb onto this ledge.',1.3);
    }

    if(p.stun<=0){
      if(Input.pressed('interact'))this.interact(down);
      if(Input.pressed('attack')&&down&&!p.held&&p.hand)this.dropWeapon();
      else if(Input.down('attack')||Input.pressed('attack'))this.attack();
      if(Input.pressed('bomb'))this.bomb(down);
      if(Input.pressed('cable'))this.cable();
    }
  };

  if(typeof Render!=='undefined'){
    const baseHumanoid=Render.humanoid;
    Render.humanoid=function(e,player=true){
      if(!player||!e.ledge)return baseHumanoid.call(this,e,player);
      const c=this.ctx,h=e.ledge,dir=h.dir||e.face||1;
      const edgeY=h.y-e.y,wallEdge=(h.x-dir*16-e.x)*dir,gripX=ND.clamp(wallEdge,8,14);
      const catchRatio=ND.clamp((h.catchTime||0)/.18,0,1),sway=Math.sin((h.age||0)*3.2)*.55;
      const armor='#d9d4bb',dark='#436170',glow='#72eafb',boot=e.passives.has('jump')||e.passives.has('traction')?'#62d7b9':'#bd9374';
      c.save();c.translate(e.x,e.y+sway+catchRatio*2);c.scale(dir,1);
      if(e.inv>0&&Math.floor(this.t*18)%2)c.globalAlpha=.5;
      if(e.hit>0)c.filter='brightness(1.8)';

      this.line(gripX-6,edgeY,gripX+5,edgeY,'#b9d3da',2);
      this.line(-5,edgeY+18,gripX-4,edgeY+2,dark,5);this.line(4,edgeY+18,gripX+2,edgeY+2,dark,5);
      this.circle(gripX-4,edgeY+1.5,2.8,e.passives.has('grip')?'#73e0b6':armor);this.circle(gripX+2,edgeY+1.5,2.8,e.passives.has('grip')?'#73e0b6':armor);

      this.polygon([[-7,edgeY+17],[5,edgeY+17],[8,edgeY+25],[5,edgeY+31],[-6,edgeY+31],[-9,edgeY+24]],armor);
      this.rect(-4,edgeY+20,8,7,dark);this.rect(-3,edgeY+21,6,2,glow);this.rect(-6,edgeY+29,13,3,'#263d50');
      if(e.back){this.rect(-11,edgeY+18,5,14,'#728b9b');this.rect(-12,edgeY+20,3,7,ND.item[e.back].color);}

      this.polygon([[-7,edgeY+5],[2,edgeY+3],[8,edgeY+7],[8,edgeY+14],[3,edgeY+17],[-6,edgeY+16],[-9,edgeY+10]],armor);
      this.polygon([[-3,edgeY+7],[7,edgeY+8],[7,edgeY+13],[-2,edgeY+13]],'#163644');this.line(0,edgeY+10,7,edgeY+10,glow,2);this.rect(-8,edgeY+9,3,6,dark);

      this.line(-4,edgeY+31,-8,edgeY+38,dark,5);this.line(4,edgeY+31,8,edgeY+36,dark,5);
      this.line(-8,edgeY+38,-6,edgeY+42,dark,5);this.line(8,edgeY+36,gripX-1,edgeY+39,dark,5);
      this.rect(-10,edgeY+40,9,3,boot);this.rect(gripX-3,edgeY+38,8,3,boot);

      if(catchRatio>0){c.globalAlpha*=catchRatio;this.circle(gripX-8,edgeY-2,1.5,'#c8ffff');this.circle(gripX+5,edgeY-4,1.2,'#8ff7ff');this.line(gripX-1,edgeY-6,gripX+1,edgeY-10,'#8ff7ff',1);}
      c.restore();
    };
  }
})();
