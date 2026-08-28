(()=>{
  const base=globalThis.FISH_TARGET_METHOD_EXPANSION_V1;
  const parts=Array.isArray(globalThis.FISH_TARGET_METHOD_EXPANSION_V2_PARTS)?globalThis.FISH_TARGET_METHOD_EXPANSION_V2_PARTS:[];
  if(!base||!parts.length)return;
  const existing={};
  for(const [name,methods] of Object.entries(base.existing||{}))existing[name]=[...(methods||[])];
  const targets=[...(base.targets||[])];
  const targetNames=new Set(targets.map(x=>x.name));
  for(const part of parts){
    for(const [name,methods] of Object.entries(part.existing||{}))existing[name]=[...(existing[name]||[]),...(methods||[])];
    for(const target of part.targets||[]){
      if(targetNames.has(target.name))throw new Error(`TARGET2 duplicate target: ${target.name}`);
      targets.push(target);targetNames.add(target.name);
    }
  }

  // TARGET2 provenance upgrade: SHIMANO's dedicated choinage guide explicitly
  // lists ベラ as a target, so replace the older generic index evidence without
  // changing the verified TARGET1 baseline branch.
  const bera=targets.find(x=>x.name==='ベラ');
  const beraChoinage=bera?.methods?.find(x=>x.id==='choinage');
  if(beraChoinage)beraChoinage.source={
    provider:'SHIMANO',
    url:'https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/baitfishing/tyoinage/index.html',
    reviewed_at:'2026-08-28',
    evidence:'method-target',
    confidence:'A'
  };

  const combined=Object.freeze({version:'V24-TARGET-METHOD2',existing:Object.freeze(existing),targets:Object.freeze(targets)});
  globalThis.FISH_TARGET_METHOD_EXPANSION_V1=combined;
  globalThis.FISH_TARGET_METHOD_EXPANSION_V2=combined;
})();
