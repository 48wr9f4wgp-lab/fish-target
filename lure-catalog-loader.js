(()=>{
  const state={manifest:null,manifestPromise:null,loaded:new Set(),loading:new Map()};
  const runtimeOn=()=>document.documentElement?.dataset?.lureCatalogRuntime==='on';
  const rows=()=>Array.isArray(globalThis.FISH_TARGET_LURE_CATALOG_BATCH_ROWS)
    ?globalThis.FISH_TARGET_LURE_CATALOG_BATCH_ROWS.flatMap(batch=>Array.isArray(batch?.rows)?batch.rows:[])
    :[];
  const loadScript=file=>{
    if(state.loaded.has(file))return Promise.resolve();
    if(state.loading.has(file))return state.loading.get(file);
    const promise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=file;s.async=true;
      s.onload=()=>{state.loaded.add(file);state.loading.delete(file);resolve()};
      s.onerror=()=>{state.loading.delete(file);reject(new Error(`lure asset failed: ${file}`))};
      document.head.appendChild(s);
    });
    state.loading.set(file,promise);return promise;
  };
  async function manifest(){
    if(state.manifest)return state.manifest;
    if(state.manifestPromise)return state.manifestPromise;
    state.manifestPromise=fetch('lure-catalog-manifest.json',{credentials:'same-origin'})
      .then(r=>{if(!r.ok)throw new Error(`lure manifest ${r.status}`);return r.json()})
      .then(x=>{if(!x||!Array.isArray(x.batches))throw new Error('invalid lure manifest');state.manifest=x;return x})
      .finally(()=>{state.manifestPromise=null});
    return state.manifestPromise;
  }
  async function ensureFor(species){
    if(!runtimeOn()||!species)return [];
    const m=await manifest();
    const batches=m.batches.filter(batch=>batch?.stage==='research'&&Array.isArray(batch.targets)&&batch.targets.includes(species));
    await Promise.all(batches.map(batch=>loadScript(batch.file)));
    return rows().filter(row=>row.targets?.includes(species));
  }
  async function rowsFor(species,method){
    const list=await ensureFor(species);
    return list.filter(row=>!method||!row.methods?.length||row.methods.includes(method));
  }
  const add=(parent,tag,text,className='')=>{
    const el=document.createElement(tag);if(className)el.className=className;el.textContent=text;parent.appendChild(el);return el;
  };
  async function render(host,species,method){
    if(typeof host==='string')host=document.getElementById(host);
    if(!host)return;
    host.replaceChildren();add(host,'p','読み込み中…','lureCatalogStatus');
    try{
      const list=await rowsFor(species,method);
      host.replaceChildren();
      if(!list.length){add(host,'p','この釣り方の市販ルアー候補はまだ研究中。','lureCatalogStatus');return}
      const ul=add(host,'ul','','lureCatalogList');
      for(const row of list){
        const li=add(ul,'li','','lureCatalogItem');
        add(li,'b',row.display_name||`${row.series} ${row.variant}`);
        const specs=[row.length_mm?`${row.length_mm}mm`:'',row.weight_g?`${row.weight_g}g`:''].filter(Boolean).join(' / ');
        if(specs)add(li,'span',specs,'lureCatalogSpecs');
        if(row.use_note)add(li,'small',row.use_note,'lureCatalogNote');
      }
      add(host,'small','メーカー公式情報を基にした研究候補。色別SKU・在庫・価格は含めない。','lureCatalogDisclaimer');
    }catch{
      host.replaceChildren();add(host,'p',navigator.onLine?'候補データを読み込めませんでした。':'オフラインでは市販候補を追加読込できません。','lureCatalogStatus');
    }
  }
  globalThis.FISH_TARGET_LURE_CATALOG=Object.freeze({version:'LURE-CATALOG-1',ensureFor,rowsFor,render});
})();
