(()=>{
  const adapters=globalThis.FISH_TARGET_CATALOG_ADAPTERS;
  if(!adapters)throw new Error('Catalog adapters must load before research rows');
  const daiwaPoc=Array.isArray(globalThis.FISH_TARGET_DAIWA_POC_ROWS)?globalThis.FISH_TARGET_DAIWA_POC_ROWS:[];
  const shimanoPoc=Array.isArray(globalThis.FISH_TARGET_SHIMANO_POC_ROWS)?globalThis.FISH_TARGET_SHIMANO_POC_ROWS:[];
  const registry=Array.isArray(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS)?globalThis.FISH_TARGET_CATALOG_BATCH_ROWS:[];
  const registryRows=registry.flatMap(batch=>Array.isArray(batch?.rows)?batch.rows:[]);
  const factual=[...daiwaPoc,...shimanoPoc,...registryRows];
  globalThis.FISH_TARGET_CATALOG_RESEARCH_ROWS=Object.freeze(factual.map(x=>adapters.byMaker(x.maker).normalize(x)));
  globalThis.FISH_TARGET_CATALOG_RESEARCH_COMPOSITION=Object.freeze({daiwaPoc:daiwaPoc.length,shimanoPoc:shimanoPoc.length,batches:registry.length,batchRows:registryRows.length,total:factual.length});
})();
