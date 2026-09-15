'use strict';
(() => {
  if(typeof Render==='undefined'||typeof ND==='undefined')return;
  const T=ND.TILE;
  const ids=[T.HALF_LEFT,T.HALF_RIGHT,T.THIN_PLATFORM,T.GLASS_PARTITION,T.BREAKABLE_WALL,T.SLOPE_SHALLOW_R,T.SLOPE_SHALLOW_L,T.SLOPE_MEDIUM_R,T.SLOPE_MEDIUM_L,T.SLOPE_STEEP_R,T.SLOPE_STEEP_L,T.CEIL_SHALLOW_R,T.CEIL_SHALLOW_L,T.CEIL_MEDIUM_R,T.CEIL_MEDIUM_L,T.CEIL_STEEP_R,T.CEIL_STEEP_L];
  function makeCache(id,v,draw){const cv=document.createElement('canvas');cv.width=cv.height=32;const c=cv.getContext('2d');draw(c,Render.cache['1_'+v],Render.cache['3_'+v]);Render.cache[id+'_'+v]=cv;}
  function clipImage(c,src,pts){if(!src)return;c.save();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.drawImage(src,0,0);c.restore();}
  function edge(c,pts,col='#7f9aa6'){c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function floorPoly(type){
    if(type===T.SLOPE_SHALLOW_R)return [[0,32],[32,16],[32,32]];
    if(type===T.SLOPE_SHALLOW_L)return [[0,16],[32,32],[0,32]];
    if(type===T.SLOPE_MEDIUM_R)return [[0,32],[32,0],[32,32]];
    if(type===T.SLOPE_MEDIUM_L)return [[0,0],[32,32],[0,32]];
    if(type===T.SLOPE_STEEP_R)return [[0,32],[16,0],[32,0],[32,32]];
    return [[0,0],[16,0],[32,32],[0,32]];
  }
  function ceilPoly(type){
    if(type===T.CEIL_SHALLOW_R)return [[0,0],[32,0],[32,16]];
    if(type===T.CEIL_SHALLOW_L)return [[0,0],[32,0],[0,16]];
    if(type===T.CEIL_MEDIUM_R)return [[0,0],[32,0],[32,32]];
    if(type===T.CEIL_MEDIUM_L)return [[0,0],[32,0],[0,32]];
    if(type===T.CEIL_STEEP_R)return [[0,0],[32,0],[32,32],[16,32]];
    return [[0,0],[32,0],[16,32],[0,32]];
  }
  function install(){
    if(!Render.cache||!Render.cache['1_0'])return;
    for(let v=0;v<4;v++){
      makeCache(T.HALF_LEFT,v,(c,wall)=>{c.drawImage(wall,0,0,16,32,0,0,16,32);c.fillStyle='#6b8792';c.fillRect(14,2,2,28);});
      makeCache(T.HALF_RIGHT,v,(c,wall)=>{c.drawImage(wall,16,0,16,32,16,0,16,32);c.fillStyle='#6b8792';c.fillRect(16,2,2,28);});
      makeCache(T.THIN_PLATFORM,v,(c,wall)=>{c.drawImage(wall,0,0,32,8,0,0,32,8);c.fillStyle='#77a2ad';c.fillRect(1,6,30,2);c.fillStyle='#1b3441';c.fillRect(4,8,24,2);});
      makeCache(T.GLASS_PARTITION,v,(c,wall,glass)=>{c.drawImage(glass||wall,12,0,8,32,12,0,8,32);c.fillStyle='#8eefff';c.fillRect(12,0,1,32);c.fillRect(19,0,1,32);});
      makeCache(T.BREAKABLE_WALL,v,(c,wall)=>{c.drawImage(wall,0,0);c.strokeStyle='#d6a879';c.lineWidth=1.5;c.beginPath();c.moveTo(7,7);c.lineTo(13,13);c.lineTo(10,19);c.lineTo(18,24);c.lineTo(24,18);c.stroke();c.fillStyle='#f0c28c';c.font='700 8px ui-monospace,monospace';c.fillText('B',23,9);});
      for(const id of [T.SLOPE_SHALLOW_R,T.SLOPE_SHALLOW_L,T.SLOPE_MEDIUM_R,T.SLOPE_MEDIUM_L,T.SLOPE_STEEP_R,T.SLOPE_STEEP_L])makeCache(id,v,(c,wall)=>{const p=floorPoly(id);clipImage(c,wall,p);edge(c,p.slice(0,p.length-1),'#7da0aa');});
      for(const id of [T.CEIL_SHALLOW_R,T.CEIL_SHALLOW_L,T.CEIL_MEDIUM_R,T.CEIL_MEDIUM_L,T.CEIL_STEEP_R,T.CEIL_STEEP_L])makeCache(id,v,(c,wall)=>{const p=ceilPoly(id);clipImage(c,wall,p);edge(c,p,'#688995');});
    }
  }
  install();
  window.NeonV019GeometryArt={install,ids};
})();
