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

  const loadCss=(href,key)=>{
    if(document.querySelector(`link[data-extension="${key}"]`))return;
    const css=document.createElement('link');css.rel='stylesheet';css.href=href;css.dataset.extension=key;document.head.appendChild(css);
  };
  const loadScript=(src,key)=>new Promise(resolve=>{
    if(document.querySelector(`script[data-extension="${key}"]`)){resolve();return}
    const js=document.createElement('script');js.src=src;js.async=false;js.dataset.extension=key;js.onload=resolve;js.onerror=()=>{console.warn('extension load failed',src);resolve()};document.body.appendChild(js);
  });

  loadCss('./continuity.css','continuity-css');
  loadCss('./tackle.css','tackle-css');
  (async()=>{
    await loadScript('./continuity.js','continuity-js');
    await loadScript('./tackle.js','tackle-js');
  })();
})();
