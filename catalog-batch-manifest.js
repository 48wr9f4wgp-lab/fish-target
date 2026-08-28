(()=>{
  const batches=[
    {id:'daiwa-poc-core',maker:'DAIWA',files:['catalog-daiwa-poc.js'],expected_rows:105,stage:'research'},
    {id:'shimano-poc-core',maker:'SHIMANO',files:['catalog-shimano-poc.js'],expected_rows:34,stage:'research'}
  ];
  globalThis.FISH_TARGET_CATALOG_BATCH_MANIFEST=Object.freeze(batches.map(batch=>Object.freeze({...batch,files:Object.freeze(batch.files.slice())})));
})();
