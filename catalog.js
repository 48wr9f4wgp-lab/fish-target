(()=>{
  const MAKERS=['DAIWA','SHIMANO'];
  const CATEGORIES=['rod','reel'];
  const STATUSES=['current','discontinued','legacy','unknown'];
  const LICENSES=['synthetic','internal','permitted','licensed','restricted','unknown'];
  const PROD_LICENSES=new Set(['internal','permitted','licensed']);
  const providers=globalThis.FISH_TARGET_CATALOG_PROVIDERS||null;
  const fixtures=Array.isArray(globalThis.FISH_TARGET_CATALOG_FIXTURES)?globalThis.FISH_TARGET_CATALOG_FIXTURES:[];
  const text=v=>String(v??'').trim();
  const hashToken=value=>{let h=2166136261;for(const ch of value){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const slug=v=>{const raw=text(v).normalize('NFKC').toLowerCase().replace(/[’'"`]/g,'');const ascii=raw.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return /^[\x00-\x7F]*$/.test(raw)?(ascii||'unknown'):`${ascii||'u'}-${hashToken(raw)}`};
  const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;

  function productId({maker,category,series,generation='unknown',model}){
    return [maker,category,series,generation,model].map(slug).join(':');
  }

  function providerPublishable(product){
    const provider=providers?.byMaker?.(product?.maker)||null;
    return Boolean(provider&&providers.canPublish(provider,product?.source?.license_status));
  }

  function validateProduct(product,{production=false}={}){
    const errors=[];
    if(!product||typeof product!=='object')return ['product must be an object'];
    if(!MAKERS.includes(product.maker))errors.push('invalid maker');
    if(!CATEGORIES.includes(product.category))errors.push('invalid category');
    if(!text(product.series))errors.push('series required');
    if(!text(product.model))errors.push('model required');
    if(!text(product.display_name))errors.push('display_name required');
    if(!STATUSES.includes(product.status))errors.push('invalid status');
    if(!text(product.product_id))errors.push('product_id required');
    if(!product.source||typeof product.source!=='object')errors.push('source required');
    const license=product.source?.license_status;
    if(!LICENSES.includes(license))errors.push('invalid license_status');
    if(production&&!PROD_LICENSES.has(license))errors.push('source not eligible for production');
    if(production&&!providerPublishable(product))errors.push('provider not production-enabled');
    if(product.source?.source_type!=='synthetic'&&!text(product.source?.source_provider))errors.push('source_provider required');
    const specs=product.specs||{};
    const numeric=['length_ft','weight_g','lure_min_g','lure_max_g','jig_max_g','line_pe_min','line_pe_max','reel_size','gear_ratio','retrieve_cm','max_drag_kg'];
    for(const key of numeric){
      if(specs[key]!==undefined&&specs[key]!==null&&finite(specs[key])===null)errors.push(`invalid numeric spec: ${key}`);
      if(finite(specs[key])!==null&&finite(specs[key])<0)errors.push(`negative numeric spec: ${key}`);
    }
    if(finite(specs.lure_min_g)!==null&&finite(specs.lure_max_g)!==null&&Number(specs.lure_min_g)>Number(specs.lure_max_g))errors.push('lure range reversed');
    if(finite(specs.line_pe_min)!==null&&finite(specs.line_pe_max)!==null&&Number(specs.line_pe_min)>Number(specs.line_pe_max))errors.push('PE range reversed');
    const expected=productId(product);
    if(product.product_id!==expected)errors.push('unstable product_id');
    return errors;
  }

  function validateCatalog(items,{production=false}={}){
    const errors=[];
    const seen=new Set();
    for(const product of items||[]){
      const local=validateProduct(product,{production});
      if(seen.has(product?.product_id))local.push('duplicate product_id');
      seen.add(product?.product_id);
      if(local.length)errors.push({product_id:product?.product_id||null,errors:local});
    }
    return errors;
  }

  // DEV1 consumes only explicitly supplied fixtures. Future provider output plugs into this same canonical boundary.
  const PRODUCTS=fixtures.map(raw=>Object.freeze({...raw,product_id:raw.product_id||productId(raw),specs:Object.freeze({...raw.specs}),source:Object.freeze({...raw.source})}));

  function list({maker,category,series,query}={}){
    const q=text(query).toLowerCase();
    return PRODUCTS.filter(p=>(!maker||p.maker===maker)&&(!category||p.category===category)&&(!series||p.series===series)&&(!q||`${p.maker} ${p.series} ${p.model} ${p.display_name}`.toLowerCase().includes(q)));
  }
  const makers=category=>[...new Set(PRODUCTS.filter(p=>!category||p.category===category).map(p=>p.maker))];
  const series=(maker,category)=>[...new Set(list({maker,category}).map(p=>p.series))];
  const get=id=>PRODUCTS.find(p=>p.product_id===id)||null;

  function ownedSnapshot(product,{id,name,lineType='',lineNo=null}={}){
    if(!product)return null;
    const base={id:id||'',source:'catalog',product_id:product.product_id,name:name||product.display_name,maker:product.maker,series:product.series,model:product.model,catalog_status:product.status,license_status:product.source?.license_status||'unknown'};
    if(product.category==='rod')return {...base,length:finite(product.specs?.length_ft),power:text(product.specs?.power).toUpperCase(),maxLure:finite(product.specs?.lure_max_g)};
    return {...base,size:finite(product.specs?.reel_size),lineType:text(lineType),lineNo:finite(lineNo)};
  }

  const validation=validateCatalog(PRODUCTS);
  if(validation.length)console.warn('Development catalog validation failed',validation);

  globalThis.FISH_TARGET_CATALOG=Object.freeze({
    mode:'development',makers:MAKERS.slice(),categories:CATEGORIES.slice(),statuses:STATUSES.slice(),licenseStatuses:LICENSES.slice(),
    products:PRODUCTS.slice(),productId,validateProduct,validateCatalog,list,makersFor:makers,seriesFor:series,get,ownedSnapshot,
    providerFor:maker=>providers?.byMaker?.(maker)||null,productionEligible:p=>PROD_LICENSES.has(p?.source?.license_status)&&providerPublishable(p)
  });
})();
