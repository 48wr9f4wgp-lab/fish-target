(()=>{
  const src=url=>Object.freeze({source_type:'manufacturer_official',source_provider:'majorcraft-official-research',source_url:url,retrieved_at:'2026-08-28',last_verified:'2026-08-28',license_status:'restricted'});
  const jan=s=>'4573236'+String(s).padStart(6,'0');
  const row=(series,generation,model,length,pieces,weight,power,lureMin,lureMax,peMin,peMax,suffix,url)=>Object.freeze({maker:'MAJOR CRAFT',category:'rod',series,generation,model,display_name:`${series} ${model}`,status:'current',specs:Object.freeze({length_ft:length,length_m:null,pieces,weight_g:weight,power,lure_min_g:lureMin,lure_max_g:lureMax,jig_max_g:null,line_pe_min:peMin,line_pe_max:peMax}),source:src(url),identifiers:Object.freeze({jan:jan(suffix)})});
  const AJ='https://www.majorcraft.co.jp/rod/ad5/ajing-3/';
  const FC='https://www.majorcraft.co.jp/rod/ad5/float-caro/';
  const XR5='https://www.majorcraft.co.jp/rod/xr5/shore-jigging/';
  const XR5CAT='https://www.majorcraft.co.jp/catalog/2024-EN/44/';
  const LSJ='https://www.majorcraft.co.jp/rod/xr5/lsj/';
  const XR7='https://www.majorcraft.co.jp/rod/xr7/xr7sj/';
  const SPAJ='https://www.majorcraft.co.jp/rod/new-sp-ajing/ajinggame/';
  const TIP='https://www.majorcraft.co.jp/rod/new-sp-tiprun/tiprun/';
  const rows=Object.freeze([
    row('AJIDO 5G','current-2026','AD5-S582UL/AJI',5.8,2,50,'UL',0.2,2.5,0.1,0.4,272887,AJ),
    row('AJIDO 5G','current-2026','AD5-S622UL/AJI',6.2,2,54,'UL',0.2,2.5,0.1,0.4,272894,AJ),
    row('AJIDO 5G','current-2026','AD5-S682UL/AJI',6.8,2,57,'UL',0.2,2.5,0.1,0.4,272900,AJ),
    row('AJIDO 5G','current-2026','AD5-S502L/AJI',5.0,2,48,'L',0.2,3,0.1,0.4,272917,AJ),
    row('AJIDO 5G','current-2026','AD5-S582L/AJI',5.8,2,50,'L',0.2,3,0.1,0.4,272924,AJ),
    row('AJIDO 5G','current-2026','AD5-S622L/AJI',6.2,2,52,'L',0.2,3,0.1,0.4,272931,AJ),
    row('AJIDO 5G','current-2026','AD5-S682L/AJI',6.8,2,54,'L',0.2,3,0.1,0.4,272955,AJ),
    row('AJIDO 5G','current-2026','AD5-S622M/AJI',6.2,2,54,'M',0.6,5,0.1,0.5,272948,AJ),
    row('AJIDO 5G','current-2026','AD5-S682M/AJI',6.8,2,56,'M',0.6,5,0.1,0.5,272962,AJ),
    row('AJIDO 5G','current-2026','AD5-S722H/AJI',7.2,2,67,'H',1,15,0.1,0.6,272979,AJ),
    row('AJIDO 5G','current-2026','AD5-S832FC/AJI',8.3,2,78,'',3,24,0.3,0.8,272986,FC),
    row('CROSSRIDE 5G','current-2026','XR5-962M',9.6,2,200,'M',20,60,1,2.5,272788,XR5),
    row('CROSSRIDE 5G','current-2026','XR5-1002M',10,2,206,'M',20,60,1,2.5,272795,XR5),
    row('CROSSRIDE 5G','current-2026','XR5-962MH',9.6,2,204,'MH',40,80,1,3,272801,XR5CAT),
    row('CROSSRIDE 5G','current-2026','XR5-1002MH',10,2,214,'MH',40,80,1,3,272818,XR5),
    row('CROSSRIDE 5G','current-2026','XR5-1002H',10,2,224,'H',60,100,1.5,3.5,272825,XR5),
    row('CROSSRIDE 5G LSJ','current-2026','XR5-942ML/LSJ',9.4,2,127,'ML',15,40,0.6,1.5,272757,LSJ),
    row('CROSSRIDE 5G LSJ','current-2026','XR5-962M/LSJ',9.6,2,151,'M',15,50,0.8,2,272764,LSJ),
    row('CROSSRIDE 5G LSJ','current-2026','XR5-1002M/LSJ',10,2,155,'M',15,50,0.8,2,272771,LSJ),
    row('CROSSRIDE 7G','2026','XR7-1002M',10,2,215,'M',null,80,1,3,278599,XR7),
    row('CROSSRIDE 7G','2026','XR7-962MH',9.6,2,225,'MH',null,100,2,4,278605,XR7),
    row('CROSSRIDE 7G','2026','XR7-1002MH',10,2,228,'MH',null,100,2,4,278612,XR7),
    row('CROSSRIDE 7G','2026','XR7-1002H',10,2,247,'H',null,120,2.5,5,278629,XR7),
    row('NEW SOLPARA AJING','2024','SPAJ-S582UL',5.8,2,61,'UL',0.2,2.5,0.1,0.4,269009,SPAJ),
    row('NEW SOLPARA AJING','2024','SPAJ-S622UL',6.2,2,65,'UL',0.2,2.5,0.1,0.4,269016,SPAJ),
    row('NEW SOLPARA AJING','2024','SPAJ-S582L',5.8,2,64,'L',0.2,3,0.1,0.4,269023,SPAJ),
    row('NEW SOLPARA AJING','2024','SPAJ-S622L',6.2,2,67,'L',0.2,3,0.1,0.4,269030,SPAJ),
    row('NEW SOLPARA AJING','2024','SPAJ-S682L',6.8,2,72,'L',0.2,3,0.1,0.4,269047,SPAJ),
    row('NEW SOLPARA AJING','2024','SPAJ-S622M',6.2,2,74,'M',0.6,5,0.1,0.5,269054,SPAJ),
    row('NEW SOLPARA AJING','2024','SPAJ-S682M',6.8,2,78,'M',0.6,5,0.1,0.5,269061,SPAJ),
    row('NEW SOLPARA TIPRUN','2025-2026','SPJTE-S632L',6.3,2,90,'L',null,55,0.4,1,269139,TIP),
    row('NEW SOLPARA TIPRUN','2025-2026','SPJTE-S632ML',6.3,2,92,'ML',null,70,0.6,1.2,269115,TIP),
    row('NEW SOLPARA TIPRUN','2025-2026','SPJTE-S632M',6.3,2,99,'M',null,90,0.6,1.2,269122,TIP)
  ]);
  const batch=Object.freeze({id:'majorcraft-core-current-2026',rows});
  const registry=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);
  if(registry.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);
  registry.push(batch);
})();
