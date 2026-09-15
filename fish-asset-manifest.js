(()=>{
  const speciesRegistry=globalThis.FISH_TARGET_SPECIES_REGISTRY;
  const authoring=globalThis.FISH_TARGET_FISH_ASSET_AUTHORING;
  if(!speciesRegistry?.records||!authoring?.assets)return;

  const PUBLICATION_BUILD=document.documentElement.dataset.publicationBuild==='on';
  const SHEET=authoring.bundled_sheet;
  const DEV_BATCH2=Object.freeze([
    {species_name:'シーバス',asset:{type:'file',file:'fish-master-v34-seabass.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'1c6d2a60b6756c055e7bc69b1108b411d8586d007c26adf7f916755aaa2144f0',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf56-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'アジ',asset:{type:'file',file:'fish-master-v34-aji.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'8678c123bdb34afbb9e919c17e184f48f26c396ef98809f838131c482e946f79',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf63-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'メバル',asset:{type:'file',file:'fish-master-v34-mebaru.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'e18fa6c60c581590c3270dc4eeef93611ee2b8c069bd063fef02e84ad0c08baa',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf63-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'マゴチ',asset:{type:'file',file:'fish-master-v34-magochi.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'453ff2972794f2c8249137ba62200e6ab8ff95bb9e9f51bd4e35f90a9212f86c',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf56-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'タチウオ',asset:{type:'file',file:'fish-master-v34-tachiuo.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'07763dc855a9e4c1d1d29c0fbadad49870bd40a4503ee6cb577985519d1ff676',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf63-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'マダイ',asset:{type:'file',file:'fish-master-v34-madai.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'517cf42a6ce893b082711e7430213867d17caa25bcf229aa3272c07d43f3711b',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf56-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'ブラックバス',asset:{type:'file',file:'fish-master-v34-blackbass.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'e795c5f8bf0e675629b8d749613830150bfdd4e60257a6b93c844fe756f7161e',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf56-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}},
    {species_name:'サワラ',asset:{type:'file',file:'fish-master-v34-sawara.avif'},source:'project-generated-original',source_url:null,author:'FISH TARGET project',license:'Project original',attribution:null,verified_at:null,rights_status:'unverified',publication_ready:false,provenance:{generator:'FISH TARGET vector authoring',model:'deterministic SVG vector geometry',prompt_sha256:'68a9704e1d6501a44e077b1bc847af9ec47af84b8a39b8028120100793970a7f',output_sha256:'9883c809542739e6f1b913d4cd6ca85213b167dca57622f08f37e1d5ec2e49a6',generated_at:'2026-09-15',transformations:['author-species-specific-vector-from-v34-identity-contract','render-to-1200x768-white-canvas','enforce-minimum-8pct-horizontal-safe-margin','encode-avif-ffmpeg-libaom-crf63-yuv420p'],transformation_notice:'Project-authored development visual without external image material. Geometry, canvas, safe margin, 390px review, and byte integrity are checked; species-identity approval is still pending. The prompt_sha256 field stores the V34 vector-authoring basis hash, not an AI image prompt.'}}
  ]);
  const devByName=new Map(DEV_BATCH2.map(record=>[record.species_name,Object.freeze(record)]));
  const effectiveAssets=PUBLICATION_BUILD
    ? authoring.assets
    : authoring.assets.map(record=>devByName.get(record.species_name)||record);
  const authoredByName=new Map(effectiveAssets.map(record=>[record.species_name,record]));
  const fileRecords=new Map();
  for(const authored of effectiveAssets){
    if(!speciesRegistry.resolve(authored.species_name))throw new Error(`Authored fish asset species is not registered: ${authored.species_name}`);
    const file=String(authored?.asset?.file||'').trim();
    if(file){const rows=fileRecords.get(file)||[];rows.push(authored);fileRecords.set(file,rows)}
  }
  const publicationSafeFiles=new Set([...fileRecords].filter(([,rows])=>rows.length&&rows.every(row=>row.publication_ready===true)).map(([file])=>file));

  const freezeAsset=(asset,name)=>Object.freeze({...asset,species_name:name});
  const freezeProvenance=provenance=>provenance?Object.freeze({...provenance,transformations:Object.freeze([...(provenance.transformations||[])])}):null;
  const records=speciesRegistry.records.map(species=>{
    const authored=authoredByName.get(species.name)||null;
    const file=String(authored?.asset?.file||'').trim();
    const bundled=Boolean(authored?.asset)&&(!PUBLICATION_BUILD||publicationSafeFiles.has(file));
    const developmentOnly=!PUBLICATION_BUILD&&devByName.has(species.name);
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
      provenance:bundled?freezeProvenance(authored.provenance):null,
      mode:bundled?'bundled':'remote-fallback',
      rights_status:bundled?authored.rights_status:'runtime-license-gated',
      publication_ready:bundled?authored.publication_ready===true:false,
      development_only:developmentOnly
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
  const developmentOnlyRecords=Object.freeze(records.filter(record=>record.development_only));
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
  const expectedBundled=PUBLICATION_BUILD
    ? effectiveAssets.filter(record=>publicationSafeFiles.has(String(record?.asset?.file||'').trim())).length
    : effectiveAssets.length;
  if(bundledRecords.length!==expectedBundled)throw new Error(`Fish asset bundled coverage mismatch: ${bundledRecords.length}/${expectedBundled}`);
  if(!PUBLICATION_BUILD&&developmentOnlyRecords.length!==DEV_BATCH2.length)throw new Error(`Fish asset development overlay mismatch: ${developmentOnlyRecords.length}/${DEV_BATCH2.length}`);
  if(PUBLICATION_BUILD&&developmentOnlyRecords.length)throw new Error('Publication build must not expose development-only fish assets');

  globalThis.FISH_TARGET_FISH_ASSET_MANIFEST=Object.freeze({
    version:'FISH-ASSET-MANIFEST-3',
    authoringVersion:authoring.version,
    policy:authoring.policy,
    publicationBuild:PUBLICATION_BUILD,
    count:records.length,
    bundledCount:bundledRecords.length,
    remoteFallbackCount:remoteFallbackRecords.length,
    publicationReadyCount:publicationReadyRecords.length,
    developmentOnlyCount:developmentOnlyRecords.length,
    records:Object.freeze(records.slice()),
    bundledRecords,
    remoteFallbackRecords,
    publicationReadyRecords,
    developmentOnlyRecords,
    get,
    bySpeciesName,
    resolve,
    hasBundled,
    assetFor,
    bundledSheet:SHEET
  });
})();
