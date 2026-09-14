'use strict';
(() => {
  const baseUpdatePlayer=Game.updatePlayer;
  Game.updatePlayer=function(dt){
    const p=this.p;
    if(!p)return baseUpdatePlayer.call(this,dt);

    p.climbRegrabLock=Math.max(0,(p.climbRegrabLock||0)-dt);
    p.gripRegrabLock=Math.max(0,(p.gripRegrabLock||0)-dt);

    const onClimbable=ND.ladder(this.l,p),rawAxis=Input.axis(),jumpPressed=Input.pressed('jump');
    const rawUpHeld=Input.down('up'),rawDownHeld=Input.down('down');
    const analogY=Number(Input.analog?.y||0),analogX=Number(Input.analog?.x||0);
    const touchAnalogActive=Math.abs(analogX)>.02||Math.abs(analogY)>.02;
    const analogUpStrong=touchAnalogActive&&analogY<-.62;
    const digitalUpPressed=!touchAnalogActive&&Input.pressed('up');
    const analogUpPressed=analogUpStrong&&!p._climbAnalogUpStrong;
    const climbGrabPressed=digitalUpPressed||analogUpPressed;
    p._climbAnalogUpStrong=analogUpStrong;

    const wasGrip=!!p.gripCling&&!p.ledge;
    const wasLadderClimbing=onClimbable&&!!p.climb&&!p.ledge&&!wasGrip;
    const groundedWalkOff=wasLadderClimbing&&p.ground&&Math.abs(rawAxis)>.15&&!rawUpHeld&&!rawDownHeld&&!jumpPressed;
    const freshClimbCandidate=onClimbable&&!wasLadderClimbing&&!p.ledge&&!wasGrip;
    const oldDown=Input.down,oldAxis=Input.axis;

    // Once attached to a ladder or Mag-Cable, left/right alone cannot slide the
    // player off it in midair. At the bottom, when standing on solid ground,
    // left/right immediately becomes ordinary walking again.
    if(wasLadderClimbing&&!jumpPressed&&!groundedWalkOff)Input.axis=()=>0;

    // Walking through a ladder/cable no longer auto-grabs it. A fresh attachment
    // requires a deliberate UP press while overlapping the climbable. Floating/
    // fixed touch analog uses a stronger vertical threshold so a slight northeast
    // walking angle cannot accidentally latch the player.
    Input.down=function(a){
      if(p.climbRegrabLock>0||p.gripRegrabLock>0){if(a==='up'||a==='down')return false;}
      if(freshClimbCandidate){
        if(a==='up')return climbGrabPressed;
        if(a==='down')return false;
      }
      return oldDown.call(this,a);
    };

    try{baseUpdatePlayer.call(this,dt);}
    finally{Input.down=oldDown;Input.axis=oldAxis;}

    const jumpPower=ND.C.jump*(p.passives?.has('jump')?1.4:1);

    if(groundedWalkOff){
      p.climb=false;p.gripCling=0;p.climbRegrabLock=.1;
    }else if(wasLadderClimbing&&jumpPressed&&!p.ledge){
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
