(()=>{
  const resolver=globalThis.FISH_TARGET_RESOLVER;
  const logic=globalThis.FISH_TARGET_TACKLE_LOGIC;
  if(!resolver||!logic?.rodFit||!logic?.reelFit)return;
  const KEY='fish_target_v17_tackle';
  const read=()=>{try{const raw=localStorage.getItem(KEY);const data=raw?JSON.parse(raw):{};return {rods:Array.isArray(data.rods)?data.rods:[],reels:Array.isArray(data.reels)?data.reels:[]}}catch{return {rods:[],reels:[]}}};
  const best=(items,fitFn)=>items.map(item=>({item,fit:fitFn(item)})).sort((a,b)=>(a.fit?.level??99)-(b.fit?.level??99))[0]||null;
  const keyOf=candidate=>candidate?.item?.id||candidate?.item?.product_id||candidate?.item?.name||null;
  const sameCandidate=(a,b)=>keyOf(a)===keyOf(b)&&(a?.fit?.level??null)===(b?.fit?.level??null);
  const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/\s+/g,'').replace(/[·・\-_/]/g,'');
  const publish=status=>{
    globalThis.FISH_TARGET_RESOLVER_SHADOW_STATUS=Object.freeze(status);
    if(status.ready&&!status.parity)console.warn('Resolver shadow mismatch',status);
    return globalThis.FISH_TARGET_RESOLVER_SHADOW_STATUS;
  };
  let catalogCacheKey='',catalogCache=null;
  const publishCatalog=status=>{
    catalogCache=Object.freeze(status);
    globalThis.FISH_TARGET_RESOLVER_CATALOG_SHADOW_STATUS=catalogCache;
    return catalogCache;
  };
  const checkCatalog=()=>{
    if(typeof cur==='undefined'||!cur||typeof basePlan!=='function')return publishCatalog({version:'RESOLVER-CATALOG-SHADOW-1',ready:false,reason:'no-current-species'});
    const catalog=globalThis.FISH_TARGET_CATALOG_RUNTIME;
    if(!catalog||!Array.isArray(catalog.products)||!catalog.products.length)return publishCatalog({version:'RESOLVER-CATALOG-SHADOW-1',ready:false,reason:'catalog-not-loaded',species:cur.name});
    const plan=basePlan();
    const rotation=typeof currentRotation==='function'?currentRotation(plan):null;
    const methodId=typeof state!=='undefined'&&state?.methodKey?state.methodKey:'default';
    const key=JSON.stringify([cur.name,methodId,plan?.method,plan?.rod,plan?.reel,plan?.line,plan?.leader,rotation?.size,catalog.products.length]);
    if(key===catalogCacheKey&&catalogCache)return catalogCache;
    const matches=resolver.matchCatalog(cur.name,methodId,{catalog,includeResearch:true,plan,rotation});
    const ranked=resolver.rankCatalogMatches(matches);
    const rod=ranked.find(item=>item.category==='rod')||null;
    const reel=ranked.find(item=>item.category==='reel')||null;
    const legacy=typeof productsForPlan==='function'?productsForPlan(plan):[];
    const legacyNames=(Array.isArray(legacy)?legacy:[]).filter(item=>item?.type==='ロッド'||item?.type==='リール').map(item=>item.name).filter(Boolean);
    const catalogNames=matches.map(item=>item?.product?.display_name||'').filter(Boolean);
    const overlap=legacyNames.filter(name=>catalogNames.some(candidate=>{const a=normalize(name),b=normalize(candidate);return a&&b&&(a.includes(b)||b.includes(a))})).length;
    catalogCacheKey=key;
    return publishCatalog({
      version:'RESOLVER-CATALOG-SHADOW-1',ready:true,species:cur.name,method_id:methodId,
      candidate_count:matches.length,rod:rod?.product_id||null,reel:reel?.product_id||null,
      rod_fit:rod?.fit?.level??null,reel_fit:reel?.fit?.level??null,
      production_eligible_count:matches.filter(item=>item.production_eligible).length,
      research_only_count:matches.filter(item=>item.research_only).length,
      synthetic_count:matches.filter(item=>item.synthetic).length,
      legacy_recommendations:legacyNames.length,legacy_catalog_overlap:overlap
    });
  };
  const check=()=>{
    if(typeof cur==='undefined'||!cur||typeof basePlan!=='function'){
      checkCatalog();
      return publish({version:'RESOLVER-SHADOW-1',ready:false,parity:null,reason:'no-current-species'});
    }
    const db=read();
    const plan=basePlan();
    const rotation=typeof currentRotation==='function'?currentRotation(plan):null;
    const methodId=typeof state!=='undefined'&&state?.methodKey?state.methodKey:'default';
    const resolved=resolver.evaluateOwnedTackle(cur.name,methodId,db,{plan,rotation});
    checkCatalog();
    if(!resolved?.ready)return publish({version:'RESOLVER-SHADOW-1',ready:false,parity:null,reason:resolved?.reason||'resolver-unavailable',species:cur.name,method_id:methodId});
    const legacyRod=best(db.rods,item=>logic.rodFit(item,plan,rotation));
    const legacyReel=best(db.reels,item=>logic.reelFit(item,plan));
    const rodParity=sameCandidate(legacyRod,resolved.rod);
    const reelParity=sameCandidate(legacyReel,resolved.reel);
    return publish({
      version:'RESOLVER-SHADOW-1',ready:true,parity:rodParity&&reelParity,
      species:cur.name,method_id:methodId,plan_id:resolved.plan_id,
      rod_parity:rodParity,reel_parity:reelParity,
      legacy_rod:keyOf(legacyRod),resolver_rod:keyOf(resolved.rod),
      legacy_reel:keyOf(legacyReel),resolver_reel:keyOf(resolved.reel),
      rotation_size:rotation?.size||''
    });
  };
  if(typeof renderResult==='function'){
    const previous=renderResult;
    renderResult=function(...args){const out=previous.apply(this,args);check();return out};
  }
  queueMicrotask(check);
  globalThis.FISH_TARGET_RESOLVER_SHADOW=Object.freeze({version:'RESOLVER-SHADOW-1',check,checkCatalog});
})();
