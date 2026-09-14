'use strict';
(() => {
  const baseUpdatePlayer=Game.updatePlayer;
  function touchesWall(l,p,dir){
    return !!dir&&!ND.blocked(l,p.x,p.y,p.w,p.h)&&ND.blocked(l,p.x+dir*8,p.y,p.w,p.h);
  }

  Game.updatePlayer=function(dt){
    const p=this.p;
    baseUpdatePlayer.call(this,dt);
    if(!p||p.dead||p.ledge||!p.passives?.has('grip')){if(p)p.gripCling=0;return;}
    if(p.stun>0){p.gripCling=0;return;}

    const axis=Input.axis(),up=Input.down('up'),down=Input.down('down');
    let preferred=axis?Math.sign(axis):(p.face||1);
    let dir=touchesWall(this.l,p,preferred)?preferred:touchesWall(this.l,p,-preferred)?-preferred:0;
    if(dir&&(up||down)){
      const first=p.gripCling!==dir;
      p.gripCling=dir;p.face=dir;p.climb=true;p.ground=false;p.platform=null;p.vx=0;p.vy=up?-120:120;p.fallStart=p.y;
      if(first){this.fx(p.x+dir*10,p.y-p.h*.55,'#73e0b6',7,45);this.sound('ui');if(!this.gripHintShown){this.gripHintShown=true;this.message('MAGNETIC GRIP  /  Hold UP or DOWN against a wall to climb.',4);}}
      else if(Math.floor(this.time*12)!==Math.floor((this.time-dt)*12))this.fx(p.x+dir*10,p.y-p.h*.55,'#73e0b6',2,22);
    }else p.gripCling=0;
  };
})();
