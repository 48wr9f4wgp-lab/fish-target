(()=>{
  let loaderPromise=null;
  const runtimeOn=()=>document.documentElement?.dataset?.lureCatalogRuntime==='on';
  const supported=()=>new Set(String(document.documentElement?.dataset?.lureCatalogTargets||'').split('|').map(x=>x.trim()).filter(Boolean));
  const context=()=>{
    const species=typeof cur!=='undefined'&&cur?.name?String(cur.name):String(document.getElementById('rname')?.textContent||'').trim();
    const plan=typeof basePlan==='function'?basePlan():(typeof cur!=='undefined'?cur:null);
    return {species,method:String(plan?.method||document.getElementById('pmethod')?.textContent||'').trim(),style:String(plan?.style||cur?.style||'').trim()};
  };
  const load=()=>{
    if(globalThis.FISH_TARGET_LURE_CATALOG)return Promise.resolve(globalThis.FISH_TARGET_LURE_CATALOG);
    if(loaderPromise)return loaderPromise;
    loaderPromise=new Promise((resolve,reject)=>{
      const found=document.querySelector('script[data-lure-catalog-loader]');
      if(found){found.addEventListener('load',()=>resolve(globalThis.FISH_TARGET_LURE_CATALOG),{once:true});found.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');s.src=`lure-catalog-loader.js?v=${document.documentElement.dataset.build||''}`;s.async=true;s.dataset.lureCatalogLoader='1';s.onload=()=>resolve(globalThis.FISH_TARGET_LURE_CATALOG);s.onerror=()=>{s.remove();reject(new Error('lure catalog loader failed'))};document.body.appendChild(s);
    }).finally(()=>{if(!globalThis.FISH_TARGET_LURE_CATALOG)loaderPromise=null});
    return loaderPromise;
  };
  const placeholder=(host,text)=>{host.replaceChildren();const p=document.createElement('p');p.className='lureCatalogStatus';p.textContent=text;host.appendChild(p)};
  async function renderOpen(panel,host,ctx){
    const key=`${ctx.species}|${ctx.method}`;
    const isCurrent=()=>{const latest=context();return !panel.hidden&&panel.open&&panel.dataset.context===key&&`${latest.species}|${latest.method}`===key};
    panel.dataset.context=key;
    placeholder(host,'読み込み中…');
    try{const api=await load();if(!api)throw new Error('lure api missing');if(!isCurrent())return;const ok=await api.render(host,ctx.species,ctx.method,{isCurrent});if(!ok&&isCurrent())panel.dataset.context=''}
    catch{if(isCurrent()){panel.dataset.context='';placeholder(host,navigator.onLine?'市販ルアー / 仕掛け候補を読み込めませんでした。閉じて開くと再試行できます。':'オフラインでは市販候補を追加読込できません。')}}
  }
  function ensure(){
    const result=document.getElementById('result'),body=result?.querySelector('.body'),first=result?.querySelector('.firstCast');if(!body||!first)return;
    const ctx=context(),enabled=runtimeOn()&&ctx.style==='lure'&&supported().has(ctx.species);
    let panel=document.getElementById('lureCatalogPanel');
    if(!enabled){if(panel){panel.hidden=true;panel.open=false;panel.dataset.context=''}return}
    if(!panel){
      panel=document.createElement('details');panel.id='lureCatalogPanel';panel.className='lureCatalogPanel card';
      const summary=document.createElement('summary');summary.innerHTML='<span><b>市販ルアー / 仕掛け候補</b><small>必要な時だけ読み込み</small></span><em>公式研究</em>';
      const host=document.createElement('div');host.className='lureCatalogBody';host.id='lureCatalogBody';placeholder(host,'開くと、この魚・釣り方に合う候補だけ読み込みます。');
      panel.append(summary,host);
      panel.addEventListener('toggle',()=>{if(panel.open)renderOpen(panel,host,context());else panel.dataset.context=''});
    }
    const anchor=document.getElementById('tackleAutoBuildV29')||first;
    if(anchor.nextElementSibling!==panel)anchor.insertAdjacentElement('afterend',panel);
    panel.hidden=false;
    const host=panel.querySelector('.lureCatalogBody'),key=`${ctx.species}|${ctx.method}`;
    if(panel.dataset.context!==key){panel.dataset.context='';placeholder(host,'開くと、この魚・釣り方に合う候補だけ読み込みます。');if(panel.open)renderOpen(panel,host,ctx)}
  }
  ensure();
  if(typeof renderResult==='function'){const prev=renderResult;renderResult=function(...args){const out=prev.apply(this,args);ensure();return out}}
  window.addEventListener('pageshow',ensure);
  globalThis.FISH_TARGET_LURE_CATALOG_ENTRY=Object.freeze({version:'LURE-CATALOG-ENTRY-2',render:ensure});
})();
