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
})();
