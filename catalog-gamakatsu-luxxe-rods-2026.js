(()=>{
  const R='2026-08-29';
  const C=new Set(['UL','L','ML','M','MH','H','XH','XXH','XXXH']);
  const G=[
    ['LUXXE Storia F','https://www.gamakatsu.co.jp/products/24310/',[
      ['24310','66FL-solid.R','FL',1.98,"198cm (6'6\")",49,2,'0.4〜3.5g',0.4,3.5,'1〜3lb',null,null,'4549018435726'],
      ['24311','67UL-solid.RF','UL',2.01,"201cm (6'7\")",51,2,'0.5〜5g',0.5,5,'1.5〜4lb',null,null,'4549018435733'],
      ['24313','65L-solid.RF','L',1.96,"196cm (6'5\")",52,2,'0.5〜7g',0.5,7,'2〜5lb',null,null,'4549018435740']
    ]],
    ['LUXXE Oct Rise','https://www.gamakatsu.co.jp/products/24616/',[
      ['24617','B76XH','XH',2.285,"228.5cm (7'6\")",185,2,'30〜70g',30,70,'PE 3〜6号',3,6,'4549018607857'],
      ['24616','B83XH','XH',2.52,"252cm (8'3\")",195,2,'30〜70g',30,70,'PE 3〜6号',3,6,'4549018607840'],
      ['24618','S76XH','XH',2.285,"228.5cm (7'6\")",185,2,'30〜70g',30,70,'PE 3〜6号',3,6,'4549018607864']
    ]],
    ['LUXXE EG X','https://www.gamakatsu.co.jp/products/24638/',[
      ['24649','S72ML-solid','ML',2.18,"218cm (7'2\")",84,2,'Egi 1.8〜3.5号',null,null,'PE 0.3〜1号',0.3,1,'4549018635416'],
      ['24638','S86ML','ML',2.59,"259cm (8'6\")",85,2,'Egi 1.8〜3.5号',null,null,'PE 0.4〜1号',0.4,1,'4549018614633'],
      ['24639','S86ML-solid','ML',2.59,"259cm (8'6\")",85,2,'Egi 1.8〜3.5号',null,null,'PE 0.3〜1号',0.3,1,'4549018614640'],
      ['24650','S89ML-solid','ML',2.67,"267cm (8'9\")",87,2,'Egi 1.8〜3.5号',null,null,'PE 0.3〜1号',0.3,1,'4549018635423']
    ]],
    ['LUXXE EG S','https://www.gamakatsu.co.jp/products/24736/',[
      ['24794','S76L','L',2.28,"228cm (7'6\")",83,2,'Egi 1.8〜3.5号',null,null,'PE 0.4〜1号',0.4,1,'4549018794502'],
      ['24795','S77ML','ML',2.31,"231cm (7'7\")",86,2,'Egi 1.8〜3.5号',null,null,'PE 0.4〜1号',0.4,1,'4549018794519'],
      ['24736','S82ML','ML',2.49,"249cm (8'2\")",92,2,'Egi 1.8〜3.5号',null,null,'PE 0.4〜1号',0.4,1,'4549018731293'],
      ['24737','S86ML','ML',2.59,"259cm (8'6\")",94,2,'Egi 1.8〜3.5号',null,null,'PE 0.4〜1号',0.4,1,'4549018731309'],
      ['24796','S76M','M',2.28,"228cm (7'6\")",89,2,'Egi 2〜3.5号',null,null,'PE 0.4〜1.2号',0.4,1.2,'4549018794526'],
      ['24738','S82M','M',2.49,"249cm (8'2\")",93,2,'Egi 2〜3.5号',null,null,'PE 0.4〜1.2号',0.4,1.2,'4549018731316'],
      ['24739','S86M','M',2.59,"259cm (8'6\")",96,2,'Egi 2〜3.5号',null,null,'PE 0.4〜1.2号',0.4,1.2,'4549018731323']
    ]],
    ['LUXXE RAYGRIT TC','https://www.gamakatsu.co.jp/products/24806/',[
      ['24806','S83/8','8',2.515,"251.5cm (8'3\")",405,2,'60〜180g',60,180,'PE 6〜8号',6,8,'4549018802016'],
      ['24807','S711/10','10',2.415,"241.5cm (7'11\")",425,2,'80〜200g',80,200,'PE 8〜10号',8,10,'4549018802023'],
      ['24808','S73/12','12',2.21,"221cm (7'3\")",520,2,'80〜250g',80,250,'PE 8〜12号',8,12,'4549018802030'],
      ['24809','S70/12+','12+',2.135,"213.5cm (7'0\")",580,2,'100〜300g',100,300,'PE 10〜15号',10,15,'4549018802047']
    ]],
    ['LUXXE EGTR XX','https://www.gamakatsu.co.jp/products/24753/',[
      ['24753','S69L+-solid','L+',2.06,"206cm (6'9\")",75,2,'15〜60g',15,60,'PE 0.3〜0.8号',0.3,0.8,'4549018762204'],
      ['24754','S510ML-solid','ML',1.78,"178cm (5'10\")",68,2,'20〜70g',20,70,'PE 0.3〜0.8号',0.3,0.8,'4549018762211'],
      ['24755','S65ML-solid','ML',1.96,"196cm (6'5\")",73,2,'20〜70g',20,70,'PE 0.3〜0.8号',0.3,0.8,'4549018762228'],
      ['24756','S74ML-solid','ML',2.24,"224cm (7'4\")",82,2,'20〜70g',20,70,'PE 0.3〜0.8号',0.3,0.8,'4549018762235']
    ]],
    ['LUXXE Efreet','https://www.gamakatsu.co.jp/products/24408/',[
      ['24408','B67M-RF','M',2.01,"201cm (6'7\")",98,1,'1/8〜3/4oz (3.5〜21g)',3.5,21,'8〜14lb',null,null,'4549018491371'],
      ['24410','B64MH-R','MH',1.93,"193cm (6'4\")",100,1,'3/16〜3/4oz (5〜21g)',5,21,'10〜16lb',null,null,'4549018491388'],
      ['24411','B70MH-F','MH',2.135,"213.5cm (7'0\")",110,1,'3/16〜1oz (5〜28g)',5,28,'10〜16lb',null,null,'4549018491395'],
      ['24414','B70H-RF','H',2.135,"213.5cm (7'0\")",113,1,'3/16〜1・1/4oz (5〜35g)',5,35,'12〜20lb',null,null,'4549018491401']
    ]],
    ['LUXXE Speedmetal R','https://www.gamakatsu.co.jp/products/24624/',[
      ['24624','B65ML','ML',1.96,"196cm (6'5\")",103,2,'5〜20号 (19〜75g)',19,75,'PE 0.3〜1号',0.3,1,'4549018604184'],
      ['24625','B65M','M',1.96,"196cm (6'5\")",105,2,'8〜25号 (30〜93g)',30,93,'PE 0.3〜1号',0.3,1,'4549018604191'],
      ['24627','B57MH','MH',1.70,"170cm (5'7\")",97,2,'10〜30号 (38〜112g)',38,112,'PE 0.3〜1号',0.3,1,'4549018604214'],
      ['24626','B65MH','MH',1.96,"196cm (6'5\")",106,2,'10〜30号 (38〜112g)',38,112,'PE 0.3〜1号',0.3,1,'4549018604207']
    ]],
    ['LUXXE 宵姫 華弐','https://www.gamakatsu.co.jp/products/24686/',[
      ['24686','S54AL-solid','AL',1.63,"163cm (5'4\")",37,2,'0.1〜1.5g',0.1,1.5,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018672282'],
      ['24687','S54FL-solid','FL',1.63,"163cm (5'4\")",39,2,'0.1〜2g',0.1,2,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018672299'],
      ['24688','S59FL-solid','FL',1.75,"175cm (5'9\")",41,2,'0.1〜2.5g',0.1,2.5,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018672305'],
      ['24689','S68FL-solid','FL',2.035,"203.5cm (6'8\")",46,2,'0.1〜3g',0.1,3,'PE 0.1〜0.3号 / Nylon 0.8〜2lb',0.1,0.3,'4549018672312']
    ]],
    ['LUXXE JEBULL','https://www.gamakatsu.co.jp/products/24303/',[
      ['24303','93XH','XH',2.82,"282cm (9'3\")",365,2,'60〜120g',60,120,'PE 3〜5号',3,5,'4549018414080'],
      ['24305','110XH','XH',3.35,"335cm (11'0\")",390,2,'60〜120g',60,120,'PE 3〜5号',3,5,'4549018414103'],
      ['24304','98XXH','XXH',2.95,"295cm (9'8\")",390,2,'80〜150g',80,150,'PE 4〜6号',4,6,'4549018414097']
    ]],
    ['LUXXE 宵姫 天','https://www.gamakatsu.co.jp/products/24355/',[
      ['24566','S48AL-solid','AL',1.42,"142cm (4'8\")",28,2,'0.1〜1.5g',0.1,1.5,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018544442'],
      ['24355','S54FL-solid','FL',1.63,"163cm (5'4\")",32,2,'0.1〜2g',0.1,2,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018481808'],
      ['24358','S511FL-solid','FL',1.80,"180cm (5'11\")",36,2,'0.1〜2.5g',0.1,2.5,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018481815'],
      ['24648','S52UL-solid','UL',1.57,"157cm (5'2\")",33,2,'0.1〜3g',0.1,3,'PE 0.1〜0.3号 / Nylon 0.8〜2lb',0.1,0.3,'4549018634990'],
      ['24510','S61L-solid','L',1.85,"185cm (6'1\")",42,2,'0.1〜5g',0.1,5,'PE 0.1〜0.3号 / Nylon 1〜3lb',0.1,0.3,'4549018523102'],
      ['24512','S510ML-solid','ML',1.78,"178cm (5'10\")",41,2,'0.1〜7g',0.1,7,'PE 0.1〜0.4号 / Nylon 1〜3lb',0.1,0.4,'4549018523119']
    ]],
    ['LUXXE 宵姫 爽 弐','https://www.gamakatsu.co.jp/products/24800/',[
      ['24800','S53FL-solid','FL',1.60,"160cm (5'3\")",42,2,'0.1〜2g',0.1,2,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018808360'],
      ['24801','S58FL-solid','FL',1.73,"173cm (5'8\")",44,2,'0.1〜2.5g',0.1,2.5,'PE 0.1〜0.3号 / Nylon 0.8〜1.5lb',0.1,0.3,'4549018808377'],
      ['24802','S63UL-solid','UL',1.905,"190.5cm (6'3\")",49,2,'0.1〜4g',0.1,4,'PE 0.1〜0.3号 / Nylon 0.8〜2lb',0.1,0.3,'4549018808384'],
      ['24803','S69UL-solid','UL',2.06,"206cm (6'9\")",54,2,'0.1〜5g',0.1,5,'PE 0.1〜0.3号 / Nylon 0.8〜2lb',0.1,0.3,'4549018808391'],
      ['24804','S73L-solid','L',2.21,"221cm (7'3\")",56,2,'0.1〜10g',0.1,10,'PE 0.1〜0.3号 / Nylon 1〜3lb',0.1,0.3,'4549018808407'],
      ['24805','S78M-solid','M',2.34,"234cm (7'8\")",62,2,'0.7〜16g',0.7,16,'PE 0.2〜0.5号 / Nylon 1〜4lb',0.2,0.5,'4549018808414']
    ]]
  ];
  const rows=[];
  for(const [series,url,list] of G)for(const [product_code,model,power_raw,length_m,length_raw,weight_g,pieces,lure_weight_raw,lure_min_g,lure_max_g,line_weight_raw,line_pe_min,line_pe_max,jan] of list){
    const power=C.has(power_raw)?power_raw:'';
    rows.push({maker:'GAMAKATSU',category:'rod',series,generation:'current',model,display_name:`${series} ${model}`,status:'current',specs:{length_ft:null,length_m,length_raw,pieces,pieces_raw:String(pieces),weight_g,power,power_raw,lure_min_g,lure_max_g,jig_max_g:null,lure_weight_raw,line_pe_min,line_pe_max,line_weight_raw,sinker_load_raw:''},source:{source_type:'manufacturer_official',source_provider:'gamakatsu-official-research',source_url:url,retrieved_at:R,last_verified:R,license_status:'restricted'},identifiers:{product_code,jan}})
  }
  const batch=Object.freeze({id:'gamakatsu-luxxe-rods-2026',rows:Object.freeze(rows.map(r=>Object.freeze({...r,specs:Object.freeze({...r.specs}),source:Object.freeze({...r.source}),identifiers:Object.freeze({...r.identifiers})})))});
  if(rows.length!==52)throw new Error(`Gamakatsu batch expected 52 rows, got ${rows.length}`);
  const reg=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);if(reg.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);reg.push(batch);
})();
