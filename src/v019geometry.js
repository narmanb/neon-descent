'use strict';
(() => {
  if(typeof ND==='undefined')return;

  Object.assign(ND.TILE,{
    HALF_LEFT:11,HALF_RIGHT:12,THIN_PLATFORM:13,GLASS_PARTITION:14,BREAKABLE_WALL:15,
    SLOPE_SHALLOW_R:16,SLOPE_SHALLOW_L:17,SLOPE_MEDIUM_R:18,SLOPE_MEDIUM_L:19,SLOPE_STEEP_R:20,SLOPE_STEEP_L:21,
    CEIL_SHALLOW_R:22,CEIL_SHALLOW_L:23,CEIL_MEDIUM_R:24,CEIL_MEDIUM_L:25,CEIL_STEEP_R:26,CEIL_STEEP_L:27
  });
  const T=ND.TILE;
  const floorSlopes=new Set([T.SLOPE_SHALLOW_R,T.SLOPE_SHALLOW_L,T.SLOPE_MEDIUM_R,T.SLOPE_MEDIUM_L,T.SLOPE_STEEP_R,T.SLOPE_STEEP_L]);
  const ceilingSlopes=new Set([T.CEIL_SHALLOW_R,T.CEIL_SHALLOW_L,T.CEIL_MEDIUM_R,T.CEIL_MEDIUM_L,T.CEIL_STEEP_R,T.CEIL_STEEP_L]);

  function rectFor(tx,ty,t){
    const x=tx*32,y=ty*32;
    if(!t)return null;
    if(t===T.HALF_TOP)return {left:x,top:y,right:x+32,bottom:y+16};
    if(t===T.HALF_BOTTOM)return {left:x,top:y+16,right:x+32,bottom:y+32};
    if(t===T.HALF_LEFT)return {left:x,top:y,right:x+16,bottom:y+32};
    if(t===T.HALF_RIGHT)return {left:x+16,top:y,right:x+32,bottom:y+32};
    if(t===T.THIN_PLATFORM)return {left:x,top:y,right:x+32,bottom:y+8};
    if(t===T.GLASS_PARTITION)return {left:x+12,top:y,right:x+20,bottom:y+32};
    if(floorSlopes.has(t)||ceilingSlopes.has(t))return null;
    return {left:x,top:y,right:x+32,bottom:y+32};
  }
  function floorSurface(t,x){
    x=Math.max(0,Math.min(32,x));
    if(t===T.SLOPE_SHALLOW_R)return 32-x*.5;
    if(t===T.SLOPE_SHALLOW_L)return 16+x*.5;
    if(t===T.SLOPE_MEDIUM_R)return 32-x;
    if(t===T.SLOPE_MEDIUM_L)return x;
    if(t===T.SLOPE_STEEP_R)return Math.max(0,32-x*2);
    if(t===T.SLOPE_STEEP_L)return Math.max(0,x*2-32);
    return null;
  }
  function ceilingSurface(t,x){
    x=Math.max(0,Math.min(32,x));
    if(t===T.CEIL_SHALLOW_R)return x*.5;
    if(t===T.CEIL_SHALLOW_L)return 16-x*.5;
    if(t===T.CEIL_MEDIUM_R)return x;
    if(t===T.CEIL_MEDIUM_L)return 32-x;
    if(t===T.CEIL_STEEP_R)return Math.min(32,x*2);
    if(t===T.CEIL_STEEP_L)return Math.min(32,(32-x)*2);
    return null;
  }
  function pointBlocked(l,x,y){
    const tx=Math.floor(x/32),ty=Math.floor(y/32),t=ND.tileAt(l,tx,ty),r=rectFor(tx,ty,t);
    if(r)return x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom;
    const lx=x-tx*32,ly=y-ty*32,fs=floorSurface(t,lx);if(fs!==null)return ly>=fs&&ly<32;
    const cs=ceilingSurface(t,lx);if(cs!==null)return ly>=0&&ly<=cs;
    return false;
  }
  function intersectsTile(tx,ty,t,left,top,right,bottom){
    const tileL=tx*32,tileT=ty*32,ox0=Math.max(0,left-tileL),ox1=Math.min(32,right-tileL),oy0=Math.max(0,top-tileT),oy1=Math.min(32,bottom-tileT);
    if(ox1<=ox0||oy1<=oy0)return false;
    const r=rectFor(tx,ty,t);if(r)return right>r.left&&left<r.right&&bottom>r.top&&top<r.bottom;
    if(floorSlopes.has(t)){
      const a=floorSurface(t,ox0),b=floorSurface(t,ox1),highest=Math.min(a,b);
      return oy1>highest&&oy0<32;
    }
    if(ceilingSlopes.has(t)){
      const a=ceilingSurface(t,ox0),b=ceilingSurface(t,ox1),lowest=Math.max(a,b);
      return oy0<lowest&&oy1>0;
    }
    return false;
  }
  function blocked(l,x,y,w=20,h=28){
    const left=x-w/2,right=x+w/2,top=y-h,bottom=y-.001;
    for(let ty=Math.floor(top/32);ty<=Math.floor(bottom/32);ty++)for(let tx=Math.floor(left/32);tx<=Math.floor((right-.001)/32);tx++){
      const t=ND.tileAt(l,tx,ty);if(t&&intersectsTile(tx,ty,t,left,top,right,bottom))return true;
    }
    return false;
  }
  function landingSurface(l,b,ny){
    const left=b.x-b.w/2,right=b.x+b.w/2,top=ny-b.h,bottom=ny;let surface=null;
    for(let ty=Math.floor(top/32)-1;ty<=Math.floor(bottom/32)+1;ty++)for(let tx=Math.floor(left/32);tx<=Math.floor((right-.001)/32);tx++){
      const t=ND.tileAt(l,tx,ty),tileL=tx*32,tileT=ty*32,r=rectFor(tx,ty,t);let s=null;
      if(r){if(right<=r.left||left>=r.right)s=null;else s=r.top;}
      else if(floorSlopes.has(t)){
        const x0=Math.max(0,left-tileL),x1=Math.min(32,right-tileL);if(x1>x0)s=tileT+Math.min(floorSurface(t,x0),floorSurface(t,x1));
      }
      if(s===null)continue;
      if(b.y<=s+.01&&ny>=s-.01)surface=surface===null?s:Math.min(surface,s);
    }
    return surface;
  }
  function move(l,b,dt,platforms=true){
    const oldY=b.y,wasGround=!!b.ground;b.wall=0;b.ground=false;b.platform=null;
    let dx=b.vx*dt,dy=b.vy*dt,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8));
    for(let i=0;i<n;i++){
      const stepX=dx/n,nx=b.x+stepX;
      if(blocked(l,nx,b.y,b.w,b.h)){
        let climbed=false;
        if(stepX&&(wasGround||b.ground||blocked(l,b.x,b.y+2,b.w,b.h))){
          for(let step=2;step<=18;step+=2){if(!blocked(l,b.x,b.y-step,b.w,b.h)&&!blocked(l,nx,b.y-step,b.w,b.h)){b.y-=step;b.x=nx;climbed=true;break;}}
        }
        if(!climbed){b.wall=Math.sign(stepX);b.vx=0;dx=0;}
      }else b.x=nx;
      const ny=b.y+dy/n;
      if(blocked(l,b.x,ny,b.w,b.h)){
        if(dy>=0){const surface=landingSurface(l,b,ny);if(surface!==null){b.ground=true;b.y=surface-.001;}}
        b.vy=0;dy=0;
      }else b.y=ny;
    }
    if(!b.ground&&b.vy>=0){const s=landingSurface(l,b,b.y+2);if(s!==null&&b.y<=s+2.01){b.y=s-.001;b.vy=0;b.ground=true;}}
    if(platforms&&b.vy>=0&&!b.drop){
      for(const p of l.platforms||[])if(!p.dead&&b.x+b.w/2>p.x&&b.x-b.w/2<p.x+p.w&&oldY<=p.y+2&&b.y>=p.y){b.y=p.y;b.vy=0;b.ground=true;b.platform=p;break;}
    }
    return b;
  }
  function addOneWayPlatform(l,x,y,w=64,opts={}){const p={x,y,w,originX:x,originY:y,phase:opts.phase||0,moving:!!opts.moving,oneWay:true,profile:opts.profile||'oneway'};(l.platforms||(l.platforms=[])).push(p);return p;}

  ND.tileRect=rectFor;ND.floorSurface=floorSurface;ND.ceilingSurface=ceilingSurface;ND.pointBlocked=pointBlocked;ND.blocked=blocked;ND.move=move;ND.addOneWayPlatform=addOneWayPlatform;

  const previousGenerate=ND.generate;
  function addV019Geometry(l,seed,stage){
    const random=ND.rng((seed^Math.imul(stage,0x9e3779b1)^0x56303139)>>>0);let thin=0,ramps=0,oneWays=0;
    for(let y=1;y<ND.C.rows-1;y++)for(let x=1;x<ND.C.cols-1;x++)if(ND.tileAt(l,x,y)===T.HALF_TOP&&random()<.16){ND.setTile(l,x,y,T.THIN_PLATFORM);thin++;}
    for(const room of l.rooms||[]){
      if(room.shop!==undefined)continue;const floor=room.oy+7;
      if(random()<.32){const x=room.ox+2+Math.floor(random()*6),t=ND.tileAt(l,x,floor-1);if(t===T.WALL&&ND.tileAt(l,x,floor-2)===T.AIR){ND.setTile(l,x,floor-1,random()<.5?T.SLOPE_MEDIUM_R:T.SLOPE_MEDIUM_L);ramps++;}}
      if(random()<.28){const x=(room.ox+2+Math.floor(random()*5))*32,y=(room.oy+3+Math.floor(random()*2))*32;addOneWayPlatform(l,x,y,64,{phase:random()*6});oneWays++;}
    }
    l.v019Geometry={thin,ramps,oneWays};l.validation=ND.validate(l);return l;
  }
  ND.addV019Geometry=addV019Geometry;
  ND.generate=function(seed,stage=1){return addV019Geometry(previousGenerate(seed,stage),seed,stage);};
})();
