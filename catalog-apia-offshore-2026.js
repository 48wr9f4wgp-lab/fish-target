(()=>{
const R='2026-08-29',U='https://www.apiajapan.com/product/rod/spec/',rows=[];
const canon=new Set(['UL','L','ML','M','MH','H','XH','XXH','XXXH']);
const add=(series,display,model,lenFt,lenM,lenRaw,pieces,weight,powerRaw,lureRaw,min,max,peMin,peMax,jan)=>rows.push({maker:'APIA',category:'rod',series,generation:'current',model,display_name:`${series} ${display||model}`,status:'unknown',specs:{length_ft:lenFt,length_m:lenM,length_raw:lenRaw,pieces,weight_g:weight,power:canon.has(powerRaw)?powerRaw:'',power_raw:powerRaw,lure_min_g:min,lure_max_g:max,jig_max_g:null,lure_weight_raw:lureRaw,line_pe_min:peMin,line_pe_max:peMax,line_weight_raw:`#${peMin}-${peMax}`,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'apia-official-research',source_url:U,retrieved_at:R,last_verified:R,license_status:'restricted'},identifiers:{jan}});
add('GRANDAGE NAVAL','SILVER SCALE S68ML','S68ML',6.667,2.03,"2.03 (6'8\")",2,110,'ML','3-25g',3,25,0.6,1.2,'4582509422485');
add('GRANDAGE NAVAL','SILVER SCALE C65ML','C65ML',6.417,1.956,"1.956 (6'5\")",null,125,'ML','7-25g',7,25,0.8,2,'4582509422492');
add('GRANDAGE NAVAL','SEAFARER S76M','S76M',7.5,2.286,"2.286 (7'6\")",2,130,'M','7-35g',7,35,0.8,2,'4582509422508');
add('GRANDAGE NAVAL','SEAFARER C64M+','C64M+',6.333,1.93,"1.93 (6'4\")",2,130,'M+','10-42g',10,42,1,3,'4582509422515');
add('GRANDAGE WORLD OCEAN','834ML','834ML',8.25,2.51,"2.51 (8'3\")",null,282,'ML','MAX 70g',null,70,2,4,'4582509428111');
add('GRANDAGE WORLD OCEAN','825M','825M',8.167,2.49,"2.49 (8'2\")",null,343,'M','MAX 100g',null,100,3,5,'4582509428128');
add('GRANDAGE WORLD OCEAN','826MH','826MH',8.167,2.49,"2.49 (8'2\")",null,377,'MH','MAX 130g',null,130,4,6,'4582509428135');
add('GRANDAGE WORLD OCEAN','838H','838H',8.25,2.51,"2.51 (8'3\")",null,389,'H','MAX 160g',null,160,5,8,'4582509428142');
add('GRANDAGE WORLD OCEAN','768H+','768H+',7.5,2.29,"2.29 (7'6\")",null,400,'H+','MAX 190g',null,190,5,8,'4582509428159');
add('GRANDAGE WORLD OCEAN','8010HH','8010HH',8,2.44,"2.44 (8'0\")",null,452,'HH','MAX 200g',null,200,6,10,'4582509428166');
add('GRANDAGE WORLD OCEAN','7812HHH','7812HHH',7.667,2.34,"2.34 (7'8\")",null,479,'HHH','MAX 220g',null,220,8,12,'4582509428173');
add('GRANDAGE WORLD OCEAN','7614MAX','7614MAX',7.5,2.29,"2.29 (7'6\")",null,487,'MAX','MAX 250g',null,250,10,14,'4582509428180');
if(rows.length!==12)throw new Error(`APIA offshore rows ${rows.length}`);const batch=Object.freeze({id:'apia-offshore-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
