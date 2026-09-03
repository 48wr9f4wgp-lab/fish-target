(()=>{
const src='https://www.jackall.co.jp/saltwater/shore-casting/products/rod/casting/26-brs/';
const a=[
['BRS-S96M-SJ',9.5,2.90,'9\'6"/2.90m','M','MEDIUM',null,60,'JIG MAX60g',2.5,'PE MAX #2.5','4525807337266'],
['BRS-S100MH-SJ',10.0,3.05,'10\'0"/3.05m','MH','MEDIUM HEAVY',null,80,'JIG MAX80g',3.0,'PE MAX #3.0','4525807337273'],
['BRS-S98L/M-SJ',9.667,2.95,'9\'8"/2.95m','L','LIGHT',null,50,'PLUG MAX40g / JIG MAX50g',2.5,'PE MAX #2.5','4525807337280'],
['BRS-S100ML/MH-SJ',10.0,3.05,'10\'0"/3.05m','','MEDIUM LIGHT / MEDIUM HEAVY',null,70,'PLUG MAX50g / JIG MAX70g',3.0,'PE MAX #3.0','4525807337297'],
['BRS-S106M-SURF',10.5,3.20,'10\'6"/3.20m','M','MEDIUM',40,null,'LURE MAX40g',2.0,'PE MAX #2.0','4525807337303'],
['BRS-S84ML',8.333,2.54,'8\'4"/2.54m','ML','MEDIUM LIGHT',25,null,'LURE MAX25g / EGI MAX #3.5',1.2,'PE MAX #1.2','4525807337310'],
['BRS-S86M',8.5,2.59,'8\'6"/2.59m','M','MEDIUM',30,null,'LURE MAX30g / EGI MAX #4.0',1.2,'PE MAX #1.2','4525807337327'],
['BRS-S56SUL-LG',5.5,1.68,'5\'6"/1.68m','','SUPER ULTRA LIGHT',null,null,'RIG MAX 3g',0.4,'MONO MAX 3lb / PE MAX #0.4','4525807337334'],
['BRS-S64UL-LG',6.333,1.93,'6\'4"/1.93m','UL','ULTRA LIGHT',null,null,'RIG MAX 5g',0.6,'MONO MAX 4lb / PE MAX #0.6','4525807337341'],
['BRS-S68L-LG',6.667,2.03,'6\'8"/2.03m','L','LIGHT',10,null,'LURE MAX 10g',0.8,'MONO MAX 6lb / PE MAX #0.8','4525807337358'],
['BRS-S74ML-LG',7.333,2.24,'7\'4"/2.24m','ML','MEDIUM LIGHT',14,null,'LURE MAX 14g',1.0,'MONO MAX 8lb / PE MAX #1.0','4525807337365']
];
const rows=a.map(([model,length_ft,length_m,length_raw,power,power_raw,lure_max_g,jig_max_g,lure_weight_raw,line_pe_max,line_weight_raw,jan])=>({maker:'JACKALL',category:'rod',series:'26 BRS',generation:'current',model,display_name:'26 BRS '+model,status:'unknown',specs:{length_ft,length_m,length_raw,pieces:2,pieces_raw:'2pcs',weight_g:null,power,power_raw,lure_min_g:null,lure_max_g,jig_max_g,lure_weight_raw,line_weight_raw,line_pe_min:null,line_pe_max,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'jackall-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:{jan}}));
const batch=Object.freeze({id:'jackall-brs-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
