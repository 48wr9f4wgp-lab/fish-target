(()=>{
const src='https://fish.shimano.com/ja-JP/product/rod/funehanyou/lightgame/a075f00003rgsqmqak.html';
const rows=[
['64MH200',2.00,2,103,128,1.4,'20-80','274922','4969363274922'],
['64MH230',2.30,2,118.5,134,1.4,'20-80','274939','4969363274939'],
['73M195',1.95,2,101,137,1.2,'15-60','274977','4969363274977'],
['73MH195',1.95,2,101,139,1.2,'20-80','274984','4969363274984'],
['73MH230',2.30,2,118.5,150,1.2,'20-80','274991','4969363274991'],
['73H195',1.95,2,101,144,1.2,'30-100','274946','4969363274946'],
['73H230',2.30,2,118.5,157,1.2,'30-100','274953','4969363274953'],
['73HH195',1.95,2,101,151,1.4,'40-120','274960','4969363274960'],
['82MH180',1.80,2,93.5,138,1.2,'20-80','275011','4969363275011'],
['82H180',1.80,2,93.5,141,1.2,'30-100','275004','4969363275004']
].map(([model,length_m,pieces,closed_length_cm,weight_g,tip_diameter_mm,sinker_load_raw,product_code,jan])=>Object.freeze({
maker:'SHIMANO',category:'rod',series:'LIGHTGAME BB',generation:'unknown',model,display_name:`LIGHTGAME BB ${model}`,status:'unknown',
specs:Object.freeze({length_ft:Number((length_m*3.28084).toFixed(3)),length_m,length_raw:`${length_m.toFixed(2)}m`,pieces,pieces_raw:String(pieces),closed_length_cm,weight_g,tip_diameter_mm,power:'',power_raw:'',lure_min_g:null,lure_max_g:null,jig_max_g:null,lure_weight_raw:'',line_pe_min:null,line_pe_max:null,line_weight_raw:'',sinker_load_raw}),
source:Object.freeze({source_type:'manufacturer_official',source_provider:'shimano-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'}),
identifiers:Object.freeze({product_code,jan})
}));
const batch=Object.freeze({id:'shimano-lightgame-bb-2026',rows:Object.freeze(rows)});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
