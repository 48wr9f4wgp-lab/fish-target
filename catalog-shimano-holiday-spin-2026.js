(()=>{
const src='https://fish.shimano.com/ja-JP/product/rod/nage/furidashi/a075f00002lmjwxqaw.html';
const rows=[
['305HX-T',3.05,4,88,210,1.9,'10-20','15',480,60.8,'HX','251459','4969363251459'],
['335GX-T',3.35,4,95.5,245,2.0,'15-23','20',560,66,'GX','251466','4969363251466'],
['365FX-T',3.65,4,104,300,2.2,'18-25','23',640,70.7,'FX','251473','4969363251473'],
['385FX-T',3.85,4,109,340,2.2,'18-25','23',720,72.5,'FX','251480','4969363251480'],
['385EX-T',3.85,4,109,360,2.3,'20-30','25',760,74.3,'EX','251497','4969363251497'],
['405EX-T',4.05,4,114,390,2.3,'20-30','25',780,74.8,'EX','251503','4969363251503'],
['425EX-T',4.25,4,119,415,2.3,'20-30','25',800,75.8,'EX','251510','4969363251510'],
['405DX-T',4.05,4,114,410,2.4,'23-30','27',800,76.3,'DX','251527','4969363251527'],
['425DX-T',4.25,4,119,445,2.4,'23-30','27',820,77.4,'DX','251534','4969363251534'],
['405CX-T',4.05,4,114,438,2.6,'25-35','30',820,78,'CX','251541','4969363251541'],
['250JX-TS',2.50,4,74,150,1.8,'5-15','10',360,53,'JX','251336','4969363251336'],
['275JX-TS',2.75,4,80,160,1.8,'5-15','10',400,54.7,'JX','251343','4969363251343'],
['305JX-TS',3.05,5,74,200,1.8,'5-15','10',440,56.3,'JX','251350','4969363251350'],
['335JX-TS',3.35,5,80,225,1.8,'5-15','10',480,58.3,'JX','251367','4969363251367'],
['250HX-TS',2.50,4,74,155,1.9,'10-20','15',400,56.3,'HX','251374','4969363251374'],
['275HX-TS',2.75,4,80,170,1.9,'10-20','15',440,58.2,'HX','251381','4969363251381'],
['305HX-TS',3.05,5,74,207,1.9,'10-20','15',480,59.4,'HX','251398','4969363251398'],
['335HX-TS',3.35,5,80,232,1.9,'10-20','15',520,61.7,'HX','251404','4969363251404'],
['250GX-TS',2.50,4,73.5,160,2.0,'15-23','20',440,59.7,'GX','251411','4969363251411'],
['275GX-TS',2.75,4,80,175,2.0,'15-23','20',480,62.2,'GX','251428','4969363251428'],
['305GX-TS',3.05,5,74,225,2.0,'15-23','20',520,62.5,'GX','251435','4969363251435'],
['335GX-TS',3.35,5,80,250,2.0,'15-23','20',560,65.2,'GX','251442','4969363251442']
].map(([model,length_m,pieces,closed_length_cm,weight_g,tip_diameter_mm,sinker_load_raw,standard_sinker_load_raw,reel_seat_position_mm,carbon_content_pct,power_raw,product_code,jan])=>Object.freeze({
maker:'SHIMANO',category:'rod',series:'HOLIDAY SPIN',generation:'unknown',model,display_name:`HOLIDAY SPIN ${model}`,status:'current',
specs:Object.freeze({length_ft:null,length_m,weight_g,power:'',power_raw,lure_min_g:null,lure_max_g:null,jig_max_g:null,line_pe_min:null,line_pe_max:null,pieces,rod_joint_raw:'振出',closed_length_cm,tip_diameter_mm,sinker_load_raw,standard_sinker_load_raw,reel_seat_position_mm,carbon_content_pct,product_code}),
source:Object.freeze({source_type:'manufacturer_official',source_provider:'shimano-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'}),
identifiers:Object.freeze({jan})
}));
const batch=Object.freeze({id:'shimano-holiday-spin-2026',rows:Object.freeze(rows)});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
