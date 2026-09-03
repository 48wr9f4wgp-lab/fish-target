(()=>{
  const rules=globalThis.FISH_TARGET_TACKLE_SET_RULES;
  if(!rules)return;
  const freeze=value=>value&&typeof value==='object'?Object.freeze(Array.isArray(value)?value.slice():{...value}):value;
  const fitLevel=fit=>Number.isFinite(Number(fit?.level))?Math.max(0,Math.min(2,Number(fit.level))):1;
  const buildIdealSet=plan=>{
    if(!plan)return null;
    const req=plan.requirements||{};
    return Object.freeze({
      plan_id:plan.plan_id,
      rod:Object.freeze({required:Boolean(req.rod),raw:req.rod||'',length_ft:rules.ftRange(req.rod),power_range:rules.powerRange(req.rod),lure_weight_g:rules.gRange(plan.first_cast?.size||'')}),
      reel:Object.freeze({required:Boolean(req.reel),raw:req.reel||'',size_range:rules.reelRange(req.reel)}),
      main_line:Object.freeze({required:Boolean(req.line),raw:req.line||''}),
      leader:Object.freeze({required:Boolean(req.leader),raw:req.leader||''}),
      terminal:Object.freeze({required:Boolean(req.rig),rig:req.rig||'',first_cast:Object.freeze({...plan.first_cast})})
    });
  };
  const compatibilityFor=({rod,reel,pair,idealSet,dataComplete})=>{
    if((idealSet.rod.required&&!rod)||(idealSet.reel.required&&!reel))return 'incompatible';
    const rodLevel=fitLevel(rod?.fit),reelLevel=fitLevel(reel?.fit),pairLevel=fitLevel(pair);
    if(pairLevel>=2)return 'incompatible';
    if(rodLevel>=2||reelLevel>=2)return 'poor';
    if(pairLevel===1)return 'usable';
    if(rodLevel===1||reelLevel===1||!dataComplete)return 'good';
    return 'ideal';
  };
  const gapForComponent=(kind,candidate,idealSet)=>{
    const ideal=idealSet[kind];
    if(ideal?.required&&!candidate)return Object.freeze({type:'missing_component',component:kind,severity:2});
    if(!candidate)return null;
    const level=fitLevel(candidate.fit);
    if(level===0)return null;
    if(level===1)return Object.freeze({type:'acceptable_substitution',component:kind,severity:1});
    let direction='';
    if(kind==='rod'){
      const rank=candidate.item?.power&&rules.POWER.includes(String(candidate.item.power).toUpperCase())?rules.POWER.indexOf(String(candidate.item.power).toUpperCase()):null;
      direction=rules.directionLabel(rules.direction(rank,ideal.power_range));
    }else if(kind==='reel')direction=rules.directionLabel(rules.direction(candidate.item?.size,ideal.size_range));
    return Object.freeze({type:direction==='underspec'?'underspec':direction==='overspec'?'overspec':'incompatible',component:kind,severity:2});
  };
  const reasonsFor=(rod,reel,pair,compatibility,dataComplete)=>Object.freeze([
    Object.freeze({code:rod?`rod-fit-${fitLevel(rod.fit)}`:'component-missing',component:'rod',level:rod?fitLevel(rod.fit):2}),
    Object.freeze({code:reel?`reel-fit-${fitLevel(reel.fit)}`:'component-missing',component:'reel',level:reel?fitLevel(reel.fit):2}),
    Object.freeze({code:pair?.code||'pair-data-unavailable',component:'pair',level:fitLevel(pair)}),
    Object.freeze({code:dataComplete?'judgement-data-complete':'component-data-incomplete',component:'set',level:dataComplete?0:1}),
    Object.freeze({code:'compatibility-result',component:'set',value:compatibility})
  ]);
  function resolvePlan(plan,ownedTackle={},context={}){
    const idealSet=buildIdealSet(plan);
    if(!idealSet)return null;
    const logic=globalThis.FISH_TARGET_TACKLE_LOGIC;
    const resolver=globalThis.FISH_TARGET_RESOLVER;
    const rods=Array.isArray(ownedTackle?.rods)?ownedTackle.rods:[];
    const reels=Array.isArray(ownedTackle?.reels)?ownedTackle.reels:[];
    if(!logic?.rodFit||!logic?.reelFit||!resolver?.resolvePlan){
      const gaps=[idealSet.rod.required?{type:'missing_component',component:'rod',severity:2}:null,idealSet.reel.required?{type:'missing_component',component:'reel',severity:2}:null].filter(Boolean).map(freeze);
      return Object.freeze({idealSet,myBestSet:null,gaps:Object.freeze(gaps),compatibility:'incompatible',reasons:Object.freeze([Object.freeze({code:'tackle-logic-unavailable',component:'set',level:2})])});
    }
    const species=plan.species_id||plan.species_name;
    const method=plan.method_id||'default';
    const fitContext=resolver.evaluateOwnedTackle(species,method,{rods:[],reels:[]},context);
    void fitContext;
    const runtimeFish=globalThis.FISH_TARGET_SPECIES_REGISTRY?.runtimeFish?.(plan.species_id)||{};
    const fitPlan={...runtimeFish,...plan.requirements,style:plan.style,method:plan.method,size:plan.first_cast?.size||'',...(context?.plan||{})};
    const rotation={size:plan.first_cast?.size||'',...(context?.rotation||{})};
    const evaluatedRods=rods.map((item,index)=>({item,index,fit:logic.rodFit(item,fitPlan,rotation)}));
    const evaluatedReels=reels.map((item,index)=>({item,index,fit:logic.reelFit(item,fitPlan)}));
    let best=null;
    for(const rod of evaluatedRods){
      for(const reel of evaluatedReels){
        const pair=rules.pairFit(rod.item,reel.item,idealSet);
        const score=rules.scoreCombination(fitLevel(rod.fit),fitLevel(reel.fit),fitLevel(pair));
        const candidate={rod,reel,pair,score,order:rod.index*1000+reel.index};
        if(!best||score<best.score||(score===best.score&&candidate.order<best.order))best=candidate;
      }
    }
    const partialRod=!best&&evaluatedRods.length?evaluatedRods.slice().sort((a,b)=>fitLevel(a.fit)-fitLevel(b.fit)||a.index-b.index)[0]:null;
    const partialReel=!best&&evaluatedReels.length?evaluatedReels.slice().sort((a,b)=>fitLevel(a.fit)-fitLevel(b.fit)||a.index-b.index)[0]:null;
    const rod=best?.rod||partialRod,reel=best?.reel||partialReel,pair=best?.pair||rules.pairFit(rod?.item||null,reel?.item||null,idealSet);
    const dataComplete=Boolean((!idealSet.rod.required||idealSet.rod.power_range||idealSet.rod.length_ft)&&(!idealSet.reel.required||idealSet.reel.size_range));
    const compatibility=compatibilityFor({rod,reel,pair,idealSet,dataComplete});
    const gaps=[gapForComponent('rod',rod,idealSet),gapForComponent('reel',reel,idealSet),fitLevel(pair)>=1?Object.freeze({type:fitLevel(pair)>=2?'incompatible':'acceptable_substitution',component:'pair',severity:fitLevel(pair)}):null].filter(Boolean);
    const myBestSet=(rod||reel)?Object.freeze({
      rod:rod?rod.item:null,
      reel:reel?reel.item:null,
      fits:Object.freeze({rod:rod?freeze(rod.fit):null,reel:reel?freeze(reel.fit):null,pair:freeze(pair)}),
      score:best?.score??null,
      compatible:!['poor','incompatible'].includes(compatibility)
    }):null;
    return Object.freeze({idealSet,myBestSet,gaps:Object.freeze(gaps),compatibility,reasons:reasonsFor(rod,reel,pair,compatibility,dataComplete)});
  }
  function resolve(speciesValue,methodId='default',ownedTackle={},context={}){
    const resolver=globalThis.FISH_TARGET_RESOLVER;
    const plan=resolver?.resolvePlan?.(speciesValue,methodId)||null;
    return resolvePlan(plan,ownedTackle,context);
  }
  globalThis.FISH_TARGET_TACKLE_SET_RESOLVER=Object.freeze({version:'TACKLE-SET-RESOLVER-V31',resolve,resolvePlan,buildIdealSet});
})();