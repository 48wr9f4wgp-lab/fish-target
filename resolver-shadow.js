(()=>{
  const resolver=globalThis.FISH_TARGET_RESOLVER;
  const logic=globalThis.FISH_TARGET_TACKLE_LOGIC;
  if(!resolver||!logic?.rodFit||!logic?.reelFit)return;
  const KEY='fish_target_v17_tackle';
  const read=()=>{try{const raw=localStorage.getItem(KEY);const data=raw?JSON.parse(raw):{};return {rods:Array.isArray(data.rods)?data.rods:[],reels:Array.isArray(data.reels)?data.reels:[]}}catch{return {rods:[],reels:[]}}};
  const best=(items,fitFn)=>items.map(item=>({item,fit:fitFn(item)})).sort((a,b)=>(a.fit?.level??99)-(b.fit?.level??99))[0]||null;
  const keyOf=candidate=>candidate?.item?.id||candidate?.item?.product_id||candidate?.item?.name||null;
  const sameCandidate=(a,b)=>keyOf(a)===keyOf(b)&&(a?.fit?.level??null)===(b?.fit?.level??null);
  const publish=status=>{
    globalThis.FISH_TARGET_RESOLVER_SHADOW_STATUS=Object.freeze(status);
    if(status.ready&&!status.parity)console.warn('Resolver shadow mismatch',status);
    return globalThis.FISH_TARGET_RESOLVER_SHADOW_STATUS;
  };
  const check=()=>{
    if(typeof cur==='undefined'||!cur||typeof basePlan!=='function')return publish({version:'RESOLVER-SHADOW-1',ready:false,parity:null,reason:'no-current-species'});
    const db=read();
    const plan=basePlan();
    const rotation=typeof currentRotation==='function'?currentRotation(plan):null;
    const methodId=typeof state!=='undefined'&&state?.methodKey?state.methodKey:'default';
    const resolved=resolver.evaluateOwnedTackle(cur.name,methodId,db,{plan,rotation});
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
  globalThis.FISH_TARGET_RESOLVER_SHADOW=Object.freeze({version:'RESOLVER-SHADOW-1',check});
})();
