(()=>{
  const status=()=>document.getElementById('networkStatus');
  const renderNetwork=()=>{
    const el=status();
    if(!el)return;
    const offline=!navigator.onLine;
    el.hidden=!offline;
    if(offline){
      el.textContent='OFFLINE · 基本診断は利用可';
      const weather=document.getElementById('weatherEmpty');
      if(weather)weather.textContent='オフライン中。魚の基本診断・保存済みプラン・FIELD MODEは利用できます。FIELD LIVEは接続復帰後に取得できます。';
    }
  };
  window.addEventListener('online',()=>{renderNetwork(); if(typeof toast==='function')toast('オンラインに復帰した')});
  window.addEventListener('offline',()=>{renderNetwork(); if(typeof toast==='function')toast('オフラインモードへ切替')});
  renderNetwork();
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('SW registration failed',err));
    });
  }

  // v16 continuity extension: keep the stable core markup intact and load after the app.
  if(!document.querySelector('link[data-v16-continuity]')){
    const css=document.createElement('link');
    css.rel='stylesheet';css.href='./continuity.css';css.dataset.v16Continuity='1';
    document.head.appendChild(css);
  }
  if(!document.querySelector('script[data-v16-continuity]')){
    const js=document.createElement('script');
    js.src='./continuity.js';js.async=false;js.dataset.v16Continuity='1';
    document.body.appendChild(js);
  }
})();
