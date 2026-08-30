(()=>{
  const speciesRegistry=globalThis.FISH_TARGET_SPECIES_REGISTRY;
  const methodRegistry=globalThis.FISH_TARGET_METHOD_REGISTRY;
  if(!speciesRegistry||!methodRegistry)return;
  const text=value=>String(value??'').trim();
  const freeze=value=>value&&typeof value==='object'?Object.freeze(Array.isArray(value)?value.slice():{...value}):value;
  const resolveSpecies=value=>speciesRegistry.resolve(value);
  const resolveMethods=value=>methodRegistry.plansForSpecies(value);
  const resolvePlan=(speciesValue,methodId='default')=>methodRegistry.resolve(speciesValue,methodId);
  const asPlan=value=>{
    if(value&&typeof value==='object'&&value.plan_id)return value;
    if(typeof value==='string'&&value.includes(':'))return methodRegistry.get(value);
    return null;
  };
  const resolveFirstCast=(speciesValue,methodId='default')=>{
    const plan=asPlan(speciesValue)||resolvePlan(speciesValue,methodId);
    return plan?plan.first_cast:null;
  };
  const resolveRequirements=(speciesValue,methodId='default')=>{
    const plan=asPlan(speciesValue)||resolvePlan(speciesValue,methodId);
    return plan?plan.requirements:null;
  };
  const best=(items,fitFn)=>items.map(item=>Object.freeze({item,fit:freeze(fitFn(item))})).sort((a,b)=>(a.fit?.level??99)-(b.fit?.level??99))[0]||null;
  const evaluateOwnedTackle=(speciesValue,methodId='default',ownedTackle={},context={})=>{
    const plan=asPlan(speciesValue)||resolvePlan(speciesValue,methodId);
    if(!plan)return null;
    const logic=globalThis.FISH_TARGET_TACKLE_LOGIC;
    if(!logic?.rodFit||!logic?.reelFit)return Object.freeze({plan_id:plan.plan_id,ready:false,reason:'tackle-logic-unavailable',rod:null,reel:null});
    const runtimeFish=speciesRegistry.runtimeFish(plan.species_id);
    const fitPlan={
      ...runtimeFish,
      ...plan.requirements,
      style:plan.style,
      method:plan.method,
      size:plan.first_cast?.size||'',
      ...(context?.plan&&typeof context.plan==='object'?context.plan:{})
    };
    const rotation={size:plan.first_cast?.size||'',...(context?.rotation&&typeof context.rotation==='object'?context.rotation:{})};
    const rods=Array.isArray(ownedTackle?.rods)?ownedTackle.rods:[];
    const reels=Array.isArray(ownedTackle?.reels)?ownedTackle.reels:[];
    const rod=best(rods,item=>logic.rodFit(item,fitPlan,rotation));
    const reel=best(reels,item=>logic.reelFit(item,fitPlan));
    return Object.freeze({plan_id:plan.plan_id,ready:true,rod,reel});
  };
  const matchCatalog=(speciesValue,methodId='default',catalogContext={})=>{
    const plan=asPlan(speciesValue)||resolvePlan(speciesValue,methodId);
    if(!plan)return Object.freeze([]);
    if(typeof catalogContext?.match==='function')return Object.freeze([...(catalogContext.match(plan)||[])]);
    return Object.freeze([...(Array.isArray(catalogContext?.items)?catalogContext.items:[])]);
  };
  const rankCatalogMatches=(matches,context={})=>{
    const score=typeof context?.score==='function'?context.score:item=>Number(item?.score??item?.fit_score??0);
    return Object.freeze([...(Array.isArray(matches)?matches:[])].map((item,index)=>({item,index,score:Number(score(item))||0})).sort((a,b)=>(b.score-a.score)||(a.index-b.index)).map(x=>x.item));
  };
  globalThis.FISH_TARGET_RESOLVER=Object.freeze({
    version:'RESOLVER-ENGINE-1',
    resolveSpecies,resolveMethods,resolvePlan,resolveFirstCast,resolveRequirements,
    evaluateOwnedTackle,matchCatalog,rankCatalogMatches
  });
})();
