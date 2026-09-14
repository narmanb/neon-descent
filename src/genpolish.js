'use strict';
(() => {
  const baseGenerate=ND.generate;
  const specialMimic=(l,s)=>s.type==='mimic'&&l.secrets.some(q=>Math.hypot(q.x-s.x,q.y-s.y)<70);

  function encloseShops(l){
    const protectedCells=new Set();
    for(const s of l.route)if(s.row<3)for(let y=s.floor-3;y<s.floor+8;y++){
      protectedCells.add(y*ND.C.cols+s.shaft);protectedCells.add(y*ND.C.cols+s.shaft+1);
    }
    const protectedCell=(x,y)=>protectedCells.has(y*ND.C.cols+x);
    const wall=(x,y)=>{if(!protectedCell(x,y))ND.setTile(l,x,y,1);};

    for(const q of l.shops){
      const x0=Math.round(q.x/32),y0=Math.round(q.y/32),tilesWide=Math.round(q.w/32),tilesHigh=Math.round(q.h/32);
      const x1=x0+tilesWide-1,floorY=y0+tilesHigh;
      for(let x=x0;x<=x1;x++)wall(x,y0);
      for(let y=y0;y<floorY;y++){
        wall(x0,y);
        wall(x1,y);
      }
      // The existing approach ladder is immediately left of the shop. Leave a two-tile doorway into it.
      ND.setTile(l,x0,y0+2,0);
      ND.setTile(l,x0,y0+3,0);
      // Do not refill any floor cells the route-repair pass intentionally carved for a descent shaft.
      const floorCols=[];for(let x=x0+1;x<x1;x++)if(ND.solid(l,x,floorY))floorCols.push(x);
      q.enclosed=true;q.entry='left';

      let merchantCol=null;
      if(floorCols.length){
        const left=floorCols[0],right=floorCols[floorCols.length-1];
        merchantCol=(left-x0)<=(x1-right)?left:right;
      }
      const stockCols=floorCols.filter(x=>x!==merchantCol);
      const stock=l.spawns.filter(s=>s.kind==='item'&&s.shop===q.id);
      const itemCols=stockCols.length>=3?[stockCols[0],stockCols[Math.floor((stockCols.length-1)/2)],stockCols[stockCols.length-1]]:stockCols;
      stock.forEach((s,i)=>{const col=itemCols[Math.min(i,itemCols.length-1)];if(col!==undefined){s.x=(col+.5)*32;s.y=floorY*32;}});
      const merchant=l.spawns.find(s=>s.kind==='enemy'&&s.type==='merchant'&&s.shop===q.id);
      if(merchant&&merchantCol!==null){merchant.x=(merchantCol+.5)*32;merchant.y=floorY*32;merchant.homeX=merchant.x;merchant.homeY=merchant.y;}
    }
  }

  function reduceThreats(l,seed,stage){
    const random=ND.rng((seed^Math.imul(stage,0x9e3779b1)^0x4e454f4e)>>>0);
    const safeRadius=400,trapSafeRadius=300;
    const ambient=[],other=[];
    for(const s of l.spawns){
      const isAmbient=s.kind==='enemy'&&s.type!=='merchant'&&!specialMimic(l,s);
      if(!isAmbient){other.push(s);continue;}
      if(Math.hypot(s.x-l.entrance.x,s.y-l.entrance.y)<safeRadius)continue;
      ambient.push(s);
    }
    for(let i=ambient.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ambient[i],ambient[j]]=[ambient[j],ambient[i]];}
    const maxAmbient=8+stage*2+(l.modifier==='Security Alert'?2:0);
    const kept=ambient.slice(0,maxAmbient);
    l.spawns=[...other,...kept];
    l.traps=l.traps.filter(t=>Math.hypot(t.x-l.entrance.x,t.y-l.entrance.y)>=trapSafeRadius);
    l.spawnSafety={radius:safeRadius,trapRadius:trapSafeRadius,ambientEnemies:kept.length,maxAmbient};
  }

  function configureCrushers(l){
    for(const t of l.traps){
      if(t.type!=='crusher')continue;
      const tx=Math.floor(t.x/32),floorRow=Math.floor(t.y/32);
      let ceilingRow=null;
      for(let y=floorRow-2;y>=Math.max(1,floorRow-8);y--){if(ND.solid(l,tx,y)){ceilingRow=y;break;}}
      if(ceilingRow===null){t.type='spikes';continue;}
      const mountY=(ceilingRow+1)*32,downY=t.y-18;
      if(downY-mountY<46){t.type='spikes';continue;}
      t.mountY=mountY;t.floorY=t.y;t.restY=mountY+4;t.downY=downY;
    }
  }

  const pickupKind=s=>s.shop===undefined&&['coin','item','key','crate','scrap'].includes(s.kind);
  function hazardOverlap(s,t){
    if(t.dead)return false;
    if(t.type==='laser')return Math.abs(s.y-(t.y-12))<30&&Math.abs(s.x-t.x)<82;
    if(t.type==='crusher'&&t.mountY!==undefined)return Math.abs(s.x-t.x)<30&&s.y>t.mountY-8&&s.y<t.floorY+8;
    return Math.hypot(s.x-t.x,s.y-t.y)<32;
  }
  function separatePickupsFromTraps(l){
    const offsets=[32,-32,64,-64,96,-96,128,-128,160,-160,192,-192];
    for(const s of l.spawns){
      if(!pickupKind(s)||!l.traps.some(t=>hazardOverlap(s,t)))continue;
      const oldX=s.x;
      for(const dx of offsets){
        const x=oldX+dx,tx=Math.floor(x/32);
        if(tx<1||tx>=ND.C.cols-1)continue;
        if(ND.blocked(l,x,s.y-.01,18,18))continue;
        if(l.traps.some(t=>hazardOverlap({x,y:s.y},t)))continue;
        s.x=x;break;
      }
    }
  }
  function polishTraps(l){configureCrushers(l);separatePickupsFromTraps(l);}

  ND.generate=function(seed,stage=1){
    const l=baseGenerate(seed,stage);
    const originalTiles=l.tiles.slice();
    encloseShops(l);
    reduceThreats(l,seed,stage);
    polishTraps(l);
    const check=ND.validate(l);
    if(check.ok)l.validation=check;
    else{
      // Shop dressing must never compromise the certified natural route.
      l.tiles=originalTiles;
      for(const q of l.shops)q.enclosed=false;
      polishTraps(l);
      l.validation=ND.validate(l);
    }
    return l;
  };
})();
