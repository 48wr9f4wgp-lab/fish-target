(()=>{
  if(globalThis.__FISH_TARGET_ACCURACY__)return;
  globalThis.__FISH_TARGET_ACCURACY__=true;

  // Recommendation corrections live in data.js/app.js so a late-loading script
  // can never change an already rendered plan. Version wiring is removed in PR2.
  document.title='FISH TARGET v20';
  const version=document.querySelector('.version');
  if(version)version.textContent='V20';
  const resultBrand=document.querySelector('#result .toprow .brand');
  if(resultBrand)resultBrand.textContent='TARGET GAME PLAN · V20';
})();
