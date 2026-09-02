(()=>{
  const R='2026-08-29';
  const ft=(s)=>{const m=String(s).match(/(\d+)'\s*(\d+)?/);return m?Number((Number(m[1])+(Number(m[2]||0)/12)).toFixed(3)):null};
  const rows=[];
  const add=(series,url,model,lengthRaw,lureRaw,peMin,peMax,{min=null,max=null,status='unknown',jan=null,power='',powerRaw='',pieces=null,weight=null}={})=>rows.push({
    maker:'ZENAQ',category:'rod',series,generation:'current',model,display_name:`${series} ${model}`,status,
    specs:{length_ft:ft(lengthRaw),length_m:null,length_raw:lengthRaw,pieces,weight_g:weight,power,power_raw:powerRaw,lure_min_g:min,lure_max_g:max,jig_max_g:null,lure_weight_raw:lureRaw,line_pe_min:peMin,line_pe_max:peMax,line_weight_raw:peMin==null&&peMax==null?'':`PE ${peMin??''}${peMin!=null&&peMax!=null?'~':''}${peMax??''}`,sinker_load_raw:''},
    source:{source_type:'manufacturer_official',source_provider:'zenaq-official-research',source_url:url,retrieved_at:R,last_verified:R,license_status:'restricted'},
    identifiers:jan?{jan}:{}
  });

  const M='https://zenaq.com/product/muthos/';
  add('MUTHOS',M,'Sonio 93M',"9'3\"",'Jig 10~100g / Plug 10~70g',1,3);
  add('MUTHOS',M,'Sonio 100M',"10'0\"",'Jig 10~100g / Plug 10~70g',1,3);
  add('MUTHOS',M,'Accura 95H',"9'5\"",'Jig 30~230g / Plug 30~180g',2,6);
  add('MUTHOS',M,'Accura 100H',"10'0\"",'Jig 30~200g / Plug 30~120g',2,5);
  add('MUTHOS',M,'Accura 100HH',"10'0\"",'Jig 60~230g / Plug 40~150g',3,6);
  add('MUTHOS',M,'Accura 100HHH',"10'0\"",'Jig 80~250g / Plug 60~200g',4,10);
  add('MUTHOS',M,'Accura 100H Bait model',"10'0\"",'Jig 30~200g / Plug 30~120g',2,5);

  const T='https://zenaq.com/product/tobizo/';
  add('Tobizo',T,'TC80-50G',"8'0\"",'MAX80g (Best30~70g)',3,4,{max:80});
  add('Tobizo',T,'TC80-80G',"8'0\"",'MAX110g (Best50~90g)',3,6,{max:110});
  add('Tobizo',T,'TC84-100G',"8'4\"",'MAX150g (Best60~110g)',4,8,{max:150});
  add('Tobizo',T,'TC86-110G',"8'6\"",'MAX160g (Best70~120g)',4,8,{max:160});
  add('Tobizo',T,'TC83-150G',"8'3\"",'MAX180g (Best90~160g)',5,8,{max:180});
  add('Tobizo',T,'TC80-200G',"8'0\"",'MAX230g (Best120~210g)',6,10,{max:230});

  const F='https://zenaq.com/product/ikari_dbl/';
  add('FOKEETO IKARI - DBL',F,'FS60-J7',"6'0\"",'Short jig ~280g / Long jig ~350g',2,4);
  add('FOKEETO IKARI - DBL',F,'FB56-J10',"5'6\"",'150~400g',4,8,{min:150,max:400});
  add('FOKEETO IKARI - DBL',F,'FS56-J10',"5'6\"",'150~400g',4,8,{min:150,max:400});
  add('FOKEETO IKARI - DBL',F,'FB53-J15',"5'3\"",'180~500g',8,12,{min:180,max:500});
  add('FOKEETO IKARI - DBL',F,'FS53-J15',"5'3\"",'180~500g',8,12,{min:180,max:500});

  const SI='https://zenaq.com/product/sinpaa/';
  add('SINPAA',SI,'SC81-80G HIRAMASA',"8'1\"",'40~100g',5,6,{min:40,max:100});
  add('SINPAA',SI,'SC83-95G HIRAMASA',"8'3\"",'60~140g',6,8,{min:60,max:140});

  const SN='https://zenaq.com/product/snipe/';
  add('SNIPE',SN,'S76X',"7'6\"",'4~21g',0.6,1.5,{min:4,max:21});
  add('SNIPE',SN,'S78XX',"7'8\"",'6~35g',0.8,2,{min:6,max:35,status:'discontinued'});
  add('SNIPE',SN,'S86XX Longcast',"8'6\"",'8~40g',0.8,2,{min:8,max:40,status:'discontinued'});

  const PA='https://zenaq.com/product/plaisir_answer/';
  for(const [model,len,lo,hi,pemin,pemax] of [
    ['PA 75 Power Arm',"7'5\"",7,25,0.6,2],['PA 89 Technical Surfer',"8'9\"",10,28,0.6,2],['PA 90 Jaw Breaker',"9'0\"",10,50,0.8,2],['PA 93 Cast Master',"9'3\"",10,25,0.6,2],['PA 99 Distance Cracker',"9'9\"",12,45,0.8,2],['PA 108 Border Capture',"10'8\"",12,35,0.6,2]
  ]) add('PLAISIR ANSWER',PA,model,len,`${lo}~${hi}g`,pemin,pemax,{min:lo,max:hi,status:'discontinued'});

  const SOP='https://zenaq.com/product/plaisir_answer_sopmod/';
  add('PLAISIR ANSWER SOPMOD',SOP,'PA-B67 SOPMOD EBR',"6'7\"",'40~300g',4,10,{min:40,max:300});
  add('PLAISIR ANSWER SOPMOD',SOP,'PA-B80 SOPMOD',"8'0\"",'15~100g',3,5,{min:15,max:100});

  const BA='https://zenaq.com/product/spirado_blackart/';
  for(const [model,len,lure,line] of [
    ['B65 Finesse',"6'5\"",'1/16~3/8oz','5~12lb'],['B2.5-66 First Pilot',"6'6\"",'1/4~3/4oz','8~16lb'],['B67 Frog',"6'7\"",'1/4~1oz','10~25lb (PE MAX70)'],['B3-70',"7'0\"",'1/4~1oz','10~18lb'],['B3.5-68 Bottom Sensor',"6'8\"",'1/4~1oz','10~20lb'],['B4-69',"6'9\"",'3/8~1 1/2oz','12~25lb'],['B4.5-72 Biwa Spec',"7'2\"",'3/8~2oz','12~25lb (PE MAX70)'],['B5-74',"7'4\"",'1/2~3oz','14~30lb'],['B79 Cover PE',"7'9\"",'1/2~3oz','14~35lb (PE MAX80)'],['S63 Fort',"6'3\"",'1/64~1/8oz','2~5lb'],['S65 Swimmin’ Shake',"6'5\"",'1/64~3/16oz','2~8lb'],['S0-62',"6'2\"",'1/32~1/4oz','2~8lb'],['S0-70 Wide Shooter',"7'0\"",'1/32~5/16oz','2~8lb'],['S66 Skippin’ Frog',"6'6\"",'1/16~3/8oz','3~12lb (PE MAX30)'],['S2-68 Dragger',"6'8\"",'1/8~1/2oz','4~12lb (PE MAX25)']
  ]) add('Spirado BLACKART',BA,model,len,lure,null,null,{powerRaw:'',status:'unknown'}),rows[rows.length-1].specs.line_weight_raw=line;

  const GL='https://zenaq.com/product/glanz/';
  for(const [model,len,raw,pemin,pemax] of [
    ['GB73-X5',"7'3\"",'Mono 30~150g / PE 30~200g',4,8],['GB67-X10',"6'7\"",'PE 50~300g',4,8],['GB84-X10',"8'4\"",'PE 50~300g',4,8],['GB80-X20',"8'0\"",'Mono 50~400g / PE 50~500g',6,10],['GB78-X78',"7'8\"",'Mono 200~1500g / PE 200~2000g',8,15]
  ]) add('GLANZ',GL,model,len,raw,pemin,pemax);

  const IN='https://zenaq.com/en/product/inqlude/';
  add('INQLUDE',IN,'IS76-M2 - TECHNICAL SNIPE -',"7'6\"",'4~21g',0.4,1,{min:4,max:21});
  add('INQLUDE',IN,'IS83-M3 - SQUID SQUAD -',"8'3\"",'Egi 2.5~3.5 / Lure 6~24g',0.4,1.5,{min:6,max:24});
  add('INQLUDE',IN,'IS82-M4 - SQUID IMPACT -',"8'2\"",'Egi 3.0~4.0 / Lure 10~28g',0.6,2,{min:10,max:28});
  add('INQLUDE',IN,'IS89-M5 - MASTER HAND -',"8'9\"",'5~35g',0.6,2,{min:5,max:35});
  add('INQLUDE',IN,'IS86-M6 - RANGE SNIPE -',"8'6\"",'8~40g',0.6,2,{min:8,max:40});
  add('INQLUDE',IN,'IS90-M7 - JAW BREAKER -',"9'0\"",'10~50g',0.8,2.5,{min:10,max:50});
  add('INQLUDE',IN,'IS88-M9 - MAGNUM BULLET -',"8'8\"",'15~80g',1,3,{min:15,max:80});

  const EX='https://zenaq.com/product/expedition/';
  for(const x of [
    ['EP67B',"6'7\"",'13~70g',1.5,3,13,70,'discontinued','4514459930017',3,190],
    ['EP67S',"6'7\"",'13~70g',1.5,3,13,70,'discontinued','4514459930024',3,180],
    ['EP73B',"7'3\"",'20~90g',2,4,20,90,'discontinued','4514459930055',3,197],
    ['EP73S',"7'3\"",'20~90g',2,4,20,90,'unknown','4514459930062',3,193],
    ['EP83S',"8'3\"",'40~120g',3,6,40,120,'discontinued','4514459930048',3,376],
    ['EP83-6 Trevally',"8'3\"",'MAX180g (Best90~150g)',5,8,null,180,'unknown','4514459930079',3,423],
    ['EP55-14B Jigging',"5'5\"",'MAX450g (Best200~350g)',4,6,null,450,'discontinued','4514459930086',2,280],
    ['EP55-14S Jigging',"5'5\"",'MAX450g (Best200~350g)',4,6,null,450,'discontinued','4514459930093',2,285]
  ]) add('Expedition',EX,x[0],x[1],x[2],x[3],x[4],{min:x[5],max:x[6],status:x[7],jan:x[8],pieces:x[9],weight:x[10]});

  const batch=Object.freeze({id:'zenaq-rods-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});
  if(rows.length!==66)throw new Error(`ZENAQ row count ${rows.length} != 66`);
  const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);
  if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);
  reg.push(batch);
})();
