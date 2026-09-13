'use strict';
const ND = (() => {
  const C = {tile:32,cols:42,rows:34,roomW:10,roomH:8,roomCols:4,roomRows:4,
    gravity:1250,speed:170,jump:420,fallLimit:208,pursuerTime:180,maxParticles:260};
  const TILE = {AIR:0,WALL:1,STEEL:2,GLASS:3,REACTOR:4,CRUMBLE:5,BOUND:6,DOOR:7,BARRIER:8};
  const ITEMS = [
    ['jump','Kinetic Jump Boots','passive',950,'Jump higher. Reach upper galleries.','↟','#64ebaf'],
    ['grip','Magnetic Grip Gloves','passive',1100,'Hold UP against a wall to climb.','⌁','#64ebaf'],
    ['traction','Traction Boots','passive',700,'Electric floor immunity, fast braking and stronger stomps.','↯','#64ebaf'],
    ['adhesive','Adhesive Charge Module','passive',850,'Thrown charges stick to surfaces and enemies.','✳','#ffb36a'],
    ['scanner','Exit Scanner','passive',450,'Tracks the exit on your HUD.','⌖','#72e5f0'],
    ['optics','Optical Augment','passive',550,'Brightens blackouts and reveals hidden cache markers.','◉','#72e5f0'],
    ['decel','Emergency Decelerator','passive',350,'Single use: arrests one dangerous fall.','⌄','#72e5f0'],
    ['glide','Energy Glide Mantle','back',1300,'Hold JUMP while falling to glide.','⋁','#b69cff'],
    ['jet','Jet Unit','back',2300,'Hold JUMP in the air to fly. Land to refuel.','⇡','#b69cff'],
    ['hover','Hover Unit','back',1700,'Hold JUMP in the air to hover. Land to refuel.','═','#b69cff'],
    ['core','Overdrive Power Core','back',1800,'Stronger attacks, larger blasts, less recoil.','✦','#ff957e'],
    ['shotgun','Pulse Shotgun','hand',1400,'Five-pellet blast. 24 shots.','SG','#ffb36a'],
    ['cryo','Cryo Rifle','hand',1150,'Freezes targets; strike again to shatter. 30 shots.','CR','#80e3ff'],
    ['bolt','Bolt Launcher','hand',900,'Launches recoverable bolts. 16 bolts.','BL','#ffb36a'],
    ['foam','Restraint Foam Gun','hand',800,'Immobilizes enemies for four seconds. 35 shots.','FG','#d0a9ff'],
    ['phase','Phase Teleporter','hand',1400,'Phase four tiles ahead into free space. 16 uses.','PH','#b69cff'],
    ['cutter','Plasma Cutter','hand',950,'Cuts normal walls and glass. 35 uses.','PC','#ff957e'],
    ['disc','Smart Disc','hand',850,'Throw a returning cutting disc.','SD','#ffb36a'],
    ['blade','Mono-Blade','hand',900,'Longer reach. Triple melee damage.','MB','#ffb36a'],
    ['shield','Riot Barrier','hand',750,'Facing shield blocks bullets; attack to shove.','RB','#72e5f0'],
    ['override','Master Override','passive',2100,'Unlock all ordinary security doors.','∞','#b69cff'],
    ['bombs','Plasma Charge Pack','supply',300,'Adds 3 plasma charges.','+3','#ffb36a'],
    ['bombcrate','Plasma Charge Crate','supply',850,'Adds 10 plasma charges.','+10','#ffb36a'],
    ['cables','Mag-Cable Bundle','supply',250,'Adds 3 climbing cables.','+3','#72e5f0'],
    ['health','Health Injector','supply',400,'Restores 2 health, up to 8.','+HP','#64ebaf']
  ].map(([id,name,slot,price,desc,glyph,color])=>({id,name,slot,price,desc,glyph,color}));
  const item = Object.fromEntries(ITEMS.map(x=>[x.id,x]));
  function rng(seed) {let a=seed>>>0; return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const approach=(a,b,s)=>a<b?Math.min(b,a+s):Math.max(b,a-s);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function tileAt(l,x,y){x=Math.floor(x);y=Math.floor(y);return x<0||y<0||x>=C.cols||y>=C.rows?TILE.BOUND:l.tiles[y*C.cols+x];}
  function setTile(l,x,y,v){if(x>0&&y>0&&x<C.cols-1&&y<C.rows-1)l.tiles[y*C.cols+x]=v;}
  function solid(l,x,y){return tileAt(l,x,y)!==0;}
  function blocked(l,x,y,w=20,h=28){for(let ty=Math.floor((y-h)/32);ty<=Math.floor((y-.01)/32);ty++)for(let tx=Math.floor((x-w/2)/32);tx<=Math.floor((x+w/2-.01)/32);tx++)if(solid(l,tx,ty))return true;return false;}
  function body(x,y,w=20,h=28){return {x,y,w,h,vx:0,vy:0,ground:false,wall:0,fallStart:y};}
  function move(l,b,dt,platforms=true){
    const oldY=b.y; b.wall=0;b.ground=false;
    let dx=b.vx*dt,dy=b.vy*dt,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8));
    for(let i=0;i<n;i++){
      let nx=b.x+dx/n;
      if(blocked(l,nx,b.y,b.w,b.h)){b.wall=Math.sign(dx);b.vx=0;dx=0;}else b.x=nx;
      let ny=b.y+dy/n;
      if(blocked(l,b.x,ny,b.w,b.h)){
        if(dy>=0){b.ground=true; b.y=Math.floor((ny-.01)/32)*32-.001;}
        b.vy=0;dy=0;
      }else b.y=ny;
    }
    if(platforms&&b.vy>=0&&!b.drop){
      for(const p of l.platforms||[]){if(!p.dead&&b.x+b.w/2>p.x&&b.x-b.w/2<p.x+p.w&&oldY<=p.y+2&&b.y>=p.y){b.y=p.y;b.vy=0;b.ground=true;b.platform=p;break;}}
    }
    return b;
  }
  function ladder(l,b){let tx=Math.floor(b.x/32);let ty=Math.floor((b.y-12)/32);return l.ladders[ty*C.cols+tx]||l.cables.some(c=>Math.abs(b.x-c.x)<18&&b.y>c.top&&b.y-20<c.bottom);}
  const MODIFIERS=['Nominal Systems','Power Failure','Security Alert','Reactor Instability','Abandoned Sector','High Voltage','Cargo Sector'];
  const ROOM_TEMPLATES=['gallery','split','laboratory','cargo','maintenance','reactor'];
  function generate(seed,stage=1){
    const r=rng(seed+stage*7919),pick=a=>a[Math.floor(r()*a.length)],ri=(a,b)=>a+Math.floor(r()*(b-a+1));
    const l={seed,stage,tiles:new Uint8Array(C.cols*C.rows),ladders:new Uint8Array(C.cols*C.rows),
      platforms:[],cables:[],spawns:[],shops:[],doors:[],secrets:[],decor:[],traps:[],rooms:[],route:[],modifier:MODIFIERS[stage===1?0:ri(0,6)],repairs:0};
    for(let y=0;y<C.rows;y++)for(let x=0;x<C.cols;x++)if(!x||!y||x===C.cols-1||y===C.rows-1)l.tiles[y*C.cols+x]=6;
    // Template interiors provide upper routes, cover and loot shelves. Row connectors are carved afterwards.
    for(let ry=0;ry<4;ry++)for(let rx=0;rx<4;rx++){
      const ox=1+rx*10,oy=1+ry*8,f=oy+7,kind=pick(ROOM_TEMPLATES);l.rooms.push({rx,ry,ox,oy,kind});
      for(let x=ox;x<ox+10;x++)setTile(l,x,f,1);
      if(kind==='gallery'||kind==='laboratory'){
        for(let x=ox+2;x<ox+8;x++)setTile(l,x,oy+3,kind==='laboratory'?3:1);
        setTile(l,ox+1,oy+5,1);setTile(l,ox+8,oy+5,1);
      } else if(kind==='split') {
        for(let x=ox;x<ox+4;x++)setTile(l,x,oy+3,1);
        for(let x=ox+6;x<ox+10;x++)setTile(l,x,oy+4,1);
      } else if(kind==='cargo'){
        for(let x=ox+1;x<ox+4;x++)setTile(l,x,oy+5,1);
        for(let x=ox+6;x<ox+9;x++)setTile(l,x,oy+3,1);
      } else if(kind==='maintenance'){
        for(let x=ox+3;x<ox+7;x++)setTile(l,x,oy+4,5);
        for(let y=oy+1;y<f;y++)l.ladders[y*C.cols+ox+2]=1;
      } else {
        for(let x=ox+1;x<ox+9;x++)if(x!==ox+4&&x!==ox+5)setTile(l,x,oy+4,2);
        setTile(l,ox+8,oy+3,4);
      }
      // Small, jumpable lower obstacles; connector safety is established separately.
      if(r()<.6)setTile(l,ox+ri(3,6),f-1,r()<.14?3:1);
      l.decor.push({x:(ox+ri(2,7))*32,y:(oy+1)*32,kind:ri(0,3),phase:r()*6});
    }
    let col=ri(0,3);let startCol=col;
    for(let row=0;row<4;row++){
      let target=ri(0,3);if(target===col)target=(target+1+ri(0,1))%4;
      const floor=8+8*row;let shaft=1+target*10+ri(2,7);
      l.route.push({row,from:col,to:target,shaft,floor});
      // Two clear body rows, jumpable cover and a full-height climbable descent.
      const lo=1+Math.min(col,target)*10,hi=10+Math.max(col,target)*10;
      for(let x=lo;x<=hi;x++){setTile(l,x,floor-2,0);setTile(l,x,floor-3,0);}
      if(row<3){
        for(let y=floor-3;y<floor+8;y++){setTile(l,shaft,y,0);setTile(l,shaft+1,y,0);l.ladders[y*C.cols+shaft]=1;}
        // A rim on each side of the shaft makes the drop readable.
        setTile(l,shaft-1,floor,2);setTile(l,shaft+2,floor,2);
      }else l.exit={x:(shaft+.5)*32,y:floor*32};
      col=target;
    }
    l.entrance={x:(1+startCol*10+2.5)*32,y:8*32};
    for(let x=Math.floor(l.entrance.x/32)-1;x<=Math.floor(l.entrance.x/32)+1;x++){setTile(l,x,7,0);setTile(l,x,6,0);}
    setTile(l,Math.floor(l.exit.x/32),31,0);setTile(l,Math.floor(l.exit.x/32),30,0);
    // An initial validator runs before any optional security rooms are added.
    l.initialValidation=validate(l);
    if(!l.initialValidation.ok){
      for(let y of [7,15,23,31])for(let x=1;x<41;x++)setTile(l,x,y,0);
      l.repairs++;l.initialValidation=validate(l);
    }
    for(const room of l.rooms){
      const {ox,oy,rx,ry}=room,f=oy+7;
      // Upper optional shop, approached using a permanent ladder from the public floor.
      const shopRoom=rx===((startCol+2+ry)%4)&&ry<3&&(ry===0||r()<.72)&&l.modifier!=='Abandoned Sector';
      if(shopRoom){
        for(let y=oy;y<oy+4;y++)for(let x=ox+1;x<ox+9;x++)setTile(l,x,y,0);
        for(let x=ox+1;x<ox+9;x++)setTile(l,x,oy+4,1);
        for(let y=oy+2;y<f;y++){setTile(l,ox,y,0);l.ladders[y*C.cols+ox]=1;}
        const categories=[['bombs','cables','scanner','optics','decel','health'],['jump','grip','traction','adhesive','blade','shield'],['shotgun','cryo','bolt','foam','disc','cutter'],['jet','hover','core','glide','phase','override']];
        const category=ri(0,3),pool=categories[category].slice(),ids=[];
        for(let i=0;i<3;i++)ids.push(pool.splice(ri(0,pool.length-1),1)[0]);
        const shop={id:l.shops.length,x:(ox+1)*32,y:oy*32,w:8*32,h:4*32,name:['SUPPLY / Q-9','AUGMENTS / Q-9','ARMORY / Q-9','RARE TECH / Q-9'][category],angry:false};
        l.shops.push(shop);
        ids.forEach((id,i)=>l.spawns.push({kind:'item',id,x:(ox+2.2+i*2)*32,y:(oy+4)*32,shop:shop.id,price:item[id].price}));
        l.spawns.push({kind:'enemy',type:'merchant',x:(ox+8)*32,y:(oy+4)*32,shop:shop.id});
        room.shop=shop.id;
      }else if(r()<.4){
        // Upper sealed room: never touches the protected two-row public corridor.
        let x=ox+3,y=oy+1;
        for(let tx=x;tx<=x+4;tx++){setTile(l,tx,y,2);setTile(l,tx,y+3,1);}
        for(let ty=y+1;ty<y+3;ty++){
          setTile(l,x,ty,1);setTile(l,x+4,ty,7);
          for(let tx=x+1;tx<x+4;tx++)setTile(l,tx,ty,0);
        }
        const door={x:x+4,y:y+1,key:`K${l.doors.length+1}`,open:false,energy:r()<.22};l.doors.push(door);
        if(door.energy){setTile(l,door.x,door.y,8);setTile(l,door.x,door.y+1,8);l.spawns.push({kind:'switch',doorKey:door.key,x:(ox+8.5)*32,y:f*32});}
        else l.spawns.push({kind:'key',id:door.key,x:(ox+8.5)*32,y:f*32});
        const reward=ri(0,4);
        if(reward<2)l.spawns.push({kind:'item',id:pick(ITEMS.filter(i=>i.slot!=='supply')).id,x:(x+2.5)*32,y:(y+3)*32});
        else if(reward===2)for(let k=0;k<3;k++)l.spawns.push({kind:'coin',value:250,x:(x+1.5+k*.8)*32,y:(y+3)*32});
        else if(reward===3)l.spawns.push({kind:'enemy',type:'mimic',x:(x+2.5)*32,y:(y+3)*32});
        l.secrets.push({x:(x+2.5)*32,y:(y+2)*32,kind:reward});room.vault=true;
      }
      // Side platforms and obstacles host loot and enemies. Keep immediate entrance/exit clear.
      const surfaces=[];
      for(let y=oy+1;y<=f;y++)for(let x=ox;x<ox+10;x++)if(solid(l,x,y)&&!solid(l,x,y-1)&&!solid(l,x,y-2)&&tileAt(l,x,y)!==7)surfaces.push({x:(x+.5)*32,y:y*32});
      const safe=s=>Math.hypot(s.x-l.entrance.x,s.y-l.entrance.y)>145&&Math.hypot(s.x-l.exit.x,s.y-l.exit.y)>85&&!l.shops.some(q=>s.x>q.x&&s.x<q.x+q.w&&s.y<=q.y+q.h&&s.y>q.y);
      for(let i=0;i<ri(3,5);i++){const s=pick(surfaces);if(s)l.spawns.push({kind:'coin',value:pick([40,60,80,120]),...s});}
      const spot=pick(surfaces.filter(safe));
      if(spot){l.spawns.push({kind:'crate',...spot});if(r()<.28)l.spawns.push({kind:'item',id:pick(['bombs','cables','health','jump','decel']),x:spot.x+20,y:spot.y});}
      const enemies=['crawler','flyer','slug','sentry','skitter','burrow','enforcer','detonator','phase','mimic'];
      for(let i=0;i<(l.modifier==='Security Alert'?3:2);i++){
        const s=pick(surfaces.filter(safe));if(s)l.spawns.push({kind:'enemy',type:pick(enemies.slice(0,Math.min(10,stage*3+2))),...s});
      }
      // Hazards stay out of the guaranteed lower corridor; combat can still enter it.
      const upper=surfaces.filter(s=>safe(s)&&s.y<f*32-40);
      if(upper.length&&!shopRoom){const s=pick(upper);l.traps.push({x:s.x,y:s.y,type:pick(['mine','spikes','electric','turret','laser','crusher']),phase:r()*5,cool:0});}
      if(room.kind==='cargo'&&!shopRoom){l.platforms.push({x:(ox+4)*32,y:(oy+3)*32,w:64,originX:(ox+4)*32,originY:(oy+3)*32,phase:r()*6,moving:true});}
    }
    // Three accessible supplies make exploration possible without depending on lucky early drops.
    l.spawns.push({kind:'coin',value:200,x:l.entrance.x+30,y:l.entrance.y});
    l.validation=validate(l);
    if(!l.validation.ok){
      // Optional features may intersect a shaft. Restore only certified connector cells.
      for(const s of l.route)if(s.row<3)for(let y=s.floor-3;y<s.floor+8;y++){setTile(l,s.shaft,y,0);setTile(l,s.shaft+1,y,0);l.ladders[y*C.cols+s.shaft]=1;}
      for(let y of [7,15,23,31])for(let x=1;x<41;x++)setTile(l,x,y,0);
      l.repairs++;l.validation=validate(l);
    }
    if(!l.validation.ok)throw Error('Unreachable stage '+seed+':'+stage);
    return l;
  }
  // Physics-backed baseline route verifier. Each row is physically walked/jumped, then its
  // permanent ladder is descended. Uses exactly the runtime AABB collision/gravity/jump.
  // No inventory, bombs, ropes, keycards or upgrades participate. Checks the exit, not flood-fill.
  function validate(l){
    const b=body(l.entrance.x,l.entrance.y-.01);b.ground=true;let frames=0;const segments=[];
    for(const s of l.route){
      const tx=s.row===3?l.exit.x:(s.shaft+.5)*32,targetY=(s.floor+8)*32-.001;
      let reached=false,jumps=0;
      for(let i=0;i<1500;i++){
        const dx=tx-b.x;
        if(Math.abs(dx)<2){reached=true;break;}
        let dir=Math.sign(dx);b.vx=dir*Math.min(C.speed,Math.abs(dx)*60);
        if((b.ground||solid(l,Math.floor(b.x/32),Math.floor((b.y+1)/32)))&&blocked(l,b.x+dir*12,b.y,b.w,b.h)) {b.vy=-C.jump;jumps++;}
        b.vy=Math.min(620,b.vy+C.gravity/60);move(l,b,1/60,false);frames++;
        if(b.y>s.floor*32+150)break;
      }
      if(!reached)return {ok:false,row:s.row,reason:'horizontal',x:b.x,y:b.y};
      segments.push({x:tx,y:s.floor*32,jumps});
      if(s.row<3){
        for(let i=0;i<200;i++){
          if(b.y>=targetY-1)break;
          if(!ladder(l,b))return {ok:false,row:s.row,reason:'ladder',x:b.x,y:b.y};
          b.vx=0;b.vy=130;move(l,b,1/60,false);frames++;
        }
        if(Math.abs(b.y-targetY)>3)return {ok:false,row:s.row,reason:'descent',y:b.y};
      }
    }
    // Settle onto the bottom exit's natural floor.
    for(let i=0;i<90&&!b.ground;i++){b.vy+=C.gravity/60;move(l,b,1/60,false);}
    return {ok:Math.abs(b.x-l.exit.x)<4&&Math.abs(b.y-l.exit.y)<4,frames,segments};
  }
  return {C,TILE,ITEMS,item,rng,clamp,approach,dist,tileAt,setTile,solid,blocked,body,move,ladder,generate,validate,MODIFIERS,ROOM_TEMPLATES};
})();
if(typeof module!=='undefined')module.exports=ND;
