'use strict';
(() => {
  // v0.17 camera migration. 150% is now the intended default. Preserve any
  // deliberately customized zoom, but move untouched legacy defaults forward.
  const key='neon-polish-settings';
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    if((saved.viewRevision||0)<3){
      const z=saved.zoom===undefined?undefined:Number(saved.zoom);
      if(z===undefined||Math.abs(z-1.12)<.001||Math.abs(z-1.18)<.001)saved.zoom=1.50;
      saved.viewRevision=3;
      localStorage.setItem(key,JSON.stringify(saved));
    }
  }catch{}
})();
