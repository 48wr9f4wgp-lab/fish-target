(()=>{
  const rows=[
    ['BlueCurrentⅢ','53','https://yamaga-blanks.com/blc3-53/',1610,53,2,'','MAX4.5g (JH0.1~4.5g)',null,4.5,'PE 0.06~0.3 / NY・FC1~3lb',0.06,0.3,'4571584100005',''],
    ['BlueCurrentⅢ','510','https://yamaga-blanks.com/blc3-510/',1775,56,2,'','MAX4.5g (JH0.3~4.5g)',null,4.5,'PE 0.06~0.3 / NY・FC1~3lb',0.06,0.3,'4571584100012',''],
    ['BlueCurrentⅢ','63','https://yamaga-blanks.com/blc3-63/',1910,59,2,'','MAX5g (JH0.3~5g / Plug1.6~3.5g)',null,5,'PE 0.06~0.3 / NY・FC1~3lb',0.06,0.3,'4571584100029',''],
    ['BlueCurrentⅢ','69','https://yamaga-blanks.com/blc3-69/',2070,66,2,'','MAX7g (JH0.3~7g / Plug1.6~5g)',null,7,'PE 0.08~0.4 / NY・FC1~4lb',0.08,0.4,'4571584100036',''],
    ['BlueCurrentⅢ','74','https://yamaga-blanks.com/blc3-74/',2235,71,2,'','MAX10g (JH0.3~7g / Rig1~10g / Plug1.6~7.8g)',null,10,'PE 0.1~0.5 / NY・FC1~5lb',0.1,0.5,'4571584100043',''],
    ['BlueCurrentⅢ','76 Stream','https://yamaga-blanks.com/blc3-76s/',2290,81,2,'','MAX12g (Plug1.6~12g)',null,12,'PE 0.3~0.8',0.3,0.8,'4571584100050',''],
    ['BlueCurrentⅢ','78','https://yamaga-blanks.com/blc3-78/',2350,79,2,'','MAX15g (Plug 2~15g/Float 3.3~15g/Rig 1~15g)',null,15,'PE 0.3~0.8',0.3,0.8,'4571584101675',''],
    ['BlueCurrentⅢ','711','https://yamaga-blanks.com/blc3-711/',2425,81,2,'','MAX11g (JH0.5~7g / Rig2~11g)',null,11,'PE 0.2~0.6',0.2,0.6,'4571584100067',''],
    ['BlueCurrentⅢ','82','https://yamaga-blanks.com/blc3-82/',2495,83,2,'','MAX20g (JH2~20g / Float3.3~20g / Jig2~20g / Rig2~20g / Plug2~15g)',null,20,'PE 0.3~0.8',0.3,0.8,'4571584100074',''],
    ['BlueCurrentⅢ','53/B','https://yamaga-blanks.com/blc3-53b/',1610,67,2,'','MAX4.5g (JH0.5~4.5g)',null,4.5,'PE 0.3~0.5',0.3,0.5,'4571584100081',''],
    ['BlueCurrentⅢ','69/B','https://yamaga-blanks.com/blc3-69b/',2070,77,2,'','MAX7g (JH0.8~7g / Plug1.6~5g / Rig1~7g)',null,7,'PE 0.3~0.6',0.3,0.6,'4571584100098',''],
    ['BlueCurrentⅢ','78/B','https://yamaga-blanks.com/blc3-78-b/',2350,92,2,'','MAX15g (Plug 2~15g/Float 3.3~15g/Rig 2~15g)',null,15,'PE 0.4~0.8',0.4,0.8,'4571584101682',''],
    ['BlueCurrentⅢ','82/B','https://yamaga-blanks.com/blc3-82b/',2495,93,2,'','MAX20g (JH2~20g / Float3.3~20g / Jig2~20g / Rig2~20g / Plug2~15g)',null,20,'PE 0.4~0.8',0.4,0.8,'4571584100104',''],

    ['Mebius','710L','https://yamaga-blanks.com/mebius-710l/',2390,84,2,'L','1.8~3.5号(~21g)',null,null,'PE 0.3~0.6',0.3,0.6,'4571584100548','L'],
    ['Mebius','88L','https://yamaga-blanks.com/mebius-88l/',2645,93,2,'L','2.5~3.5号(~21g)',null,null,'PE 0.4~0.8',0.4,0.8,'4571584100555','L'],
    ['Mebius','85ML','https://yamaga-blanks.com/mebius-85ml/',2555,93,2,'ML','2.5~3.5号(~24g)',null,null,'PE 0.5~0.8',0.5,0.8,'4571584100562','ML'],
    ['Mebius','79M','https://yamaga-blanks.com/mebius-79m/',2365,89,2,'M','2.5~4号(~28g)',null,null,'PE 0.5~1',0.5,1,'4571584100579','M'],
    ['Mebius','86M','https://yamaga-blanks.com/mebius-86m/',2595,98,2,'M','2.5~4号(~30g)',null,null,'PE 0.5~1',0.5,1,'4571584100586','M'],
    ['Mebius','83MH','https://yamaga-blanks.com/mebius-83mh/',2515,98,2,'MH','3~4.5号(~35g)',null,null,'PE 0.6~1.2',0.6,1.2,'4571584100593','MH'],

    ['Calista','72L/TF','https://yamaga-blanks.com/calista-72l-tf/',2204,79,2,'L','Egi 2.5~3.5号',null,null,'PE 0.4~0.8',0.4,0.8,'4571584102535','L'],
    ['Calista','90LML/S','https://yamaga-blanks.com/calista-90lml-s/',2744,96,2,'','Egi 2.5~3.5号',null,null,'PE 0.4~0.8',0.4,0.8,'4571584101217','LML'],
    ['Calista','76ML/TJ','https://yamaga-blanks.com/calista-76ml-tj/',2293,87,2,'ML','Egi 2.5~3.5号',null,null,'PE 0.4~1',0.4,1,'4571584101170','ML'],
    ['Calista','82ML/AR','https://yamaga-blanks.com/calista-82ml-ar/',2496,92,2,'ML','Egi 2.5~3.5号',null,null,'PE 0.4~1',0.4,1,'4571584101194','ML'],
    ['Calista','86M/PF','https://yamaga-blanks.com/calista-86m-pf/',2573,98,2,'M','Egi 2.5~4号',null,null,'PE 0.4~1',0.4,1,'4571584101200','M'],
    ['Calista','79MMH/AG','https://yamaga-blanks.com/calista-79mmh-ag/',2380,99,2,'','Egi 3.0~4.5号',null,null,'PE 0.6~1',0.6,1,'4571584101187','MMH']
  ].map(([series,model,source_url,length_mm,weight_g,pieces,power,lure_weight_raw,lure_min_g,lure_max_g,line_weight_raw,line_pe_min,line_pe_max,jan,power_raw])=>({
    maker:'YAMAGA BLANKS',category:'rod',series,generation:'2026-current',model,display_name:`${series} ${model}`,status:'current',
    specs:{length_ft:null,length_m:length_mm/1000,length_raw:`${length_mm}mm`,pieces,pieces_raw:String(pieces),weight_g,power,power_raw,lure_min_g,lure_max_g,jig_max_g:null,lure_weight_raw,line_pe_min,line_pe_max,line_weight_raw,sinker_load_raw:''},
    source:{source_type:'manufacturer_official',source_provider:'yamaga-official-research',source_url,retrieved_at:'2026-08-28',last_verified:'2026-08-28',license_status:'restricted'},identifiers:{jan}
  }));
  const batch=Object.freeze({id:'yamaga-rods-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});
  const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
