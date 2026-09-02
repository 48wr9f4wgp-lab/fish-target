(()=>{
const src='https://www.jackall.co.jp/saltwater/offshore-casting/products/switch-stick/';
const a=[
['SS-C551',5.4167,1.65,'5\'5"/1.65m',1,'1pc',97,'','SUPER ULTRA LIGHT',160,0.6,1.0,'4525807278606'],
['SS-C552',5.4167,1.65,'5\'5"/1.65m',1,'1pc',83,'UL','ULTRA LIGHT',160,0.6,1.0,'4525807278613'],
['SS-S553',5.4167,1.65,'5\'5"/1.65m',1,'1pc',81,'L','LIGHT',60,0.6,1.0,'4525807278620']
];
const rows=a.map(([model,length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_max_g,line_pe_min,line_pe_max,jan])=>({maker:'JACKALL',category:'rod',series:'SWITCH STICK',generation:'current',model,display_name:'SWITCH STICK '+model,status:'unknown',specs:{length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_min_g:null,lure_max_g,jig_max_g:null,lure_weight_raw:`MAX ${lure_max_g}g`,line_weight_raw:`PE ${line_pe_min}〜${line_pe_max}号`,line_pe_min,line_pe_max,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'jackall-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:{jan}}));
const batch=Object.freeze({id:'jackall-switch-stick-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
