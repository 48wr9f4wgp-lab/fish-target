(()=>{
  const base=globalThis.FISH_TARGET_METHOD_EXPANSION_V2;
  const parts=Array.isArray(globalThis.FISH_TARGET_METHOD_EXPANSION_V3_PARTS)?globalThis.FISH_TARGET_METHOD_EXPANSION_V3_PARTS:[];
  if(!base||!parts.length)return;
  const existing={};
  for(const [name,methods] of Object.entries(base.existing||{}))existing[name]=[...(methods||[])];
  const targets=[...(base.targets||[])];
  const targetNames=new Set(targets.map(x=>x.name));
  for(const part of parts){
    for(const target of part.targets||[]){
      if(targetNames.has(target.name))throw new Error(`TARGET3 duplicate target: ${target.name}`);
      targets.push(target);targetNames.add(target.name);
    }
    for(const [name,methods] of Object.entries(part.existing||{}))existing[name]=[...(existing[name]||[]),...(methods||[])];
  }
  const combined=Object.freeze({version:'V25-TARGET-METHOD3',existing:Object.freeze(existing),targets:Object.freeze(targets)});
  globalThis.FISH_TARGET_METHOD_EXPANSION_V1=combined;
  globalThis.FISH_TARGET_METHOD_EXPANSION_V2=combined;
  globalThis.FISH_TARGET_METHOD_EXPANSION_V3=combined;
})();
