(()=>{
const src='https://fish.shimano.com/ja-JP/product/rod/isobouhatei/other/a075f00002ltl7gqaq.html';
const rows=[
['1.5-400',4.03,5,91,135,1.2,'1-3','1-3','251558','4969363251558'],
['1.5-450',4.50,5,103,150,1.2,'1-3','1-3','251565','4969363251565'],
['1.5-530',5.38,6,103,205,1.2,'1-4','1.5-4','251572','4969363251572'],
['2-300',3.00,4,85,110,1.7,'10-15','1.5-4','251589','4969363251589'],
['2-350',3.50,4,101.5,120,1.7,'10-15','1.5-4','251596','4969363251596'],
['2-400',4.05,5,91,140,1.4,'1-4','1.5-4','251602','4969363251602'],
['2-450',4.51,5,102,160,1.4,'1-4','1.5-4','251619','4969363251619'],
['2-530',5.38,6,102.5,220,1.4,'2-5','2-5','251626','4969363251626'],
['3-300',3.00,4,85,115,1.7,'10-15','2-5','251633','4969363251633'],
['3-350',3.50,4,101.5,135,1.7,'10-15','2-5','251640','4969363251640'],
['3-400',4.04,5,91,170,1.5,'5-8','3-7','251657','4969363251657'],
['3-450',4.51,5,102,200,1.5,'5-8','3-7','251664','4969363251664'],
['3-530',5.37,6,102,290,1.5,'5-8','3-7','251671','4969363251671'],
['3-400PTS',4.00,5,94,200,1.6,'5-8','3-7','251688','4969363251688'],
['3-450PTS',4.45,5,103,205,1.5,'5-8','3-7','251695','4969363251695'],
['3-530PTS',5.30,6,103,280,1.5,'5-8','3-7','251701','4969363251701'],
['4-400PTS',4.03,5,95.5,265,1.6,'8-12','4-10','251718','4969363251718'],
['4-450PTS',4.45,5,104,270,1.6,'8-12','4-10','251725','4969363251725'],
['4-530PTS',5.30,6,104,345,1.6,'8-12','4-10','251732','4969363251732'],
['5-450PTS',4.45,5,104,285,1.6,'10-25','5-12','251756','4969363251756'],
['5-530PTS',5.30,6,103.5,410,1.9,'10-25','5-12','251763','4969363251763'],
['1.5-450A',4.50,5,103,150,1.2,'1-3','1-3','251770','4969363251770'],
['1.5-530A',5.38,6,103,205,1.2,'1-4','1.5-4','251787','4969363251787'],
['2-450A',4.51,5,102,160,1.4,'1-4','1.5-4','251794','4969363251794'],
['2-530A',5.38,6,102.5,220,1.4,'2-5','2-5','251800','4969363251800']
].map(([model,length_m,pieces,closed_length_cm,weight_g,tip_diameter_mm,sinker_load_raw,leader_line_raw,product_code,jan])=>Object.freeze({maker:'SHIMANO',category:'rod',series:'HOLIDAY ISO',generation:'unknown',model,display_name:`HOLIDAY ISO ${model}`,status:'current',specs:Object.freeze({length_ft:Number((length_m*3.28084).toFixed(2)),length_m,weight_g,power:'',lure_min_g:null,lure_max_g:null,jig_max_g:null,line_pe_min:null,line_pe_max:null,pieces,rod_joint_raw:'振出',closed_length_cm,tip_diameter_mm,sinker_load_raw,leader_line_raw,product_code}),source:Object.freeze({source_type:'manufacturer_official',source_provider:'shimano-official-research',source_url:src,retrieved_at:'2026-08-29',last_verified:'2026-08-29',license_status:'restricted'}),identifiers:Object.freeze({jan})}));
const batch=Object.freeze({id:'shimano-holiday-iso-2026',rows:Object.freeze(rows)});const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
