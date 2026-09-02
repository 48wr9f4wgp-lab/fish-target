(()=>{
  const parts=Array.isArray(globalThis.FISH_TARGET_METHOD_EXPANSION_V1_PARTS)?globalThis.FISH_TARGET_METHOD_EXPANSION_V1_PARTS:[];
  const existing={};const targets=[];
  for(const part of parts){for(const [name,methods] of Object.entries(part.existing||{}))existing[name]=[...(existing[name]||[]),...(methods||[])];targets.push(...(part.targets||[]));}
  globalThis.FISH_TARGET_METHOD_EXPANSION_V1=Object.freeze({version:'V24-TARGET-METHOD1',existing:Object.freeze(existing),targets:Object.freeze(targets)});
})();
