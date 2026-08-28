(()=>{
  const providers=globalThis.FISH_TARGET_CATALOG_PROVIDERS||null;
  const text=v=>String(v??'').trim();
  const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
  const feetFromRaw=v=>{const s=text(v);let m=s.match(/^(\d+)'\s*(\d+)"$/);if(!m)m=s.match(/^(\d+)ft(?:(\d+)in)?$/i);return m?Number(m[1])+Number(m[2]||0)/12:null};

  function normalizeSpecs(category,specs={}){
    if(category==='rod'){
      const lm=finite(specs.length_m),lf=finite(specs.length_ft),lr=text(specs.length_raw),rawFt=feetFromRaw(lr);
      return {
        length_ft:lf??rawFt??(lm===null?null:Number((lm*3.28084).toFixed(3))),length_m:lm,length_raw:lr,pieces:finite(specs.pieces),pieces_raw:text(specs.pieces_raw),
        weight_g:finite(specs.weight_g),power:text(specs.power).toUpperCase(),power_raw:text(specs.power_raw),
        lure_min_g:finite(specs.lure_min_g),lure_max_g:finite(specs.lure_max_g),jig_max_g:finite(specs.jig_max_g),lure_weight_raw:text(specs.lure_weight_raw),
        line_pe_min:finite(specs.line_pe_min),line_pe_max:finite(specs.line_pe_max),line_weight_raw:text(specs.line_weight_raw),sinker_load_raw:text(specs.sinker_load_raw)
      };
    }
    return {
      reel_size:finite(specs.reel_size),weight_g:finite(specs.weight_g),gear_ratio:finite(specs.gear_ratio),
      retrieve_cm:finite(specs.retrieve_cm),max_drag_kg:finite(specs.max_drag_kg),
      pe_capacity_raw:text(specs.pe_capacity_raw),line_capacity_raw:text(specs.line_capacity_raw)||text(specs.pe_capacity_raw)
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

  function normalizeIdentifiers(input={}){
    const out={};
    for(const key of ['jan','upc','sku','product_code']){const value=text(input[key]);if(value)out[key]=value}
    return out;
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
          source:normalizeSource(provider,raw.source),
          identifiers:normalizeIdentifiers(raw.identifiers||{})
        };
      },
      normalizeMany(rows=[]){return rows.map(row=>this.normalize(row))}
    });
  }

  const ADAPTERS=Object.freeze(Object.fromEntries((providers?.providers||[]).map(provider=>[provider.maker,createAdapter(provider.maker)])));
  const byMaker=maker=>ADAPTERS[maker]||null;
  globalThis.FISH_TARGET_CATALOG_ADAPTERS=Object.freeze({byMaker,adapters:Object.values(ADAPTERS),normalizeSpecs,normalizeIdentifiers});
})();
