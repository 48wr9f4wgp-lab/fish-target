(()=>{
  const R='2026-08-29';
  const G=[
    ['SRAM EXR','https://www.tict-net.com/product/sram_exr.html',[
      ['EXR-57S-Sis',1.70,"5'7\" (170cm)",2,55,'0.2～1.5g',0.2,1.5,'MONO 0.8～1.6lb',null,null,'4988540223379'],
      ['EXR-60S-Sis',1.83,"6'0\" (183cm)",2,58,'0.2～2g',0.2,2,'MONO 0.8～2lb',null,null,'4988540223300'],
      ['EXR-64S-Sis',1.94,"6'4\" (194cm)",2,60,'0.2～3.5g',0.2,3.5,'MONO 0.8～2.5lb',null,null,'4988540223317'],
      ['EXR-66T-Sis',1.99,"6'6\" (199cm)",2,65,'1～4g',1,4,'MONO 0.8～3lb / PE #0.15～0.35',0.15,0.35,'4988540223324'],
      ['EXR-68S-Sis',2.03,"6'8\" (203cm)",2,62,'0.4～3.5g',0.4,3.5,'MONO 0.8～2.5lb / PE #0.1～0.3',0.1,0.3,'4988540223393'],
      ['EXR-611S-Sis',2.11,"6'11\" (211cm)",2,68,'0.4～5g',0.4,5,'MONO 0.8～2.5lb',null,null,'4988540223331'],
      ['EXR-73S-Sis',2.21,"7'3\" (221cm)",2,70,'0.8～7g',0.8,7,'MONO 0.8～3lb / PE #0.15～0.35',0.15,0.35,'4988540223348'],
      ['EXR-73T-Sis',2.22,"7'3\" (222cm)",2,70,'1～8g',1,8,'PE #0.15～0.4',0.15,0.4,'4988540223386'],
      ['EXR-77S-Sis',2.32,"7'7\" (232cm)",2,75,'1～11g',1,11,'PE #0.15～0.4',0.15,0.4,'4988540223355'],
      ['EXR-82T-Sis',2.49,"8'2\" (249cm)",2,90,'1.5～16g',1.5,16,'PE #0.25～0.6',0.25,0.6,'4988540223362']
    ]],
    ['SRAM UTR-61 MasterPiece','https://tict-net.com/product/sram_utr_t2.html',[
      ['UTR-61FS-T2',1.86,"6'1\" (186cm)",1,47,'0.1～2g',0.1,2,'MONO 0.8～2.5lb',null,null,'4988540178075'],
      ['UTR-61HS-T2',1.86,"6'1\" (186cm)",1,48.5,'0.4～3.5g',0.4,3.5,'MONO 0.8～3lb / PE #0.1～0.3',0.1,0.3,'4988540178082']
    ]],
    ['ICE CUBE','https://tict-net.com/product/icecube.html',[
      ['IC-69F-Sis',2.07,"6'9\" (207cm)",2,63,'0.1～3.5g',0.1,3.5,'MONO 0.8～2.5lb',null,null,'4988540178280'],
      ['IC-69P-Sis',2.07,"6'9\" (207cm)",2,67,'0.1～7.0g',0.1,7,'PE #0.1～0.35',0.1,0.35,'4988540178297'],
      ['IC-74TFL-Sis',2.23,"7'4\" (223cm)",2,83.5,'1.5～15g',1.5,15,'PE #0.3～0.6',0.3,0.6,'4988540223546'],
      ['IC-74FS-Sis',2.24,"7'4\" (224cm)",2,68,'0.1～4g',0.1,4,'MONO 0.8～2.5lb / PE #0.1～0.35',0.1,0.35,'4988540178266'],
      ['IC-74PT-Sis',2.24,"7'4\" (224cm)",2,70,'0.8～9g',0.8,9,'MONO 1～3lb / PE #0.1～0.4',0.1,0.4,'4988540178273'],
      ['IC-710TPS',2.44,"7'10\" (244cm)",2,82,'0.8～11g',0.8,11,'PE #0.1～0.6',0.1,0.6,'4988540223539'],
      ['IC-83TT',2.51,"8'3\" (251cm)",2,84,'0.8～12g',0.8,12,'PE #0.1～0.4',0.1,0.4,'4988540223522'],
      ['IC-86.5TB-Sis',2.60,"8'6.5\" (260cm)",2,113,'0.4～18g',0.4,18,'PE #0.3～0.8',0.3,0.8,'4988540223508'],
      ['IC-90TG-Sis',2.76,"9'0\" (276cm)",2,115,'0.8～21g',0.8,21,'PE #0.2～0.6',0.2,0.6,'4988540223515']
    ]]
  ];
  const rows=[];
  for(const [series,url,list] of G)for(const [model,length_m,length_raw,pieces,weight_g,lure_weight_raw,lure_min_g,lure_max_g,line_weight_raw,line_pe_min,line_pe_max,jan] of list)rows.push({
    maker:'TICT',category:'rod',series,generation:'current',model,display_name:`${series} ${model}`,status:'current',
    specs:{length_ft:null,length_m,length_raw,pieces,pieces_raw:String(pieces),weight_g,power:'',power_raw:'',lure_min_g,lure_max_g,jig_max_g:null,lure_weight_raw,line_pe_min,line_pe_max,line_weight_raw,sinker_load_raw:''},
    source:{source_type:'manufacturer_official',source_provider:'tict-official-research',source_url:url,retrieved_at:R,last_verified:R,license_status:'restricted'},identifiers:{jan}
  });
  const batch=Object.freeze({id:'tict-rods-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});
  const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
