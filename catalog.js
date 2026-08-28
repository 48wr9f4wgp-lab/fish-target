(()=>{
  const CATEGORIES=['rod','reel'];
  const STATUSES=['current','discontinued','legacy','unknown'];
  const LICENSES=['synthetic','internal','permitted','licensed','restricted','unknown'];
  const PROD_LICENSES=new Set(['internal','permitted','licensed']);
  const providers=globalThis.FISH_TARGET_CATALOG_PROVIDERS||null;
  const fixtures=Array.isArray(globalThis.FISH_TARGET_CATALOG_FIXTURES)?globalThis.FISH_TARGET_CATALOG_FIXTURES:[];
  const MAKERS=[...new Set([...(providers?.providers||[]).map(p=>p.maker),...fixtures.map(p=>p?.maker).filter(Boolean)])];
  const text=v=>String(v??'').trim();
  const hashToken=value=>{let h=2166136261;for(const ch of value){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const slug=v=>{const raw=text(v).normalize('NFKC').toLowerCase().replace(/[’'"`]/g,'');const ascii=raw.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return /^[\x00-\x7F]*$/.test(raw)?(ascii||'unknown'):`${ascii||'u'}-${hashToken(raw)}`};
  const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
  const queryText=v=>text(v).normalize('NFKC').toLowerCase();
  const clampInt=(v,fallback,min,max)=>{const n=Number(v);return Number.isInteger(n)?Math.max(min,Math.min(max,n)):fallback};

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
    const jan=text(product.identifiers?.jan),upc=text(product.identifiers?.upc);
    if(jan&&!/^\d{13}$/.test(jan))errors.push('invalid JAN');
    if(upc&&!/^\d{12}$/.test(upc))errors.push('invalid UPC');
    const specs=product.specs||{};
    const numeric=['length_ft','length_m','pieces','weight_g','lure_min_g','lure_max_g','jig_max_g','line_pe_min','line_pe_max','reel_size','gear_ratio','retrieve_cm','max_drag_kg'];
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
    const seen=new Set(),seenJan=new Map(),seenUpc=new Map();
    for(const product of items||[]){
      const local=validateProduct(product,{production});
      if(seen.has(product?.product_id))local.push('duplicate product_id');
      seen.add(product?.product_id);
      const jan=text(product?.identifiers?.jan),upc=text(product?.identifiers?.upc);
      if(jan){if(seenJan.has(jan)&&seenJan.get(jan)!==product?.product_id)local.push('duplicate JAN');else seenJan.set(jan,product?.product_id)}
      if(upc){if(seenUpc.has(upc)&&seenUpc.get(upc)!==product?.product_id)local.push('duplicate UPC');else seenUpc.set(upc,product?.product_id)}
      if(local.length)errors.push({product_id:product?.product_id||null,errors:local});
    }
    return errors;
  }

  const PRODUCTS=fixtures.map(raw=>Object.freeze({...raw,product_id:raw.product_id||productId(raw),specs:Object.freeze({...raw.specs}),source:Object.freeze({...raw.source}),identifiers:Object.freeze({...raw.identifiers})}));

  function matches(product,{maker,category,series,status,statuses,query}={}){
    if(maker&&product.maker!==maker)return false;
    if(category&&product.category!==category)return false;
    if(series&&product.series!==series)return false;
    if(status&&product.status!==status)return false;
    if(Array.isArray(statuses)&&statuses.length&&!statuses.includes(product.status))return false;
    const q=queryText(query);
    const ids=Object.values(product.identifiers||{}).join(' ');
    if(q&&!queryText(`${product.maker} ${product.series} ${product.model} ${product.display_name} ${ids}`).includes(q))return false;
    return true;
  }

  function list(criteria={}){return PRODUCTS.filter(product=>matches(product,criteria));}
  function search(criteria={}){
    const offset=clampInt(criteria.offset,0,0,1000000);
    const limit=clampInt(criteria.limit,50,1,100);
    const matchesAll=list(criteria);
    const items=matchesAll.slice(offset,offset+limit);
    return Object.freeze({items,total:matchesAll.length,offset,limit,hasMore:offset+items.length<matchesAll.length});
  }
  async function loadPage(criteria={}){return search(criteria);}
  function catalogIndex({category}={}){
    const rows=category?PRODUCTS.filter(p=>p.category===category):PRODUCTS;
    const makerEntries=[...new Set(rows.map(p=>p.maker))].map(maker=>{
      const makerRows=rows.filter(p=>p.maker===maker);
      return Object.freeze({maker,count:makerRows.length,series:[...new Set(makerRows.map(p=>p.series))]});
    });
    return Object.freeze({total:rows.length,makers:Object.freeze(makerEntries)});
  }
  const makers=category=>[...new Set(PRODUCTS.filter(p=>!category||p.category===category).map(p=>p.maker))];
  const series=(maker,category)=>[...new Set(list({maker,category}).map(p=>p.series))];
  const get=id=>PRODUCTS.find(p=>p.product_id===id)||null;
  function statusInfo(status){
    return ({current:{label:'現行',selectable:true,needsReview:false},discontinued:{label:'廃番',selectable:true,needsReview:true},legacy:{label:'旧モデル',selectable:true,needsReview:true},unknown:{label:'状態不明',selectable:true,needsReview:true}})[status]||{label:'状態不明',selectable:true,needsReview:true};
  }
  function ownedSnapshot(product,{id,name,lineType='',lineNo=null,user_overrides=null}={}){
    if(!product)return null;
    const base={id:id||'',source:'catalog',product_id:product.product_id,name:name||product.display_name,maker:product.maker,series:product.series,model:product.model,catalog_status:product.status,license_status:product.source?.license_status||'unknown',user_overrides:user_overrides&&typeof user_overrides==='object'?{...user_overrides}:{}};
    if(product.category==='rod')return {...base,length:finite(product.specs?.length_ft),power:text(product.specs?.power).toUpperCase(),maxLure:finite(product.specs?.lure_max_g)};
    return {...base,size:finite(product.specs?.reel_size),lineType:text(lineType),lineNo:finite(lineNo)};
  }

  const validation=validateCatalog(PRODUCTS);
  if(validation.length)console.warn('Development catalog validation failed',validation);
  globalThis.FISH_TARGET_CATALOG=Object.freeze({mode:'development',version:'V23-DEV2',makers:MAKERS.slice(),categories:CATEGORIES.slice(),statuses:STATUSES.slice(),licenseStatuses:LICENSES.slice(),products:PRODUCTS.slice(),productId,validateProduct,validateCatalog,list,search,loadPage,index:catalogIndex,makersFor:makers,seriesFor:series,get,statusInfo,ownedSnapshot,providerFor:maker=>providers?.byMaker?.(maker)||null,productionEligible:p=>PROD_LICENSES.has(p?.source?.license_status)&&providerPublishable(p)});
})();
