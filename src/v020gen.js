'use strict';
(() => {
  if(typeof ND==='undefined')return;

  const previousGenerate=ND.generate;
  const FLOOR_TRAPS=new Set(['mine','spikes','electric','turret','laser']);
  const trapSize=t=>({mine:[28,16],spikes:[30,12],electric:[30,10],turret:[28,24],laser:[18,28]}[t.type]||[24,24]);

  function ladderConflict(l,t){
    const [w,h]=trapSize(t),left=t.x-w/2-3,right=t.x+w/2+3,top=t.y-h-6,bottom=t.y+10;
    for(let ty=Math.max(0,Math.floor(top/32));ty<=Math.min(ND.C.rows-1,Math.floor(bottom/32));ty++){
      for(let tx=Math.max(0,Math.floor(left/32));tx<=Math.min(ND.C.cols-1,Math.floor(right/32));tx++){
        if(l.ladders?.[ty*ND.C.cols+tx])return true;
      }
    }
    return false;
  }

  function supported(l,t){
    if(!FLOOR_TRAPS.has(t.type))return true;
    const [w]=trapSize(t),probeY=t.y+3,spread=Math.min(8,w*.25);
    return [t.x,t.x-spread,t.x+spread].some(x=>ND.pointBlocked?ND.pointBlocked(l,x,probeY):ND.solid(l,Math.floor(x/32),Math.floor(probeY/32)));
  }

  function sanitizeTraps(l){
    let ladder=0,floating=0;
    l.traps=(l.traps||[]).filter(t=>{
      if(ladderConflict(l,t)){ladder++;return false;}
      if(!supported(l,t)){floating++;return false;}
      return true;
    });
    l.v020TrapRepairs={ladder,floating,total:ladder+floating};
  }

  function ladderCutsVault(l,room){
    if(!room.vault)return false;
    const x0=room.ox+3,y0=room.oy+1;
    for(let y=y0;y<=y0+3;y++)for(let x=x0;x<=x0+4;x++)if(l.ladders?.[y*ND.C.cols+x])return true;
    return false;
  }

  function openBypassedVaults(l){
    let converted=0;
    for(const room of l.rooms||[]){
      if(!ladderCutsVault(l,room))continue;
      const x0=room.ox+3,y0=room.oy+1;
      const affected=(l.doors||[]).filter(d=>d.x>=x0&&d.x<=x0+4&&d.y>=y0&&d.y<=y0+2);
      const keys=new Set(affected.map(d=>d.key));
      for(const d of affected){d.open=true;ND.setTile(l,d.x,d.y,ND.TILE.AIR);ND.setTile(l,d.x,d.y+1,ND.TILE.AIR);}
      l.spawns=(l.spawns||[]).filter(s=>!(s.kind==='key'&&keys.has(s.id))&&!(s.kind==='switch'&&keys.has(s.doorKey)));
      room.vault=false;room.openOptional=true;room.vaultBypassConverted=true;converted++;
    }
    l.v020BypassedVaults=converted;
  }

  function floorSupports(l,x,floorY){
    const px=(x+.5)*32,py=floorY*32+3;
    return ND.pointBlocked?ND.pointBlocked(l,px,py):ND.solid(l,x,floorY);
  }

  function spreadColumns(cols,count){
    if(!cols.length||count<=0)return [];
    if(count===1)return [cols[Math.floor((cols.length-1)/2)]];
    const out=[];
    for(let i=0;i<count;i++)out.push(cols[Math.round(i*(cols.length-1)/(count-1))]);
    return out;
  }

  function arrangeShops(l){
    let arranged=0;
    for(const q of l.shops||[]){
      const x0=Math.round(q.x/32),x1=x0+Math.round(q.w/32)-1,floorY=Math.round((q.y+q.h)/32);
      const floorCols=[];for(let x=x0+1;x<x1;x++)if(floorSupports(l,x,floorY))floorCols.push(x);
      if(!floorCols.length)continue;
      const back=q.entry==='right'?floorCols[0]:floorCols[floorCols.length-1];
      const merchant=(l.spawns||[]).find(s=>s.kind==='enemy'&&s.type==='merchant'&&s.shop===q.id);
      if(merchant){merchant.x=(back+.5)*32;merchant.y=floorY*32;merchant.shopHome='back';}
      const stock=(l.spawns||[]).filter(s=>s.kind==='item'&&s.shop===q.id);
      const stockCols=floorCols.filter(x=>x!==back),places=spreadColumns(stockCols,Math.min(stock.length,stockCols.length));
      stock.forEach((s,i)=>{const col=places[Math.min(i,places.length-1)];if(col!==undefined){s.x=(col+.5)*32;s.y=floorY*32;}});
      q.merchantBackX=(back+.5)*32;q.floorY=floorY*32;arranged++;
    }
    l.v020ArrangedShops=arranged;
  }

  ND.v020LadderConflict=ladderConflict;
  ND.v020LadderCutsVault=ladderCutsVault;
  ND.generate=function(seed,stage=1){
    const l=previousGenerate(seed,stage);
    openBypassedVaults(l);
    arrangeShops(l);
    sanitizeTraps(l);
    l.validation=ND.validate(l);
    return l;
  };
})();
