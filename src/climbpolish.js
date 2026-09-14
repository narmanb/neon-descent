'use strict';
(() => {
  const baseUpdatePlayer=Game.updatePlayer;
  Game.updatePlayer=function(dt){
    const p=this.p;
    if(!p)return baseUpdatePlayer.call(this,dt);

    p.ladderExitSlow=Math.max(0,(p.ladderExitSlow||0)-dt);
    const onClimbable=ND.ladder(this.l,p),wasClimbing=!!p.climb;
    const axis=Input.axis(),jumpPressed=Input.pressed('jump');
    const activeClimb=onClimbable&&wasClimbing&&!p.ledge;

    // A directional jump from a ladder/cable should carry the same useful horizontal
    // momentum as a normal running jump instead of inheriting the tiny first climb frame.
    if(activeClimb&&jumpPressed&&axis){
      p.vx=Math.sign(axis)*ND.C.speed;
    }

    baseUpdatePlayer.call(this,dt);

    if(activeClimb&&jumpPressed&&axis&&!p.ledge){
      p.vx=Math.sign(axis)*ND.C.speed;
      if(p.vy>-ND.C.jump*.92)p.vy=-ND.C.jump;
      p.climb=false;p.ground=false;p.fallStart=p.y;p.ladderExitSlow=0;
    }else if(activeClimb&&axis&&!jumpPressed){
      // Side-stepping off a ladder/cable remains allowed, but is intentionally slower.
      const cap=ND.C.speed*.5;
      p.vx=ND.clamp(p.vx,-cap,cap);
      p.ladderExitSlow=.14;
    }else if(p.ladderExitSlow>0&&!p.ground&&!p.climb&&!jumpPressed){
      const cap=ND.C.speed*.5;
      p.vx=ND.clamp(p.vx,-cap,cap);
    }
  };
})();
