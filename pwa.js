(()=>{
  const BUILD=document.documentElement.dataset.build;
  if(!BUILD)throw new Error('Missing generated build id');
  const versioned=src=>`${src}${src.includes('?')?'&':'?'}v=${BUILD}`;
  const status=()=>document.getElementById('networkStatus');
  const renderNetwork=()=>{
    const el=status();if(!el)return;const offline=!navigator.onLine;el.hidden=!offline;
    if(offline){el.textContent='OFFLINE · 基本診断は利用可';const weather=document.getElementById('weatherEmpty');if(weather)weather.textContent=document.documentElement.dataset.fieldLive==='on'?'オフライン中。魚の基本診断・保存済みプラン・FIELD MODEは利用できます。FIELD LIVEは接続復帰後に取得できます。':'オフライン中。魚の基本診断・保存済みプラン・FIELD MODEは利用できます。'}
  };
  window.addEventListener('online',()=>{renderNetwork();if(typeof toast==='function')toast('オンラインに復帰した')});
  window.addEventListener('offline',()=>{renderNetwork();if(typeof toast==='function')toast('オフラインモードへ切替')});
  renderNetwork();
  if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register(versioned('./sw.js'),{updateViaCache:'none'}).then(reg=>reg.update().catch(()=>{})).catch(err=>console.warn('SW registration failed',err))})}
  const loadCss=(href,key)=>{if(document.querySelector(`link[data-extension="${key}"]`))return;const css=document.createElement('link');css.rel='stylesheet';css.href=versioned(href);css.dataset.extension=key;document.head.appendChild(css)};
  const loadScript=(src,key)=>new Promise(resolve=>{if(document.querySelector(`script[data-extension="${key}"]`)){resolve();return}const js=document.createElement('script');js.src=versioned(src);js.async=false;js.dataset.extension=key;js.onload=resolve;js.onerror=()=>{console.warn('extension load failed',src);resolve()};document.body.appendChild(js)});
  loadCss('./continuity.css','continuity-css');loadCss('./target-methods-v1.css','target-methods-v1-css');loadCss('./tackle.css','tackle-css');loadCss('./fit-explain.css','fit-explain-css');loadCss('./simplify.css','simplify-css');loadCss('./visual-pass.css','visual-pass-css');loadCss('./visual-typography.css','visual-typography-css');loadCss('./fish-real.css','fish-real-css');loadCss('./visual-v8.css','visual-v8-css');
  (async()=>{
    await loadScript('./continuity.js','continuity-js');
    for(let i=1;i<=5;i++)await loadScript(`./target-method-data-v1-part${i}.js`,`target-method-data-v1-part${i}-js`);
    await loadScript('./target-method-data-v1.js','target-method-data-v1-js');
    for(let i=1;i<=5;i++)await loadScript(`./target-method-data-v2-part${i}.js`,`target-method-data-v2-part${i}-js`);
    await loadScript('./target-method-data-v2.js','target-method-data-v2-js');
    await loadScript('./target-methods-v1.js','target-methods-v1-js');
    await loadScript('./catalog-providers.js','catalog-providers-js');
    await loadScript('./catalog-adapters.js','catalog-adapters-js');
    await loadScript('./catalog-daiwa-poc.js','catalog-daiwa-poc-js');
    await loadScript('./catalog-shimano-poc.js','catalog-shimano-poc-js');
    await loadScript('./catalog-fixtures.js','catalog-fixtures-js');
    await loadScript('./catalog.js','catalog-js');
    await loadScript('./tackle.js','tackle-js');
    document.querySelectorAll('.catalogDevNote').forEach(el=>{el.textContent='CATALOG RESEARCH · DAIWA / SHIMANO公式公開スペックの事実データを含む。production利用は未承認。'});
    await loadScript('./fit-explain.js','fit-explain-js');
    await loadScript('./simplify.js','simplify-js');
    await loadScript('./visual-pass.js','visual-pass-js');
    await loadScript('./fish-real.js','fish-real-js');
    await loadScript('./visual-v8.js','visual-v8-js');
  })();
})();
