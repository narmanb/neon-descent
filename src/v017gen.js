'use strict';
(() => {
  const previousGenerate=ND.generate;
  const candidateTypes=new Set([ND.TILE.WALL,ND.TILE.GLASS,ND.TILE.CRUMBLE]);

  function isTightIsolatedObstacle(l,x,y){
    const t=ND.tileAt(l,x,y);
    if(!candidateTypes.has(t))return false;
    if(ND.solid(l,x-1,y)||ND.solid(l,x+1,y))return false;
    // Full block on a floor + one air tile + a solid ceiling creates the
    // awkward 32px squeeze seen in playtesting. Require two body rows instead.
    return ND.solid(l,x,y+1)&&!ND.solid(l,x,y-1)&&ND.solid(l,x,y-2);
  }

  function softenTightChokes(l){
    let repaired=0;
    for(let y=3;y<ND.C.rows-2;y++)for(let x=2;x<ND.C.cols-2;x++){
      if(!isTightIsolatedObstacle(l,x,y))continue;
      ND.setTile(l,x,y,ND.TILE.AIR);l.ladders[y*ND.C.cols+x]=0;repaired++;
      const floorY=(y+1)*32,centerX=(x+.5)*32;
      // Static hazards generated on top of the removed block should settle onto
      // the real floor instead of floating in mid-air.
      for(const t of l.traps||[])if(Math.abs(t.x-centerX)<18&&Math.abs(t.y-y*32)<12)t.y=floorY;
      for(const s of l.spawns||[])if(Math.abs(s.x-centerX)<18&&Math.abs(s.y-y*32)<12)s.y=floorY;
    }
    l.tightChokeRepairs=(l.tightChokeRepairs||0)+repaired;
    if(repaired)l.validation=ND.validate(l);
    return repaired;
  }

  function tuneTrapHitboxes(l){
    // Mines are visually tiny and sit low on the floor. Give normal horizontal
    // gunfire a few extra pixels of vertical tolerance without changing damage.
    for(const t of l.traps||[])if(t.type==='mine'){t.w=Math.max(t.w||0,28);t.h=Math.max(t.h||0,16);}
  }

  ND.softenTightChokes=softenTightChokes;
  ND.generate=function(seed,stage=1){const l=previousGenerate(seed,stage);softenTightChokes(l);tuneTrapHitboxes(l);return l;};
})();
