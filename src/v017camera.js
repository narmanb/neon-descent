'use strict';
(() => {
  if(typeof Render==='undefined')return;

  function stableReferenceHeight(viewportHeight,screenWidth,screenHeight,touchPoints){
    const vh=Math.max(1,Number(viewportHeight)||1),sw=Number(screenWidth)||vh,sh=Number(screenHeight)||vh;
    const shortSide=Math.max(1,Math.min(sw,sh)),ratio=shortSide/vh;
    // Mobile browser chrome changes innerHeight between normal and fullscreen.
    // Use the physical screen short side as the scale reference when it is a
    // plausible match, so world pixels stay the same size in both modes.
    if(Number(touchPoints)>0&&ratio>=.98&&ratio<=1.55)return shortSide;
    return vh;
  }

  window.NeonCameraMath={stableReferenceHeight};
  Render.resize=function(){
    const d=Math.min(window.devicePixelRatio||1,2),vh=Math.max(1,innerHeight),vw=Math.max(1,innerWidth);
    const refH=stableReferenceHeight(vh,window.screen?.width,window.screen?.height,navigator.maxTouchPoints||0);
    const baseViewH=440/(this.zoom||1),viewH=baseViewH*(vh/refH);
    this.canvas.width=Math.round(vw*d);this.canvas.height=Math.round(vh*d);
    this.w=vw/vh*viewH;this.h=viewH;this.scale=this.canvas.height/viewH;
  };
  Render.resize();
})();
