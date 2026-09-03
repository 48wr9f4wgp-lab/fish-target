(()=>{
  const base=globalThis.FISH_TARGET_METHOD_EXPANSION_V1;
  const authored=globalThis.FISH_TARGET_SPECIES_METHOD_AUTHORING;
  if(!base||!authored)return;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const existing={};
  for(const [name,methods] of Object.entries(base.existing||{}))existing[name]=clone(methods||[]);
  const targets=clone(base.targets||[]);
  const targetNames=new Set(targets.map(target=>target.name));
  let authoredPlanCount=0;

  for(const target of authored.targets||[]){
    if(targetNames.has(target.name))throw new Error(`Authoring target already exists: ${target.name}`);
    targets.push(clone(target));
    targetNames.add(target.name);
    authoredPlanCount+=(target.methods||[]).length;
  }
  for(const [name,methods] of Object.entries(authored.existing||{})){
    existing[name]=[...(existing[name]||[]),...clone(methods||[])];
    authoredPlanCount+=(methods||[]).length;
  }

  const combined=Object.freeze({
    version:`${base.version}+AUTHORING1`,
    existing:Object.freeze(existing),
    targets:Object.freeze(targets)
  });
  globalThis.FISH_TARGET_METHOD_EXPANSION_V1=combined;
  globalThis.FISH_TARGET_METHOD_EXPANSION_V2=combined;
  globalThis.FISH_TARGET_METHOD_EXPANSION_V3=combined;
  globalThis.FISH_TARGET_METHOD_EXPANSION_V4=combined;
  globalThis.FISH_TARGET_AUTHORING_STATUS=Object.freeze({
    version:'SPECIES-METHOD-AUTHORING-RUNTIME-1',
    authored_targets:(authored.targets||[]).length,
    authored_existing:Object.keys(authored.existing||{}).length,
    authored_plans:authoredPlanCount,
    total_targets:targets.length
  });
})();
