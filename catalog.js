(()=>{
  const MAKERS=['DAIWA','SHIMANO'];
  const CATEGORIES=['rod','reel'];
  const STATUSES=['current','discontinued','legacy','unknown'];
  const LICENSES=['synthetic','internal','permitted','licensed','restricted','unknown'];
  const PROD_LICENSES=new Set(['internal','permitted','licensed']);
  const text=v=>String(v??'').trim();
  const hashToken=value=>{let h=2166136261;for(const ch of value){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const slug=v=>{const raw=text(v).normalize('NFKC').toLowerCase().replace(/[’'"`]/g,'');const ascii=raw.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return /^[\x00-\x7F]*$/.test(raw)?(ascii||'unknown'):`${ascii||'u'}-${hashToken(raw)}`};
  const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;

  function productId({maker,category,series,generation='unknown',model}){
    return [maker,category,series,generation,model].map(slug).join(':');
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

  const source=()=>({
    source_type:'synthetic',
    source_provider:'FISH TARGET synthetic fixture',
    source_url:null,
    retrieved_at:'2026-08-25',
    last_verified:'2026-08-25',
    license_status:'synthetic'
  });

  const rod=(maker,series,generation,model,specs)=>({
    product_id:productId({maker,category:'rod',series,generation,model}),maker,category:'rod',series,generation,model,
    display_name:`${series} ${model}`,status:'current',specs,source:source()
  });
  const reel=(maker,series,generation,model,specs)=>({
    product_id:productId({maker,category:'reel',series,generation,model}),maker,category:'reel',series,generation,model,
    display_name:`${series} ${model}`,status:'current',specs,source:source()
  });

  // Development-only fixtures. Specs are synthetic and are not copied from manufacturer catalogs.
  const PRODUCTS=[
    rod('DAIWA','DEMO SHORE','v23-demo','96M',{length_ft:9.6,power:'M',lure_min_g:10,lure_max_g:50,line_pe_min:0.8,line_pe_max:2}),
    rod('DAIWA','DEMO SHORE','v23-demo','100MH',{length_ft:10,power:'MH',lure_min_g:20,lure_max_g:80,jig_max_g:100,line_pe_min:1.5,line_pe_max:3}),
    rod('DAIWA','DEMO LIGHT','v23-demo','76L',{length_ft:7.6,power:'L',lure_min_g:1,lure_max_g:12,line_pe_min:0.3,line_pe_max:0.8}),
    reel('DAIWA','DEMO SPIN','v23-demo','3000',{reel_size:3000,gear_ratio:5.2,max_drag_kg:10}),
    reel('DAIWA','DEMO SPIN','v23-demo','4000XH',{reel_size:4000,gear_ratio:6.2,max_drag_kg:12}),
    reel('DAIWA','DEMO SW','v23-demo','6000H',{reel_size:6000,gear_ratio:5.7,max_drag_kg:15}),
    rod('SHIMANO','DEMO SEABASS','v23-demo','90ML',{length_ft:9,power:'ML',lure_min_g:6,lure_max_g:36,line_pe_min:0.6,line_pe_max:1.5}),
    rod('SHIMANO','DEMO SHORE','v23-demo','100M',{length_ft:10,power:'M',lure_min_g:10,lure_max_g:60,jig_max_g:70,line_pe_min:1,line_pe_max:2.5}),
    rod('SHIMANO','DEMO EGING','v23-demo','86M',{length_ft:8.6,power:'M',line_pe_min:0.5,line_pe_max:1}),
    reel('SHIMANO','DEMO SPIN','v23-demo','C3000HG',{reel_size:3000,gear_ratio:6,max_drag_kg:9}),
    reel('SHIMANO','DEMO SPIN','v23-demo','4000XG',{reel_size:4000,gear_ratio:6.2,max_drag_kg:11}),
    reel('SHIMANO','DEMO SW','v23-demo','6000HG',{reel_size:6000,gear_ratio:5.7,max_drag_kg:14})
  ];

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
  if(validation.length)console.warn('Synthetic catalog validation failed',validation);

  globalThis.FISH_TARGET_CATALOG=Object.freeze({
    mode:'development',makers:MAKERS.slice(),categories:CATEGORIES.slice(),statuses:STATUSES.slice(),licenseStatuses:LICENSES.slice(),
    products:PRODUCTS.slice(),productId,validateProduct,validateCatalog,list,makersFor:makers,seriesFor:series,get,ownedSnapshot,
    productionEligible:p=>PROD_LICENSES.has(p?.source?.license_status)
  });
})();
