(()=>{
const src='https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/';
const a=[
['RVⅡ-C67L-FM',6.583,2.01,'6\'7" (2.01m)',2,'2pcs (仕舞寸法174.5cm)',102,'','LIGHT FAST MOVING',3.5,14,'1/8-1/2oz(3.5-14g)',null,'8-14lb'],
['RVⅡ-C63M',6.25,1.91,'6\'3" (1.91m)',1,'1pc',109,'M','MEDIUM',5,21,'3/16-3/4oz(5-21g)',null,'8-16lb'],
['RVⅡ-C69L+BF',6.75,2.06,'6\'9"（2.06m）',2,'2pcs (仕舞寸法179.5cm)',108.6,'','LIGHT PLUS',2.7,7,'3/32-1/4oz (2.7-7.0g)',null,'5-12lb'],
['RVⅡ-C62L-GC',6.167,1.88,'6\'2"（1.88m）',1,'1pc',102,'L','LIGHT',5,14,'5-14g',null,'8-14'],
['RVⅡ-C66ML-GC',6.5,1.98,'6\'6"（1.98m）',1,'1pc',110,'ML','MEDIUM LIGHT',7,18,'7-18g',null,'10-16'],
['RVⅡ-C64ML-ST',6.333,1.93,'6\'4"(1.93m)',1,'1pc',95.8,'ML','MEDIUM LIGHT',3.5,14,'1/8-1/2oz(3.5-14g)',null,'5-12lb'],
['RVⅡ-C64M+PBF',6.333,1.93,'6\'4"(1.93m)',2,'2pcs (仕舞寸法167cm)',112,'','MEDIUM PLUS / PE BAIT FINESSE',3.5,18,'3.5-18g',3.0,'PE MAX #3.0'],
['RVⅡ-C610M',6.833,2.08,'6\'10" (2.08m)',2,'2pcs (仕舞寸法181.0cm)',114.3,'M','MEDIUM',7,21,'1/4-3/4oz (7.0-21g)',null,'8-16lb'],
['RVⅡ-C66M+',6.5,1.98,'6\'6"(1.98m)',1,'1pc',104.3,'','MEDIUM PLUS',5,21,'3/16-3/4oz (5.0-21g)',null,'8-16lb'],
['RVⅡ-C68MH',6.667,2.03,'6\'8"(2.03m)',2,'2pcs (仕舞寸法176cm)',115.5,'MH','MEDIUM HEAVY',7,28,'1/4-1oz (7.0-28g)',null,'10-20lb'],
['RVⅡ-C67MH+',6.583,2.01,'6\'7"(2.01m)',2,'2pcs (仕舞寸法173.5cm)',121.4,'','MEDIUM HEAVY PLUS',10.5,56,'3/8-2oz (10.5-56g)',5,'12-24lb / PE MAX#5'],
['RVⅡ-C70MH-R',7,2.13,'7\'0"(2.13m)',2,'2pcs (仕舞寸法185.0cm)',123,'MH','MEDIUM HEAVY',null,null,'1/4-1oz',null,'10-20lb'],
['RVⅡ-C70H+R',7,2.13,'7\'0"(2.13m)',2,'2pcs (仕舞寸法185.0cm)',124,'','HEAVY PLUS',null,null,'3/8-1•1/2oz',5,'14-24lb PE MAX #5.0'],
['RVⅡ-C71H-ST',7.083,2.16,'7\'1"(2.16m)',2,'2pcs (仕舞寸法187.5cm)',123.3,'H','HEAVY',7,42,'1/4-1_1/2oz (7.0-42g)',null,'12-24lb'],
['RVⅡ-C73H',7.25,2.21,'7\'3"(2.21m)',2,'2pcs (仕舞寸法191.7cm)',120.8,'H','HEAVY',10.5,42,'3/8-1_1/2oz(10.5-42g)',5,'12-24lb / PE MAX #5'],
['RVⅡ-C711H',7.917,2.41,'7\'11"(2.41m)',2,'2pcs (仕舞寸法208.5cm)',136.6,'H','HEAVY',10.5,70,'3/8-2_1/2oz(10.5-70g)',null,'16-30lb'],
['RVⅡ-S61UL-ST',6.083,1.85,'6\'1" (1.85m)',1,'1pc',81,'UL','ULTRA LIGHT',0.9,5,'1/32-3/16oz(0.9-5g)',null,'2-5lb'],
['RVⅡ-S510SUL-ST',5.833,1.78,'5\'10"(1.78m)',1,'1pc',79.2,'','SUPER ULTRA LIGHT',0.45,5,'1/64-3/16oz(0.45-5.0g)',null,'2-4lb'],
['RVⅡ-S56XUL/L-ST',5.5,1.68,'5\'6"(1.68m)',1,'1pc',75,'','EXTRA ULTRA LIGHT',null,null,'1/64-3/16oz',0.6,'1-4lb PE MAX #0.6'],
['RVⅡ-S60SUL',6,1.83,'6\'0"(1.83m)',1,'1pc',81.4,'','SUPER ULTRA LIGHT',0.45,5,'1/64-3/16oz(0.45-5.0g)',0.8,'2-4lb / PE MAX #0.8'],
['RVⅡ-S65UL',6.417,1.96,'6\'5"(1.96m)',1,'1pc',85,'UL','ULTRA LIGHT',0.9,7,'1/32-1/4oz(0.9-7.0g)',null,'2-4lb'],
['RVⅡ-S61L-ST',6.083,1.85,'6\'1"(1.85m)',1,'1pc',83,'L','LIGHT',2.7,7,'3/32-1/4oz(2.7-7.0g)',null,'2.5-6lb'],
['RVⅡ-S69UL+',6.75,2.06,'6\'9"(2.06m)',2,'2pcs (仕舞寸法180.0cm)',85.7,'','ULTRA LIGHT PLUS',0.9,9,'1/32-5/16oz(0.9-9.0g)',0.8,'3-5lb / PE MAX #0.8'],
['RVⅡ-S68MH+',6.667,2.03,'6\'8"(2.03m)',2,'2pcs (仕舞寸法177.5cm)',103.5,'','MEDIUM HEAVY PLUS',3.5,18,'1/8-5/8oz(3.5-18g)',2.5,'6-14lb / PE MAX #2.5'],
['RVⅡ-S65L',6.417,1.96,'6\'5"（1.96m）',1,'1pc',87,'L','LIGHT',null,null,'0.9-7',1.0,'2.5-6 PE MAX1.0'],
['RVⅡ-S67ML',null,2.01,'2.01m',2,'2pcs (仕舞寸法175cm)',97,'ML','MEDIUM LIGHT',null,null,'1.8-14',1.5,'2.5-6 PE MAX1.5'],
['RVⅡ-S78ML+',7.667,2.34,'7\'8"(2.34m)',2,'2pcs (仕舞寸法206.5cm)',107.8,'','MEDIUM LIGHT PLUS',3.5,18,'1/8-5/8oz(3.5-18g)',2,'4-8lb / PE MAX #2']
];
const rows=a.map(([model,length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,lure_weight_raw,line_pe_max,line_weight_raw])=>({maker:'JACKALL',category:'rod',series:'REVOLTAGE',generation:'current',model,display_name:'REVOLTAGE '+model,status:'unknown',specs:{length_ft,length_m,length_raw,pieces,pieces_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,jig_max_g:null,lure_weight_raw,line_weight_raw,line_pe_min:null,line_pe_max,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'jackall-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:{}}));
const batch=Object.freeze({id:'jackall-revoltage-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
