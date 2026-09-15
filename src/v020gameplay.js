'use strict';
(() => {
  if(typeof Game==='undefined'||typeof ND==='undefined')return;

  function surfaceTop(l,tx,ty,x){
    const t=ND.tileAt(l,tx,ty);if(!t)return null;
    if(ND.floorSurface){const s=ND.floorSurface(t,x-tx*32);if(s!==null)return ty*32+s;}
    if(ND.tileRect){const r=ND.tileRect(tx,ty,t);if(r)return r.top;}
    return ND.solid(l,tx,ty)?ty*32:null;
  }

  function findLadderTopOut(l,p){
    const tx=Math.floor(p.x/32),probe=Math.floor((p.y-12)/32),rows=[probe,probe+1,probe-1,probe+2,probe-2];
    let row=rows.find(r=>r>=0&&r<ND.C.rows&&l.ladders?.[r*ND.C.cols+tx]);
    if(row===undefined)return null;
    while(row>0&&l.ladders[(row-1)*ND.C.cols+tx])row--;
    if(probe>row+1)return null;
    const dirs=p.face<0?[-1,1]:[1,-1],candidates=[];
    for(const dir of dirs){
      const sx=tx+dir;if(sx<=0||sx>=ND.C.cols-1)continue;
      for(const fy of [row,row+1]){
        if(fy<=0||fy>=ND.C.rows-1)continue;
        const cx=(sx+.5)*32,sy=surfaceTop(l,sx,fy,cx);if(sy===null)continue;
        if(sy<p.y-22||sy>p.y+40)continue;
        if(ND.blocked(l,cx,sy-.001,p.w||20,28))continue;
        candidates.push({x:cx,y:sy-.001,dir,score:Math.abs(sy-p.y)+(dir===(p.face||1)?0:3)});
      }
    }
    candidates.sort((a,b)=>a.score-b.score);return candidates[0]||null;
  }
  Game.findLadderTopOut=findLadderTopOut;

  const previousUpdatePlayer=Game.updatePlayer;
  Game.updatePlayer=function(dt){
    const p=this.p;if(!p)return previousUpdatePlayer.call(this,dt);
    const heldUp=Input.down('up'),heldDown=Input.down('down'),wasClimbing=!!p.climb&&ND.ladder(this.l,p)&&!p.ledge;
    previousUpdatePlayer.call(this,dt);
    if(!wasClimbing||!heldUp||heldDown||p.dead||p.stun>0||p.ledge)return;
    const top=findLadderTopOut(this.l,p);if(!top)return;
    p.x=top.x;p.y=top.y;p.vx=0;p.vy=0;p.ground=true;p.climb=false;p.platform=null;p.fallStart=p.y;p.climbRegrabLock=Math.max(p.climbRegrabLock||0,.12);p.face=top.dir;
    this.fx(p.x,p.y-4,'#9cefff',4,36);
  };

  function shopMerchant(game,shopId){return game.entities.find(e=>!e.dead&&e.kind==='enemy'&&e.type==='merchant'&&e.shop===shopId);}
  function triggerMerchantDefense(game,shopId,attacker=null){
    const m=shopMerchant(game,shopId);if(!m)return;
    if(attacker===game.p){game.anger(shopId);return;}
    if(attacker&&!attacker.dead&&attacker!==m){
      if(m.retaliate!==attacker)game.message('Q-9 / stock under attack.',1.8);
      m.retaliate=attacker;m.returningToShop=false;m.alertTarget=attacker;m.alertTimer=4;
    }else m.alertTimer=Math.max(m.alertTimer||0,4);
  }
  Game.triggerMerchantDefense=function(shopId,attacker=null){triggerMerchantDefense(this,shopId,attacker);};

  function segmentHitsStock(x1,y1,x2,y2,e){
    const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy||1,t=ND.clamp(((e.x-x1)*dx+((e.y-10)-y1)*dy)/len2,0,1),x=x1+dx*t,y=y1+dy*t;
    return Math.abs(x-e.x)<14&&y>e.y-25&&y<e.y+4;
  }

  const previousUpdateShots=Game.updateShots;
  Game.updateShots=function(dt){
    const records=this.shots.map(s=>({s,x:s.x,y:s.y}));
    previousUpdateShots.call(this,dt);
    for(const r of records){
      const s=r.s;if(!s||s.owner==='merchant')continue;
      s.shopHits=s.shopHits||new Set();
      for(const stock of this.entities){
        if(stock.dead||stock.kind!=='item'||stock.shop===undefined||s.shopHits.has(stock))continue;
        if(!segmentHitsStock(r.x,r.y,s.x,s.y,stock))continue;
        if(this.lineClear&&!this.lineClear(this.l,r.x,r.y,stock.x,stock.y-10))continue;
        s.shopHits.add(stock);stock.hit=.16;stock.vx=(s.vx||0)*.08;stock.vy=-35;this.fx(stock.x,stock.y-10,'#ffd58d',7,55);
        triggerMerchantDefense(this,stock.shop,s.from||null);
        s.life=0;break;
      }
    }
    this.shots=this.shots.filter(s=>s.life>0);
  };

  function nearbyThreat(game,e){
    let best=null,bestD=Infinity;
    for(const t of game.entities){
      if(t===e||t.dead||t.kind!=='enemy'||t.type==='merchant')continue;
      const d=Math.hypot(t.x-e.x,t.y-e.y);if(d>=180||d>=bestD)continue;
      if(game.lineClear&&!game.lineClear(game.l,e.x,e.y-e.h*.5,t.x,t.y-(t.h||24)*.5))continue;
      best=t;bestD=d;
    }
    return best;
  }

  function updateMerchantGuard(game,e,dt){
    const shop=game.l.shops[e.shop];if(!shop||shop.angry||e.retaliate||e.returningToShop)return false;
    if(e.freeze>0||e.foam>0||e.stun>0)return false;
    e.cool-=dt;e.hit=Math.max(0,e.hit-dt);e.alertTimer=Math.max(0,(e.alertTimer||0)-dt);
    const threat=nearbyThreat(game,e);if(threat){e.alertTarget=threat;e.alertTimer=2.5;}
    else if(!e.alertTimer)e.alertTarget=null;
    const left=shop.x+28,right=shop.x+shop.w-28;
    if(e.alertTimer>0){
      e.alertDir=e.alertDir||-1;if(e.x<=left+5)e.alertDir=1;if(e.x>=right-5)e.alertDir=-1;
      e.vx=ND.approach(e.vx,e.alertDir*58,650*dt);e.dir=e.alertTarget?Math.sign(e.alertTarget.x-e.x)||e.alertDir:e.alertDir;
    }else{
      const dx=e.homeX-e.x;
      if(Math.abs(dx)>3){e.vx=ND.approach(e.vx,Math.sign(dx)*75,700*dt);e.dir=Math.sign(dx)||-1;}
      else{e.vx=ND.approach(e.vx,0,900*dt);e.dir=shop.entry==='right'?1:-1;}
    }
    e.vy=Math.min(700,e.vy+ND.C.gravity*dt);ND.move(game.l,e,dt);
    if(e.wall){e.alertDir=-(e.alertDir||-1);e.vx=0;}
    if(e.x<left){e.x=left;e.vx=Math.max(0,e.vx);}if(e.x>right){e.x=right;e.vx=Math.min(0,e.vx);}
    return true;
  }

  const previousUpdateEnemy=Game.updateEnemy;
  Game.updateEnemy=function(e,dt){
    if(e.type==='merchant'&&updateMerchantGuard(this,e,dt))return;
    return previousUpdateEnemy.call(this,e,dt);
  };
})();
