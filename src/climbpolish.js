'use strict';
(() => {
  const baseUpdatePlayer=Game.updatePlayer;
  Game.updatePlayer=function(dt){
    const p=this.p;
    if(!p)return baseUpdatePlayer.call(this,dt);

    p.climbRegrabLock=Math.max(0,(p.climbRegrabLock||0)-dt);
    p.gripRegrabLock=Math.max(0,(p.gripRegrabLock||0)-dt);

    const onClimbable=ND.ladder(this.l,p),rawAxis=Input.axis(),jumpPressed=Input.pressed('jump');
    const wasGrip=!!p.gripCling&&!p.ledge;
    const wasLadderClimbing=onClimbable&&!!p.climb&&!p.ledge&&!wasGrip;
    const oldDown=Input.down,oldAxis=Input.axis;

    // Once attached to a ladder or Mag-Cable, left/right alone cannot slide the
    // player off it. Horizontal movement becomes an explicit jump-off action.
    if(wasLadderClimbing&&!jumpPressed)Input.axis=()=>0;

    // A short detach grace period prevents a held UP/DOWN input from immediately
    // re-acquiring the same ladder/cable or Magnetic Grip wall after a jump.
    if(p.climbRegrabLock>0||p.gripRegrabLock>0){
      Input.down=function(a){if(a==='up'||a==='down')return false;return oldDown.call(this,a);};
    }

    try{baseUpdatePlayer.call(this,dt);}
    finally{Input.down=oldDown;Input.axis=oldAxis;}

    const jumpPower=ND.C.jump*(p.passives?.has('jump')?1.4:1);

    if(wasLadderClimbing&&jumpPressed&&!p.ledge){
      const baseLaunched=p.vy<-jumpPower*.45;
      p.vx=rawAxis?Math.sign(rawAxis)*ND.C.speed:0;
      p.vy=-jumpPower;p.climb=false;p.gripCling=0;p.ground=false;p.platform=null;p.fallStart=p.y;
      p.climbRegrabLock=.22;
      if(!baseLaunched){this.sound('jump');this.fx(p.x,p.y,'#c3e3ef',5,50);}
    }else if(wasLadderClimbing&&!jumpPressed&&ND.ladder(this.l,p)&&!p.ledge){
      p.vx=0;p.climb=true;
    }

    if(wasGrip&&jumpPressed&&!p.ledge){
      const baseLaunched=p.vy<-jumpPower*.45;
      p.vx=rawAxis?Math.sign(rawAxis)*ND.C.speed:0;
      p.vy=-jumpPower;p.climb=false;p.gripCling=0;p.ground=false;p.platform=null;p.fallStart=p.y;
      p.gripRegrabLock=.22;
      if(rawAxis)p.face=Math.sign(rawAxis);
      if(!baseLaunched){this.sound('jump');this.fx(p.x,p.y,'#73e0b6',7,55);}
    }
  };
})();
