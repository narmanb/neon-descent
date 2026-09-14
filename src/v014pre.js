'use strict';
(() => {
  // v0.14 camera migration. The previous default was 1.12. Move untouched/default
  // installs to a slightly closer 1.18 view while preserving any zoom the player
  // deliberately customized in Options.
  const key='neon-polish-settings';
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    if((saved.viewRevision||0)<2){
      if(saved.zoom===undefined||Math.abs(Number(saved.zoom)-1.12)<.001)saved.zoom=1.18;
      saved.viewRevision=2;
      localStorage.setItem(key,JSON.stringify(saved));
    }
  }catch{}
})();
