(()=>{
const src='https://www.smith.jp/product/trout/multiyouse/multiyouse.html';
const a=[
['TRMK-394UL',3.75,'3\'9"',73,'UL','UL.Light',1,6,'1～5lb.',null,null],
['TRMK-423UL',4.1667,'4\'2"',74,'UL','UL.Light',1,6,'1～5lb.',null,null],
['TRMK-483UL',4.6667,'4\'8"',83,'UL','UL.Light',1,7,'1～6lb.',null,null],
['TRMK-504UL',5,'5\'',70,'UL','UL.Light',1,5,'1～4lb.',null,null],
['TRMK-564UML',5.5,'5\'6"',77,'','UM.Light',1,5,'1～4lb.',null,null],
['TRMK-604SL',6,'6\'',83,'','Super Light',2,7,'1～6lb.',null,null],
['TRMK-705L',7,'7\'',117,'L','Light',3,10,'4～10lb.',null,null],
['TRMK-765ML',7.5,'7\'6"',130,'ML','Medium Light',3,13,'4～12lb.',null,null],
['TRMK-805M',8,'8\'',147,'M','Medium',5,18,'6～16lb.',null,null],
['TRMK-C394UL',3.75,'3\'9"',82,'UL','UL.Light',2,7,'2～6lb. (0.3～1.0pe)',0.3,1.0],
['TRMK-C423L',4.1667,'4\'2"',87,'L','Light',2,8,'3～6lb. (0.4～1.0pe)',0.4,1.0],
['TRMK-C463L',4.5,'4\'6"',95,'L','Light',2,10,'3～6lb. (0.4～1.0pe)',0.4,1.0],
['TRMK-C564ML',5.5,'5\'6"',90,'ML','Medium Light',3,14,'3～8lb. (0.4～1.0pe)',0.4,1.0]
];
const rows=a.map(([model,length_ft,length_raw,weight_g,power,power_raw,lure_min_g,lure_max_g,line_weight_raw,line_pe_min,line_pe_max])=>({maker:'SMITH',category:'rod',series:"TROUTIN' SPIN MULTIYOUSE",generation:'current',model,display_name:"TROUTIN' SPIN MULTIYOUSE "+model,status:'unknown',specs:{length_ft,length_m:null,length_raw,pieces:null,pieces_raw:'',weight_g,power,power_raw,lure_min_g,lure_max_g,jig_max_g:null,lure_weight_raw:`${lure_min_g}～${lure_max_g}g`,line_weight_raw,line_pe_min,line_pe_max,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'smith-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'},identifiers:{}}));
const batch=Object.freeze({id:'smith-multiyouse-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
