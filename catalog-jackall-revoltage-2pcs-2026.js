(()=>{
const src='https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/';
const a=[
['RVⅡ-C69L+BF/2',6.75,2.06,'6\'9"（2.06m）','2pcs (仕舞寸法106.5cm)',100,'','LIGHT PLUS',2.7,7,'3/32-1/4oz (2.7-7g)',null,'5-12lb'],
['RVⅡ-C64ML-ST/2',6.333,1.93,'6\'4"(1.93m)','2pcs (仕舞寸法100.0cm)',98,'ML','MEDIUM LIGHT',3.5,14,'1/8-1/2oz(3.5-14g)',null,'5-12lb'],
['RVⅡ-C610M/2',6.833,2.08,'6\'10" (2.08m)','2pcs (仕舞寸法107.5cm)',114,'M','MEDIUM',7,21,'1/4-3/4oz (7.0-21g)',null,'8-16lb'],
['RVⅡ-C66M+/2',6.5,1.98,'6\'6"(1.98m)','2pcs (仕舞寸法102.5cm)',111,'','MEDIUM PLUS',5,21,'3/16-3/4oz (5.0-21g)',null,'8-16lb'],
['RVⅡ-C68MH/2',6.667,2.03,'6\'8"(2.03m)','2pcs (仕舞寸法105.0cm)',117,'MH','MEDIUM HEAVY',7,28,'1/4-1oz (7.0-28g)',null,'10-20lb'],
['RVⅡ-C67MH+/2',6.583,2.01,'6\'7"(2.01m)','2pcs (仕舞寸法103.5cm)',115,'','MEDIUM HEAVY PLUS',10.5,56,'3/8-2oz (10.5-56g)',5,'12-24lb / PE MAX#5'],
['RVⅡ-C71H-ST/2',7.083,2.16,'7\'1"(2.16m)','2pcs (仕舞寸法111.5cm)',125,'H','HEAVY (Solid Tip)',7,42,'1/4-1_1/2oz (7-42g)',null,'12-24lb'],
['RVⅡ-C73H/2',7.25,2.21,'7\'3"(2.21m)','2pcs (仕舞寸法114.0cm)',125,'H','HEAVY',10.5,42,'3/8-1_1/2oz(10.5-42g)',5,'12-24lb / PE MAX #5'],
['RVⅡ-C711H/2',7.917,2.41,'7\'11"(2.41m)','2pcs (仕舞寸法124.0cm)',140,'H','HEAVY',10.5,70,'3/8-2_1/2oz(10.5-70g)',null,'16-30lb'],
['RVⅡ-S65UL/2',6.417,1.96,'6\'5"(1.96m)','2pcs (仕舞寸法101.0cm)',80,'UL','ULTRA LIGHT',0.9,7,'1/32-1/4oz(0.9-7g)',null,'2-4lb'],
['RVⅡ-S69UL+/2',6.75,2.06,'6\'9"(2.06m)','2pcs (仕舞寸法106.5cm)',82,'','ULTRA LIGHT PLUS',0.9,9,'1/32-5/16oz(0.9-9g)',0.8,'3-5lb / PE MAX #0.8'],
['RVⅡ-S65L/2',6.417,1.96,'6\'5"(1.96m)','2pcs (仕舞寸法101.0cm)',86,'L','LIGHT',0.9,7,'1/32-1/4oz(0.9-7.0g)',1,'2.5-6lb PE MAX#1.0'],
['RVⅡ-S61L-ST/2',6.083,1.85,'6\'1"(1.85m)','2pcs (仕舞寸法96.0cm)',80,'L','LIGHT (Solid Tip)',2.7,7,'3/32-1/4oz(2.7-7g)',null,'2.5-6lb'],
['RVⅡ-S67ML/2',6.583,2.01,'6\'7"(2.01m)','2pcs (仕舞寸法104.0cm)',99,'ML','MEDIUM LIGHT',1.8,14,'1/16-1/2oz(1.8-14g)',1.5,'2.5-6lb / PE MAX #1.5'],
['RVⅡ-S78ML+/2',7.667,2.34,'7\'8"(2.34m)','2pcs (仕舞寸法120.5cm)',106,'','MEDIUM LIGHT PLUS',3.5,18,'1/8-5/8oz(3.5-18g)',2,'4-8lb PE MAX#2'],
['RVⅡ-S68MH+/2',6.667,2.03,'6\'8"(2.03m)','2pcs (仕舞寸法105.0cm)',108,'','MEDIUM HEAVY PLUS',3.5,18,'1/8-5/8oz(3.5-18g)',2.5,'6-14lb / PE MAX #2.5']
];
const rows=a.map(([model,length_ft,length_m,length_raw,pieces_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,lure_weight_raw,line_pe_max,line_weight_raw])=>({maker:'JACKALL',category:'rod',series:'REVOLTAGE 2pcs',generation:'current',model,display_name:'REVOLTAGE 2pcs '+model,status:'unknown',specs:{length_ft,length_m,length_raw,pieces:2,pieces_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,jig_max_g:null,lure_weight_raw,line_weight_raw,line_pe_min:null,line_pe_max,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'jackall-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:{}}));
const batch=Object.freeze({id:'jackall-revoltage-2pcs-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
