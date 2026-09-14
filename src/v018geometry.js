'use strict';
(() => {
  if(typeof ND==='undefined')return;

  // Two real collision shapes. v0.18 generation currently uses HALF_TOP for
  // suspended floors/shelves because its top surface stays aligned with the
  // existing tile grid while giving the room below 16px more headroom.
  ND.TILE.HALF_TOP=9;
  ND.TILE.HALF_BOTTOM=10;
  const HALF_TOP=ND.TILE.HALF_TOP,HALF_BOTTOM=ND.TILE.HALF_BOTTOM;
  const fullSolid=t=>t!==ND.TILE.AIR;

  function tileRect(tx,ty,t){
    if(!fullSolid(t))return null;
    const x=tx*32,y=ty*32;
    if(t===HALF_TOP)return {left:x,top:y,right:x+32,bottom:y+16};
    if(t===HALF_BOTTOM)return {left:x,top:y+16,right:x+32,bottom:y+32};
    return {left:x,top:y,right:x+32,bottom:y+32};
  }
  function pointBlocked(l,x,y){
    const tx=Math.floor(x/32),ty=Math.floor(y/32),t=ND.tileAt(l,tx,ty),r=tileRect(tx,ty,t);
    return !!r&&x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom;
  }
  function blocked(l,x,y,w=20,h=28){
    const left=x-w/2,right=x+w/2,top=y-h,bottom=y-.001;
    for(let ty=Math.floor(top/32);ty<=Math.floor(bottom/32);ty++)for(let tx=Math.floor(left/32);tx<=Math.floor((right-.001)/32);tx++){
      const r=tileRect(tx,ty,ND.tileAt(l,tx,ty));if(!r)continue;
      if(right>r.left&&left<r.right&&bottom>r.top&&top<r.bottom)return true;
    }
    return false;
  }
  function landingSurface(l,b,ny){
    const left=b.x-b.w/2,right=b.x+b.w/2,top=ny-b.h,bottom=ny;
    let surface=null;
    for(let ty=Math.floor(top/32)-1;ty<=Math.floor(bottom/32)+1;ty++)for(let tx=Math.floor(left/32);tx<=Math.floor((right-.001)/32);tx++){
      const r=tileRect(tx,ty,ND.tileAt(l,tx,ty));if(!r)continue;
      if(right<=r.left||left>=r.right||bottom<r.top||top>=r.bottom)continue;
      // Only snap to a surface the feet actually crossed this sub-step.
      if(b.y<=r.top+.01&&ny>=r.top-.01)surface=surface===null?r.top:Math.min(surface,r.top);
    }
    return surface;
  }
  function move(l,b,dt,platforms=true){
    const oldY=b.y;b.wall=0;b.ground=false;
    let dx=b.vx*dt,dy=b.vy*dt,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8));
    for(let i=0;i<n;i++){
      const nx=b.x+dx/n;
      if(blocked(l,nx,b.y,b.w,b.h)){b.wall=Math.sign(dx);b.vx=0;dx=0;}else b.x=nx;
      const ny=b.y+dy/n;
      if(blocked(l,b.x,ny,b.w,b.h)){
        if(dy>=0){const surface=landingSurface(l,b,ny);if(surface!==null){b.ground=true;b.y=surface-.001;}}
        b.vy=0;dy=0;
      }else b.y=ny;
    }
    if(platforms&&b.vy>=0&&!b.drop){
      for(const p of l.platforms||[])if(!p.dead&&b.x+b.w/2>p.x&&b.x-b.w/2<p.x+p.w&&oldY<=p.y+2&&b.y>=p.y){b.y=p.y;b.vy=0;b.ground=true;b.platform=p;break;}
    }
    return b;
  }

  ND.tileRect=tileRect;
  ND.pointBlocked=pointBlocked;
  ND.blocked=blocked;
  ND.move=move;

  const previousGenerate=ND.generate;
  const convertible=new Set([ND.TILE.WALL,ND.TILE.GLASS,ND.TILE.CRUMBLE]);
  function protectedRouteCells(l){
    const cells=new Set();
    for(const s of l.route||[])if(s.row<3)for(let y=s.floor-3;y<s.floor+8;y++)for(const x of [s.shaft,s.shaft+1])cells.add(y*ND.C.cols+x);
    return cells;
  }
  function addHalfArchitecture(l,seed,stage){
    const random=ND.rng((seed^Math.imul(stage,0x45d9f3b)^0x48414c46)>>>0),protectedCells=protectedRouteCells(l);
    let count=0,thinShops=0;

    // Roughly two thirds of shops use a thin suspended slab. The remaining
    // shops keep the old full-depth floor, preserving visual variation.
    for(const q of l.shops||[]){
      const x0=Math.round(q.x/32),x1=x0+Math.round(q.w/32)-1,floorY=Math.round((q.y+q.h)/32);
      const thin=random()<.68;q.floorProfile=thin?'half':'full';if(!thin)continue;thinShops++;
      for(let x=x0+1;x<x1;x++){
        const key=floorY*ND.C.cols+x,t=ND.tileAt(l,x,floorY);
        if(!protectedCells.has(key)&&convertible.has(t)){ND.setTile(l,x,floorY,HALF_TOP);count++;}
      }
    }

    // Some ordinary suspended lab shelves also use the thin profile. Their top
    // surface does not move, so loot/enemies above them remain correctly placed.
    for(const room of l.rooms||[]){
      if(room.shop!==undefined||random()>.38)continue;
      const x0=room.ox,x1=room.ox+9,y0=room.oy+1,y1=room.oy+6;
      for(let y=y0;y<=y1;y++)for(let x=x0+1;x<x1;x++){
        const key=y*ND.C.cols+x,t=ND.tileAt(l,x,y);
        if(protectedCells.has(key)||!convertible.has(t)||l.ladders[key])continue;
        if(ND.tileAt(l,x,y-1)!==ND.TILE.AIR||ND.tileAt(l,x,y+1)!==ND.TILE.AIR)continue;
        if(random()<.55){ND.setTile(l,x,y,HALF_TOP);count++;}
      }
    }
    l.halfBlocks=count;l.thinShopFloors=thinShops;
    // Core validation treats half slabs conservatively as full cells, so a green
    // result here guarantees the same natural route remains available.
    l.validation=ND.validate(l);
    return l;
  }
  ND.addHalfArchitecture=addHalfArchitecture;
  ND.generate=function(seed,stage=1){return addHalfArchitecture(previousGenerate(seed,stage),seed,stage);};
})();
