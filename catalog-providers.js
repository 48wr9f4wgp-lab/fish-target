(()=>{
  const PROVIDERS=[
    Object.freeze({
      id:'daiwa-official-poc',
      maker:'DAIWA',
      mode:'poc',
      productionEnabled:false,
      defaultLicenseStatus:'unknown',
      description:'Official-site adapter research only. No production redistribution until rights are confirmed.'
    }),
    Object.freeze({
      id:'shimano-fixture-only',
      maker:'SHIMANO',
      mode:'fixture-only',
      productionEnabled:false,
      defaultLicenseStatus:'restricted',
      description:'Production official-site data disabled. Synthetic fixtures only until permitted/licensed source exists.'
    })
  ];
  const PRODUCTION_LICENSES=new Set(['internal','permitted','licensed']);
  const byMaker=maker=>PROVIDERS.find(p=>p.maker===maker)||null;
  const canPublish=(provider,licenseStatus)=>Boolean(provider?.productionEnabled&&PRODUCTION_LICENSES.has(licenseStatus));
  const assertPublishable=(provider,licenseStatus)=>{
    if(!canPublish(provider,licenseStatus))throw new Error(`Catalog provider ${provider?.id||'unknown'} is not production-publishable`);
    return true;
  };
  globalThis.FISH_TARGET_CATALOG_PROVIDERS=Object.freeze({providers:PROVIDERS.slice(),byMaker,canPublish,assertPublishable});
})();
