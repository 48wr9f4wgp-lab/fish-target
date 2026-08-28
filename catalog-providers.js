(()=>{
  const research=(id,maker,description)=>Object.freeze({
    id,maker,mode:'research',productionEnabled:false,defaultLicenseStatus:'restricted',description
  });
  const PROVIDERS=[
    Object.freeze({
      id:'daiwa-official-poc',maker:'DAIWA',mode:'poc',productionEnabled:false,defaultLicenseStatus:'unknown',
      description:'Official-site adapter research only. No production redistribution until rights are confirmed.'
    }),
    research('shimano-official-research','SHIMANO','Official-site factual-spec research only. Production publication remains disabled until rights and source policy are approved.'),
    research('abugarcia-official-research','ABU GARCIA','Pure Fishing / Abu Garcia official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('penn-official-research','PENN','PENN official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('okuma-official-research','OKUMA','Okuma official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('majorcraft-official-research','MAJOR CRAFT','Major Craft official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('tailwalk-official-research','TAILWALK','tailwalk official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('jackson-official-research','JACKSON','Jackson official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('prox-official-research','PROX','PROX official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('fishman-official-research','FISHMAN','Fishman official-site factual-spec research only. Production publication remains disabled until rights are approved.'),
    research('yamaga-official-research','YAMAGA BLANKS','YAMAGA Blanks official-site factual-spec research only. Production publication remains disabled until rights are approved.')
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
