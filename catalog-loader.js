(()=>{
  const BUILD=document.documentElement.dataset.build||'dev';
  const versioned=src=>`${src}${src.includes('?')?'&':'?'}v=${BUILD}`;
  const coreAssets=['catalog-providers.js','catalog-adapters.js'];
  const tailAssets=['catalog-fixtures.js','catalog.js'];
  let runtime=null;
  let loading=null;
  let manifest=null;
  const state={status:'idle',productCount:0,batchCount:0,error:null,assets:[]};

  const statusInfo=status=>({
    current:{label:'現行',selectable:true,needsReview:false},
    discontinued:{label:'廃番',selectable:true,needsReview:true},
    legacy:{label:'旧モデル',selectable:true,needsReview:true},
    unknown:{label:'状態不明',selectable:true,needsReview:true}
  })[status]||{label:'状態不明',selectable:true,needsReview:true};

  const manifestUrl=()=>versioned('./catalog-batch-manifest.json');
  async function loadManifest(){
    if(manifest)return manifest;
    const response=await fetch(manifestUrl(),{cache:'no-cache'});
    if(!response.ok)throw new Error(`Catalog manifest failed: ${response.status}`);
    const parsed=await response.json();
    if(!parsed||!Array.isArray(parsed.batches))throw new Error('Catalog manifest is invalid');
    const ids=new Set(),files=[];
    for(const batch of parsed.batches){
      if(!batch?.id||ids.has(batch.id))throw new Error(`Catalog manifest duplicate/missing batch id: ${batch?.id||'missing'}`);
      ids.add(batch.id);
      if(!Array.isArray(batch.files)||!batch.files.length)throw new Error(`Catalog batch has no files: ${batch.id}`);
      for(const file of batch.files){if(!files.includes(file))files.push(file)}
    }
    manifest=Object.freeze({...parsed,batches:Object.freeze(parsed.batches.map(x=>Object.freeze({...x,files:Object.freeze(x.files.slice())})))});
    state.batchCount=manifest.batches.length;
    state.assets=[...coreAssets,...files,...tailAssets];
    return manifest;
  }

  const loadScript=src=>new Promise((resolve,reject)=>{
    const existing=document.querySelector(`script[data-catalog-lazy="${src}"]`);
    if(existing){
      if(existing.dataset.loaded==='1')resolve();
      else{
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error(`Catalog asset failed: ${src}`)),{once:true});
      }
      return;
    }
    const js=document.createElement('script');
    js.src=versioned(`./${src}`);
    js.async=false;
    js.dataset.catalogLazy=src;
    js.addEventListener('load',()=>{js.dataset.loaded='1';resolve()},{once:true});
    js.addEventListener('error',()=>reject(new Error(`Catalog asset failed: ${src}`)),{once:true});
    document.body.appendChild(js);
  });

  async function ensureLoaded(){
    if(runtime)return runtime;
    if(loading)return loading;
    state.status='loading';state.error=null;
    loading=(async()=>{
      try{
        const m=await loadManifest();
        const batchAssets=[];
        for(const batch of m.batches)for(const file of batch.files)if(!batchAssets.includes(file))batchAssets.push(file);
        const lazyAssets=[...coreAssets,...batchAssets,...tailAssets];
        state.assets=lazyAssets.slice();
        for(const asset of lazyAssets)await loadScript(asset);
        const loaded=globalThis.FISH_TARGET_CATALOG;
        if(!loaded||loaded===facade||typeof loaded.loadPage!=='function')throw new Error('Catalog runtime did not initialize');
        runtime=loaded;
        globalThis.FISH_TARGET_CATALOG_RUNTIME=runtime;
        globalThis.FISH_TARGET_CATALOG=facade;
        state.status='ready';state.productCount=runtime.products?.length||0;
        return runtime;
      }catch(err){
        state.status='error';state.error=String(err?.message||err);loading=null;
        globalThis.FISH_TARGET_CATALOG=facade;
        throw err;
      }
    })();
    return loading;
  }

  const hiddenStub=()=>Object.freeze({items:[],total:0,offset:0,limit:100,hasMore:false,deferred:true});
  const facade={
    mode:'lazy',version:'V23-DEV2-LAZY1',makers:['DAIWA','SHIMANO'],categories:['rod','reel'],
    statuses:['current','discontinued','legacy','unknown'],
    licenseStatuses:['synthetic','internal','permitted','licensed','restricted','unknown'],
    ensureLoaded,
    index:opts=>runtime?.index?.(opts)||null,
    makersFor:category=>runtime?.makersFor?.(category)||['DAIWA','SHIMANO'],
    seriesFor:(maker,category)=>runtime?.seriesFor?.(maker,category)||[''],
    get:id=>runtime?.get?.(id)||null,
    statusInfo:status=>runtime?.statusInfo?.(status)||statusInfo(status),
    ownedSnapshot:(product,opts)=>runtime?.ownedSnapshot?.(product,opts)||null,
    productionEligible:product=>runtime?.productionEligible?.(product)||false,
    providerFor:maker=>runtime?.providerFor?.(maker)||null,
    productId:spec=>runtime?.productId?.(spec)||null,
    validateProduct:(product,opts)=>runtime?.validateProduct?.(product,opts)||['catalog not loaded'],
    validateCatalog:(items,opts)=>runtime?.validateCatalog?.(items,opts)||[{product_id:null,errors:['catalog not loaded']}],
    list:criteria=>runtime?.list?.(criteria)||[],
    search:criteria=>runtime?.search?.(criteria)||hiddenStub(),
    async loadPage(criteria={}){
      const sheet=document.getElementById('tackleSheet');
      if(!runtime&&(!sheet||sheet.hidden))return hiddenStub();
      try{return (await ensureLoaded()).loadPage(criteria)}catch{return hiddenStub()}
    }
  };
  Object.defineProperty(facade,'products',{enumerable:true,get:()=>runtime?.products||[]});
  Object.defineProperty(facade,'loaded',{enumerable:true,get:()=>Boolean(runtime)});
  Object.freeze(facade);
  globalThis.FISH_TARGET_CATALOG=facade;
  globalThis.FISH_TARGET_CATALOG_LOADER=Object.freeze({ensureLoaded,loadManifest,state,facade});

  const refreshCatalogUi=()=>{
    document.querySelectorAll('.catalogDevNote').forEach(el=>{el.textContent='CATALOG RESEARCH · DAIWA / SHIMANO公式公開スペック。初回オープン時に読み込み、以後は端末キャッシュを利用。production利用は未承認。'});
    for(const id of ['rodCatalogMaker','reelCatalogMaker']){
      const el=document.getElementById(id);
      if(el)el.dispatchEvent(new Event('change',{bubbles:true}));
    }
  };

  document.addEventListener('click',event=>{
    const trigger=event.target?.closest?.('#tackleManage,#tackleEditFromResult,.v19TackleShortcut');
    if(!trigger)return;
    ensureLoaded().then(refreshCatalogUi).catch(()=>{
      document.querySelectorAll('.catalogLoadState').forEach(el=>{el.textContent='Catalogを読み込めません。手入力は利用できます。'});
    });
  },true);
})();
