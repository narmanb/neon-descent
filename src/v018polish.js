'use strict';
(() => {
  if(typeof Render==='undefined'||typeof UI==='undefined'||typeof Game==='undefined')return;

  function makeHalfTileCaches(){
    if(!Render.cache||!Render.cache['1_0'])return;
    for(let v=0;v<4;v++){
      const src=Render.cache['1_'+v];
      if(!src)continue;
      const top=document.createElement('canvas');top.width=top.height=32;let c=top.getContext('2d');
      c.drawImage(src,0,0,32,16,0,0,32,16);
      c.fillStyle='#132431';c.fillRect(2,13,28,3);c.fillStyle='#5b7885';c.fillRect(3,12,26,1);
      Render.cache[ND.TILE.HALF_TOP+'_'+v]=top;

      const bottom=document.createElement('canvas');bottom.width=bottom.height=32;c=bottom.getContext('2d');
      c.drawImage(src,0,16,32,16,0,16,32,16);
      c.fillStyle='#6d8d99';c.fillRect(0,16,32,2);c.fillStyle='#415f6e';c.fillRect(3,19,26,1);
      Render.cache[ND.TILE.HALF_BOTTOM+'_'+v]=bottom;
    }
  }
  makeHalfTileCaches();

  async function finishFullscreenRequest(promise){
    try{await promise;if(document.fullscreenElement&&screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{}
  }
  function requestRunFullscreen(){
    if(document.fullscreenElement||!document.documentElement?.requestFullscreen)return null;
    try{return document.documentElement.requestFullscreen();}catch{return null;}
  }
  function beginFromTitle(){
    Game.initAudio();
    // Fullscreen must be requested directly inside the user's tap/click event.
    const fullscreen=requestRunFullscreen();
    Game.start();
    if(fullscreen&&typeof fullscreen.then==='function')finishFullscreenRequest(fullscreen);
  }
  function wireTitleStart(){const start=document.getElementById('start');if(start)start.onclick=beginFromTitle;}

  const previousTitle=UI.title.bind(UI);
  UI.title=function(){previousTitle();wireTitleStart();};
  wireTitleStart();

  window.NeonHalfBlocks={installCaches:makeHalfTileCaches};
})();
