(()=>{
  const speciesRegistry=globalThis.FISH_TARGET_SPECIES_REGISTRY;
  if(!speciesRegistry?.records)return;

  const SHEET='fish-real-v7.avif';
  const BUNDLED_ORDER=Object.freeze([
    'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ',
    'マゴチ','アジ','メバル','アオリイカ','タチウオ',
    'クロダイ','マダイ','シロギス','カワハギ','ブラックバス',
    'ニジマス','アユ','コイ','ヤマメ・イワナ'
  ]);
  const bundledIndex=new Map(BUNDLED_ORDER.map((name,index)=>[name,index]));

  const freezeAsset=(name,index)=>Object.freeze({
    type:'sprite-sheet',
    file:SHEET,
    slot:index,
    columns:5,
    rows:4,
    species_name:name
  });

  const records=speciesRegistry.records.map(species=>{
    const index=bundledIndex.get(species.name);
    const bundled=index!==undefined;
    return Object.freeze({
      species_id:species.species_id,
      species_name:species.name,
      asset:bundled?freezeAsset(species.name,index):null,
      source:bundled?'project-bundled-existing':'wikimedia-runtime-resolver',
      author:null,
      license:bundled?'unknown':null,
      attribution:null,
      verified_at:null,
      mode:bundled?'bundled':'remote-fallback',
      rights_status:bundled?'unverified':'runtime-license-gated',
      publication_ready:false
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
  if(bundledRecords.length!==BUNDLED_ORDER.length)throw new Error(`Fish asset bundled coverage mismatch: ${bundledRecords.length}/${BUNDLED_ORDER.length}`);

  globalThis.FISH_TARGET_FISH_ASSET_MANIFEST=Object.freeze({
    version:'FISH-ASSET-MANIFEST-1',
    policy:'bundled-first-license-gated-remote-fallback',
    count:records.length,
    bundledCount:bundledRecords.length,
    remoteFallbackCount:remoteFallbackRecords.length,
    records:Object.freeze(records.slice()),
    bundledRecords,
    remoteFallbackRecords,
    get,
    bySpeciesName,
    resolve,
    hasBundled,
    assetFor,
    bundledSheet:SHEET
  });
})();
