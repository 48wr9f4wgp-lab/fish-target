(()=>{
const src='https://www.jackall.co.jp/saltwater/offshore-casting/products/gsw/';
const a=[
['GSW-C178MH73',5.84,1.78,'178cm',2,'2本',117,'MH','Medium Heavy',null,120,'MAX120g',null,'20〜80号(75~300g)','PE MAX3.0号',null,3.0],
['GSW-C190H82',6.234,1.90,'190cm',2,'2本',122,'H','Heavy',null,120,'LURE MAX120g',null,'30〜100号(112~375g)','PE MAX3.0号',null,3.0],
['GSW-S68XSUL-ST',6.667,2.03,'6\'8"(2.03m)',2,'2本',106,'','Extra Super Ultra Light',null,null,'鯛ラバ MAX80g',null,'','PE 0.6〜1.0号',0.6,1.0],
['GSW-S63SUL',6.25,1.91,'6\'3"(1.91m)',2,'2本',107,'','Super Ultra Light',null,null,'JIG MAX60g',60,'','PE MAX1.2号',null,1.2],
['GSW-C68SUL',6.667,2.03,'6\'8"(2.03m)',2,'2本',130,'','Super Ultra Light',null,null,'鯛ラバ MAX100g',null,'','PE 0.6〜1.2号',0.6,1.2],
['GSW-C66UL',6.5,1.98,'6\'6"(1.98m)',2,'2本',120,'UL','Ultra Light',null,null,'鯛ラバ MAX130g',null,'','PE 0.6 – 1.5号',0.6,1.5],
['GSW-C58M',5.667,1.73,'5\'8"(1.73m)',2,'2本',128,'M','Medium',null,null,'JIG MAX250g',250,'','PE MAX2.0号',null,2.0],
['GSW-C72MH+',7.167,2.18,'7\'2"(2.18m)',2,'2本',165,'','Medium Heavy+',10,56,'10 - 56g',null,'','PE MAX2.5号',null,2.5],
['GSW-S68L',6.667,2.03,'6\'8"(2.03m)',2,'2本',166,'L','Light',10,45,'10 - 45g',null,'','PE MAX2.0号',null,2.0]
];
const rows=a.map(([model,length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,lure_weight_raw,jig_max_g,sinker_load_raw,line_weight_raw,line_pe_min,line_pe_max])=>({maker:'JACKALL',category:'rod',series:'GSW',generation:'current',model,display_name:'GSW '+model,status:'unknown',specs:{length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,jig_max_g,lure_weight_raw,line_weight_raw,line_pe_min,line_pe_max,sinker_load_raw},source:{source_type:'manufacturer_official',source_provider:'jackall-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:{}}));
const batch=Object.freeze({id:'jackall-gsw-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
