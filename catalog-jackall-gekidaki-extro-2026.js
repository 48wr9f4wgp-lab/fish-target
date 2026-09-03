(()=>{
const src='https://www.jackall.co.jp/saltwater/offshore-casting/products/gekidaki-shaft-extro/';
const a=[
['GDX-C60SUL',6,1.83,'6’0”/1.83m',2,'2pcs (仕舞寸法137.0cm)',122,'','SUPER ULTRA LIGHT','5-20号',0.4,0.8,''],
['GDX-C64ML',6.333,1.93,'6\'4"/1.93m',2,'2pcs (仕舞寸法147.0cm)',130,'ML','MEDIUM LIGHT','10-40号',0.4,0.8,''],
['GDX-C61MH-OMO',6.083,1.86,'6\'1"/1.86m',2,'2pcs (仕舞寸法139.5cm)',153,'MH','MEDIUM HEAVY','20-40号',0.6,1.0,''],
['GDX-C68UL',6.667,2.03,'6\'8"/2.03m',2,'2pcs (handle joint)',133,'UL','ULTRA LIGHT','10-30号',0.4,0.8,'4525807303117'],
['GDX-S60MH-OMO',6,1.83,'6\'00"/1.83m',2,'2pcs (handle joint)',133,'MH','MEDIUM HEAVY','10-40号',0.6,1.0,'4525807303124'],
['GDX-S65MH+OMO',6.417,1.96,'6’5”/1.96m',2,'2pcs (handle joint)',143,'MH','MEDIUM HEAVY','10-50号',0.6,1.0,'4525807303131']
];
const rows=a.map(([model,length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,sinker_load_raw,line_pe_min,line_pe_max,jan])=>({maker:'JACKALL',category:'rod',series:'GEKIDAKI SHAFT EXTRO',generation:'current',model,display_name:'GEKIDAKI SHAFT EXTRO '+model,status:'unknown',specs:{length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_min_g:null,lure_max_g:null,jig_max_g:null,lure_weight_raw:sinker_load_raw,line_weight_raw:`PE ${line_pe_min}-${line_pe_max}号`,line_pe_min,line_pe_max,sinker_load_raw},source:{source_type:'manufacturer_official',source_provider:'jackall-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:jan?{jan}:{}}));
const batch=Object.freeze({id:'jackall-gekidaki-extro-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
