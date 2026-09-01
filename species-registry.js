(()=>{
  if(typeof F==='undefined'||!Array.isArray(F))return;
  const methodStatus=globalThis.FISH_TARGET_METHOD_STATUS||null;
  const methodsFor=fish=>typeof methodStatus?.methodsFor==='function'?methodStatus.methodsFor(fish):[];
  const text=value=>String(value??'').trim();
  const canonical=value=>text(value).normalize('NFKC').toLowerCase();
  const hash=value=>{let h=2166136261;for(const ch of canonical(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const stableId=fish=>text(fish?.species_id)||`species-${hash(fish?.name)}`;
  const unique=list=>[...new Set(list.map(text).filter(Boolean))];

  const records=F.map((fish,index)=>{
    const methods=methodsFor(fish);
    const methodIds=unique(methods.map(method=>text(method?.id)||'default'));
    return Object.freeze({
      species_id:stableId(fish),
      name:text(fish.name),
      aliases:Object.freeze(unique([fish.name,...(Array.isArray(fish.syn)?fish.syn:[])])),
      water:text(fish.water),
      styles:Object.freeze(unique([...(Array.isArray(fish.styles)?fish.styles:[]),fish.style])),
      tags:Object.freeze(unique(Array.isArray(fish.tags)?fish.tags:[])),
      difficulty:text(fish.difficulty),
      default_method:text(fish.method),
      method_ids:Object.freeze(methodIds),
      plan_count:methods.length||1,
      legacy_index:index
    });
  });

  const byIdMap=new Map(),byNameMap=new Map(),aliasMap=new Map();
  for(const record of records){
    if(!record.name)throw new Error('Species registry requires name');
    if(byIdMap.has(record.species_id))throw new Error(`Duplicate species_id: ${record.species_id}`);
    if(byNameMap.has(record.name))throw new Error(`Duplicate species name: ${record.name}`);
    byIdMap.set(record.species_id,record);
    byNameMap.set(record.name,record);
    for(const alias of record.aliases){
      const key=canonical(alias),list=aliasMap.get(key)||[];
      if(!list.includes(record))list.push(record);
      aliasMap.set(key,list);
    }
  }

  const get=id=>byIdMap.get(text(id))||null;
  const byName=name=>byNameMap.get(text(name))||null;
  const resolve=value=>{
    const raw=text(value);
    if(!raw)return null;
    const exact=get(raw)||byName(raw);
    if(exact)return exact;
    const matches=aliasMap.get(canonical(raw))||[];
    return matches.length===1?matches[0]:null;
  };
  const aliasMatches=value=>(aliasMap.get(canonical(value))||[]).slice();
  const runtimeFish=value=>{
    const record=typeof value==='object'&&value?.species_id?value:resolve(value);
    return record?F[record.legacy_index]||null:null;
  };

  globalThis.FISH_TARGET_SPECIES_REGISTRY=Object.freeze({
    version:'SPECIES-REGISTRY-1',
    count:records.length,
    records:Object.freeze(records.slice()),
    get,byName,resolve,aliasMatches,runtimeFish,
    idFor:fish=>stableId(fish)
  });
})();
