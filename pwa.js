(()=>{
  const BUILD=document.documentElement.dataset.build;
  if(!BUILD)throw new Error('Missing generated build id');
  const lureRuntime=document.documentElement.dataset.lureCatalogRuntime==='on';
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
  const loadCss=(href,key)=>new Promise(resolve=>{
    const found=document.querySelector(`link[data-extension="${key}"]`);
    if(found){if(found.sheet){resolve();return}found.addEventListener('load',resolve,{once:true});found.addEventListener('error',()=>resolve(),{once:true});return}
    const css=document.createElement('link');css.rel='stylesheet';css.href=versioned(href);css.dataset.extension=key;css.onload=resolve;css.onerror=()=>{console.warn('extension css load failed',href);resolve()};document.head.appendChild(css)
  });
  const loadScript=(src,key)=>new Promise(resolve=>{if(document.querySelector(`script[data-extension="${key}"]`)){resolve();return}const js=document.createElement('script');js.src=versioned(src);js.async=false;js.dataset.extension=key;js.onload=resolve;js.onerror=()=>{console.warn('extension load failed',src);resolve()};document.body.appendChild(js)});
  const extensionStyles=[
    ['./continuity.css','continuity-css'],['./target-methods-v1.css','target-methods-v1-css'],['./tackle.css','tackle-css'],['./fit-explain.css','fit-explain-css'],['./simplify.css','simplify-css'],['./visual-pass.css','visual-pass-css'],['./visual-typography.css','visual-typography-css'],['./fish-real.css','fish-real-css'],['./fish-photo-v27.css','fish-photo-v27-css'],['./visual-v8.css','visual-v8-css'],['./result-ux-v20.css','result-ux-v20-css'],['./result-ux-v23.css','result-ux-v23-css'],['./visual-v24.css','visual-v24-css'],['./visual-v25.css','visual-v25-css'],['./visual-v26.css','visual-v26-css']
  ];
  if(lureRuntime)extensionStyles.splice(12,0,['./lure-catalog.css','lure-catalog-css']);
  const extensionCss=Promise.all(extensionStyles.map(([href,key])=>loadCss(href,key)));
  const reveal=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{document.documentElement.classList.add('ft-ready');resolve()})));
  (async()=>{
    try{
      await loadScript('./continuity.js','continuity-js');
      for(let i=1;i<=5;i++)await loadScript(`./target-method-data-v1-part${i}.js`,`target-method-data-v1-part${i}-js`);
      await loadScript('./target-method-data-v1.js','target-method-data-v1-js');
      for(let i=1;i<=5;i++)await loadScript(`./target-method-data-v2-part${i}.js`,`target-method-data-v2-part${i}-js`);
      await loadScript('./target-method-data-v2.js','target-method-data-v2-js');
      for(let i=1;i<=5;i++)await loadScript(`./target-method-data-v3-part${i}.js`,`target-method-data-v3-part${i}-js`);
      await loadScript('./target-method-data-v3.js','target-method-data-v3-js');
      for(let i=1;i<=5;i++)await loadScript(`./target-method-data-v4-part${i}.js`,`target-method-data-v4-part${i}-js`);
      await loadScript('./target-method-data-v4.js','target-method-data-v4-js');
      await loadScript('./species-method-authoring-generated.js','species-method-authoring-generated-js');
      await loadScript('./species-method-authoring-runtime.js','species-method-authoring-runtime-js');
      await loadScript('./target-methods-v1.js','target-methods-v1-js');
      await loadScript('./species-registry.js','species-registry-js');
      await loadScript('./fish-asset-authoring-generated.js','fish-asset-authoring-generated-js');
      await loadScript('./fish-asset-manifest.js','fish-asset-manifest-js');
      await loadScript('./method-registry.js','method-registry-js');
      await loadScript('./resolver-engine.js','resolver-engine-js');
      await loadScript('./catalog-loader.js','catalog-loader-js');
      await loadScript('./tackle.js','tackle-js');
      await loadScript('./resolver-shadow.js','resolver-shadow-js');
      await loadScript('./fit-explain.js','fit-explain-js');
      await loadScript('./simplify.js','simplify-js');
      await loadScript('./visual-pass.js','visual-pass-js');
      await loadScript('./fish-real.js','fish-real-js');
      await loadScript('./visual-v8.js','visual-v8-js');
      await loadScript('./result-ux-v20.js','result-ux-v20-js');
      await loadScript('./result-ux-v21.js','result-ux-v21-js');
      await loadScript('./result-ux-v23.js','result-ux-v23-js');
      if(lureRuntime)await loadScript('./lure-catalog-entry.js','lure-catalog-entry-js');
      await loadScript('./resolver-tackle-ui.js','resolver-tackle-ui-js');
      await loadScript('./app-shell-v26.js','app-shell-v26-js');
      await loadScript('./fish-photo-v27.js','fish-photo-v27-js');
    }catch(err){console.error('extension bootstrap failed',err)}
    await extensionCss.catch(err=>console.warn('extension css bootstrap failed',err));
    await reveal();
  })();
})();