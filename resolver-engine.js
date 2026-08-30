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
  const fitContext=(plan,context={})=>{
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
    return {fitPlan,rotation};
  };
  const evaluateOwnedTackle=(speciesValue,methodId='default',ownedTackle={},context={})=>{
    const plan=asPlan(speciesValue)||resolvePlan(speciesValue,methodId);
    if(!plan)return null;
    const logic=globalThis.FISH_TARGET_TACKLE_LOGIC;
    if(!logic?.rodFit||!logic?.reelFit)return Object.freeze({plan_id:plan.plan_id,ready:false,reason:'tackle-logic-unavailable',rod:null,reel:null});
    const {fitPlan,rotation}=fitContext(plan,context);
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
    const hasInjectedItems=Array.isArray(catalogContext?.items);
    if(hasInjectedItems&&!catalogContext?.catalog&&!catalogContext?.evaluate)return Object.freeze([...catalogContext.items]);
    const catalog=catalogContext?.catalog||globalThis.FISH_TARGET_CATALOG_RUNTIME||globalThis.FISH_TARGET_CATALOG;
    const products=hasInjectedItems?catalogContext.items:(Array.isArray(catalog?.products)?catalog.products:[]);
    const logic=globalThis.FISH_TARGET_TACKLE_LOGIC;
    if(!catalog||!logic?.rodFit||!logic?.reelFit||typeof catalog.ownedSnapshot!=='function')return Object.freeze([]);
    const includeResearch=Boolean(catalogContext?.includeResearch);
    const includeSynthetic=Boolean(catalogContext?.includeSynthetic);
    const {fitPlan,rotation}=fitContext(plan,catalogContext);
    const matches=[];
    for(const product of products){
      if(!product||!['rod','reel'].includes(product.category))continue;
      const synthetic=product.source?.source_type==='synthetic';
      if(synthetic&&!includeSynthetic)continue;
      const productionEligible=Boolean(catalog.productionEligible?.(product));
      if(!productionEligible&&!includeResearch)continue;
      const owned=catalog.ownedSnapshot(product,{});
      if(!owned)continue;
      const fit=product.category==='rod'?logic.rodFit(owned,fitPlan,rotation):logic.reelFit(owned,fitPlan);
      const level=Number.isFinite(Number(fit?.level))?Number(fit.level):99;
      matches.push(Object.freeze({
        product,
        product_id:product.product_id||null,
        category:product.category,
        fit:freeze(fit),
        fit_score:Math.max(0,2-Math.min(2,level)),
        production_eligible:productionEligible,
        research_only:!productionEligible,
        synthetic
      }));
    }
    return Object.freeze(matches);
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
