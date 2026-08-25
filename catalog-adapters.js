(()=>{
  const providers=globalThis.FISH_TARGET_CATALOG_PROVIDERS||null;
  const text=v=>String(v??'').trim();
  const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;

  function normalizeSpecs(category,specs={}){
    if(category==='rod')return {
      length_ft:finite(specs.length_ft),weight_g:finite(specs.weight_g),power:text(specs.power).toUpperCase(),
      lure_min_g:finite(specs.lure_min_g),lure_max_g:finite(specs.lure_max_g),jig_max_g:finite(specs.jig_max_g),
      line_pe_min:finite(specs.line_pe_min),line_pe_max:finite(specs.line_pe_max)
    };
    return {
      reel_size:finite(specs.reel_size),weight_g:finite(specs.weight_g),gear_ratio:finite(specs.gear_ratio),
      retrieve_cm:finite(specs.retrieve_cm),max_drag_kg:finite(specs.max_drag_kg)
    };
  }

  function normalizeSource(provider,input={}){
    const sourceType=text(input.source_type)||'synthetic';
    const fallbackLicense=sourceType==='synthetic'?'synthetic':provider?.defaultLicenseStatus||'unknown';
    return {
      source_type:sourceType,
      source_provider:text(input.source_provider)||provider?.id||'unknown',
      source_url:input.source_url||null,
      retrieved_at:text(input.retrieved_at)||null,
      last_verified:text(input.last_verified)||null,
      license_status:text(input.license_status)||fallbackLicense
    };
  }

  function createAdapter(maker){
    const provider=providers?.byMaker?.(maker)||null;
    if(!provider)throw new Error(`Missing provider for ${maker}`);
    return Object.freeze({
      maker,providerId:provider.id,mode:provider.mode,productionEnabled:provider.productionEnabled,
      normalize(raw={}){
        if(raw.maker&&raw.maker!==maker)throw new Error(`Adapter maker mismatch: expected ${maker}`);
        const category=text(raw.category);
        if(!['rod','reel'].includes(category))throw new Error(`Unsupported category for ${maker}: ${category||'missing'}`);
        const series=text(raw.series),model=text(raw.model);
        if(!series||!model)throw new Error(`Missing series/model for ${maker}`);
        return {
          maker,category,series,generation:text(raw.generation)||'unknown',model,
          display_name:text(raw.display_name)||`${series} ${model}`,
          status:text(raw.status)||'unknown',
          specs:normalizeSpecs(category,raw.specs),
          source:normalizeSource(provider,raw.source)
        };
      },
      normalizeMany(rows=[]){return rows.map(row=>this.normalize(row))}
    });
  }

  const ADAPTERS=Object.freeze({DAIWA:createAdapter('DAIWA'),SHIMANO:createAdapter('SHIMANO')});
  const byMaker=maker=>ADAPTERS[maker]||null;
  globalThis.FISH_TARGET_CATALOG_ADAPTERS=Object.freeze({byMaker,adapters:Object.values(ADAPTERS),normalizeSpecs});
})();
