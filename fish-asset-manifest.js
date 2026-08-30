(()=>{
  const speciesRegistry=globalThis.FISH_TARGET_SPECIES_REGISTRY;
  const authoring=globalThis.FISH_TARGET_FISH_ASSET_AUTHORING;
  if(!speciesRegistry?.records||!authoring?.assets)return;

  const SHEET=authoring.bundled_sheet;
  const authoredByName=new Map(authoring.assets.map(record=>[record.species_name,record]));
  for(const authored of authoring.assets){
    if(!speciesRegistry.resolve(authored.species_name))throw new Error(`Authored fish asset species is not registered: ${authored.species_name}`);
  }

  const freezeAsset=(asset,name)=>Object.freeze({...asset,species_name:name});
  const records=speciesRegistry.records.map(species=>{
    const authored=authoredByName.get(species.name)||null;
    const bundled=Boolean(authored?.asset);
    return Object.freeze({
      species_id:species.species_id,
      species_name:species.name,
      asset:bundled?freezeAsset(authored.asset,species.name):null,
      source:bundled?authored.source:'wikimedia-runtime-resolver',
      source_url:bundled?authored.source_url:null,
      author:bundled?authored.author:null,
      license:bundled?authored.license:null,
      attribution:bundled?authored.attribution:null,
      verified_at:bundled?authored.verified_at:null,
      mode:bundled?'bundled':'remote-fallback',
      rights_status:bundled?authored.rights_status:'runtime-license-gated',
      publication_ready:bundled?authored.publication_ready===true:false
    });
  });

  const byId=new Map();
  const byName=new Map();
  for(const record of records){
    if(byId.has(record.species_id))throw new Error(`Duplicate fish asset species_id: ${record.species_id}`);
    if(byName.has(record.species_name))throw new Error(`Duplicate fish asset species name: ${record.species_name}`);
    byId.set(record.species_id,record);
    byName.set(record.species_name,record);
  }

  const bundledRecords=Object.freeze(records.filter(record=>record.mode==='bundled'));
  const remoteFallbackRecords=Object.freeze(records.filter(record=>record.mode==='remote-fallback'));
  const publicationReadyRecords=Object.freeze(records.filter(record=>record.publication_ready));
  const get=speciesId=>byId.get(String(speciesId??'').trim())||null;
  const bySpeciesName=name=>byName.get(String(name??'').trim())||null;
  const resolve=value=>{
    if(value&&typeof value==='object'&&value.species_id)return get(value.species_id);
    const species=speciesRegistry.resolve(value);
    return species?get(species.species_id):null;
  };
  const hasBundled=value=>resolve(value)?.mode==='bundled';
  const assetFor=value=>resolve(value)?.asset||null;

  if(records.length!==speciesRegistry.count)throw new Error(`Fish asset manifest coverage mismatch: ${records.length}/${speciesRegistry.count}`);
  if(bundledRecords.length!==authoring.assets.length)throw new Error(`Fish asset bundled coverage mismatch: ${bundledRecords.length}/${authoring.assets.length}`);

  globalThis.FISH_TARGET_FISH_ASSET_MANIFEST=Object.freeze({
    version:'FISH-ASSET-MANIFEST-2',
    authoringVersion:authoring.version,
    policy:authoring.policy,
    count:records.length,
    bundledCount:bundledRecords.length,
    remoteFallbackCount:remoteFallbackRecords.length,
    publicationReadyCount:publicationReadyRecords.length,
    records:Object.freeze(records.slice()),
    bundledRecords,
    remoteFallbackRecords,
    publicationReadyRecords,
    get,
    bySpeciesName,
    resolve,
    hasBundled,
    assetFor,
    bundledSheet:SHEET
  });
})();
