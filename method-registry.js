(()=>{
  const speciesRegistry=globalThis.FISH_TARGET_SPECIES_REGISTRY;
  const methodStatus=globalThis.FISH_TARGET_METHOD_STATUS;
  if(!speciesRegistry||typeof methodStatus?.methodsFor!=='function')return;
  const text=value=>String(value??'').trim();
  const frozenArray=value=>Object.freeze((Array.isArray(value)?value:[]).map(item=>typeof item==='string'?item:String(item??'')).filter(Boolean));
  const frozenObject=value=>Object.freeze(value&&typeof value==='object'&&!Array.isArray(value)?{...value}:{});
  const records=[];
  for(const species of speciesRegistry.records){
    const fish=speciesRegistry.runtimeFish(species);
    if(!fish)throw new Error(`Method registry missing runtime fish: ${species.name}`);
    const methods=methodStatus.methodsFor(fish);
    const localIds=new Set();
    for(const [index,method] of methods.entries()){
      const methodId=text(method?.id)||'default';
      if(localIds.has(methodId))throw new Error(`Duplicate method id for ${species.name}: ${methodId}`);
      localIds.add(methodId);
      const planId=`${species.species_id}:${methodId}`;
      const requirements=Object.freeze({
        rod:text(method?.rod),reel:text(method?.reel),line:text(method?.line),leader:text(method?.leader),rig:text(method?.rig)
      });
      const firstCast=Object.freeze({
        bait:text(method?.bait),size:text(method?.size),color:text(method?.color),bait_action:text(method?.baitAction),range:text(method?.range),action:text(method?.action),time:text(method?.time)
      });
      records.push(Object.freeze({
        plan_id:planId,
        species_id:species.species_id,
        species_name:species.name,
        method_id:methodId,
        method:text(method?.method),
        style:text(method?.style)||species.styles[0]||'',
        difficulty:text(method?.difficulty)||species.difficulty,
        why:text(method?.why),
        requirements,
        first_cast:firstCast,
        steps:frozenArray(method?.steps),
        places:frozenArray(method?.places),
        mistakes:frozenArray(method?.mistakes),
        source:frozenObject(method?.source),
        is_default:index===0||methodId==='default'
      }));
    }
  }
  const byPlanIdMap=new Map();
  const bySpeciesMap=new Map();
  for(const record of records){
    if(!record.plan_id||byPlanIdMap.has(record.plan_id))throw new Error(`Duplicate plan_id: ${record.plan_id}`);
    if(!record.method)throw new Error(`Method registry requires method label: ${record.plan_id}`);
    byPlanIdMap.set(record.plan_id,record);
    const list=bySpeciesMap.get(record.species_id)||[];
    list.push(record);bySpeciesMap.set(record.species_id,list);
  }
  for(const [speciesId,list] of bySpeciesMap)bySpeciesMap.set(speciesId,Object.freeze(list.slice()));
  const get=planId=>byPlanIdMap.get(text(planId))||null;
  const plansForSpecies=value=>{
    const species=typeof value==='object'&&value?.species_id?value:speciesRegistry.resolve(value);
    return species?(bySpeciesMap.get(species.species_id)||Object.freeze([])):Object.freeze([]);
  };
  const resolve=(speciesValue,methodId='default')=>{
    const species=typeof speciesValue==='object'&&speciesValue?.species_id?speciesValue:speciesRegistry.resolve(speciesValue);
    if(!species)return null;
    return get(`${species.species_id}:${text(methodId)||'default'}`);
  };
  globalThis.FISH_TARGET_METHOD_REGISTRY=Object.freeze({
    version:'METHOD-REGISTRY-1',
    count:records.length,
    records:Object.freeze(records.slice()),
    get,plansForSpecies,resolve,
    planId:(speciesId,methodId='default')=>`${text(speciesId)}:${text(methodId)||'default'}`
  });
})();
