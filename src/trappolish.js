'use strict';
(() => {
  const baseUpdateTraps=Game.updateTraps;
  Game.updateTraps=function(dt){
    const all=this.l?.traps||[],crushers=all.filter(t=>t.type==='crusher'&&t.mountY!==undefined);
    if(!crushers.length)return baseUpdateTraps.call(this,dt);

    const ordinary=all.filter(t=>!crushers.includes(t));
    this.l.traps=ordinary;
    try{baseUpdateTraps.call(this,dt);}finally{this.l.traps=all;}

    const targets=[this.p,...this.entities.filter(e=>e.kind==='enemy'||e.kind==='crate')];
    for(const t of crushers){
      if(t.dead)continue;
      t.cool=Math.max(0,(t.cool||0)-dt);t.active=true;
      const factor=Math.pow(Math.max(0,Math.sin((this.time+t.phase)*1.6)),5);
      t.headY=t.restY+(t.downY-t.restY)*factor;
      for(const e of targets){
        if(e.dead||e.kind==='crate')continue;
        const hit=Math.abs(e.x-t.x)<23&&e.y-e.h<t.headY+20&&e.y>t.headY;
        if(hit&&t.cool<=0){this.damage(e,4,t.x,t.headY+18);t.cool=.5;}
      }
    }
  };

  if(typeof Render!=='undefined'&&Render.trap){
    const baseTrap=Render.trap;
    Render.trap=function(t){
      if(t.type!=='crusher'||t.mountY===undefined)return baseTrap.call(this,t);
      if(t.dead)return;
      const x=t.x,hy=t.headY??t.restY,m=t.mountY;
      this.rect(x-20,m-4,40,6,'#405361');
      this.rect(x-15,m-2,30,4,'#d8b776');
      this.line(x-8,m+2,x-8,hy,'#647785',5);
      this.line(x+8,m+2,x+8,hy,'#647785',5);
      this.rect(x-22,hy,44,18,'#738391');
      this.rect(x-22,hy+12,44,6,'#d8b776');
      for(let i=0;i<4;i++)this.line(x-20+i*12,hy+18,x-14+i*12,hy+12,'#374650',3);
    };
  }
})();
