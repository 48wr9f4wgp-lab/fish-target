import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const json=async path=>JSON.parse(await readFile(path,'utf8'));
const writeJson=(path,value)=>writeFile(path,`${JSON.stringify(value,null,2)}\n`);
const replaceExact=(text,from,to,label)=>{
  if(!text.includes(from))throw new Error(`missing ${label}: ${from}`);
  return text.replace(from,to);
};
const replaceAllExact=(text,from,to,label)=>{
  if(!text.includes(from))throw new Error(`missing ${label}: ${from}`);
  return text.split(from).join(to);
};

const sourceArticle='https://fish.shimano.com/ja-JP/content/fishingstyle/article/2026/260113/index.html';
const sourceGuide='https://fish.shimano.com/ja-JP/content/beginners/fishingstyle/lurefishing/rockfish/index.html';

const authoring=await json('authoring/species-methods.v1.json');
if(authoring.version!=='SPECIES-METHOD-AUTHORING-1')throw new Error('unexpected authoring version');
if(authoring.targets.some(x=>x.name==='アカハタ'))throw new Error('Akahata already authored');
if(authoring.targets.length!==2)throw new Error(`expected two authored targets before Batch 3, got ${authoring.targets.length}`);

const sharedRequirements={
  rod:'7〜8ft前後 / ロックフィッシュ用（遠投・足場で長さを調整）',
  reel:'3000〜4000番 / HG',
  line:'PE 1.5〜2号',
  leader:'フロロ 5〜8号 / 約1.5m'
};

const akahata={
  species_id:'akahata',
  name:'アカハタ',
  water:'salt',
  shape:'rock',
  tags:['根魚','ロックフィッシュ','磯','ボトム'],
  aliases:[],
  difficulty:'中級',
  season:{
    春:'地域差が大きい。季節名だけで固定せず、水温・潮・現地実績を優先する。',
    夏:'地域差が大きい。潮通しと水深、ボトムの反応を見て成立を判断する。',
    秋:'晩秋の磯で成立する一次実釣例あり。水深と潮当たりのある場所で底付近を重点的に探る。',
    冬:'地域差が大きい。沿岸で反応が薄ければ深場と現地実績を優先する。'
  },
  default_method:{
    method:'ボトム・ジグヘッド',
    style:'lure',
    why:'アカハタは水深と潮当たりのある磯で底付近を重点的に狙い、シャッドテール系ワームのジグヘッドをスローに泳がせたりリフト&フォールすることで根周りを探れる。',
    requirements:{...sharedRequirements,rig:'PE→リーダー→ジグヘッド 5〜30g→シャッドテール系ワーム'},
    first_cast:{
      bait:'ジグヘッド+シャッドテールワーム',
      size:'5〜30g（潮流・水深で調整）',
      color:'赤/甲殻類・ナチュラル系',
      bait_action:'着底→スローにスイミング / リフト&フォール',
      range:'ボトム付近',
      action:'底を離し過ぎず探る',
      time:'潮が効く時間'
    },
    steps:[
      '水深があり潮当たりの良い岩礁へ投げ、まず確実に着底を取る',
      '底付近をスローに泳がせ、沈み根ではリフト&フォールでタイトに通す',
      '反応がなければ方向と通す高さを変え、ヒット後は根へ戻られる前に底を切る'
    ],
    places:['磯','堤防','水深のある岩礁'],
    mistakes:['オオモンハタと同じ感覚で中層を速く巻き続け、底付近を外す','ヒット後にため過ぎて沈み根へ戻される'],
    source:{
      provider:'SHIMANO 2026 アカハタ実釣 + ロックフィッシュ初心者ガイド',
      url:sourceArticle,
      reviewed_at:'2026-09-02',
      evidence:`2026年SHIMANO実釣はアカハタを水深と潮当たりのある磯の底付近で狙い、シャッドテール+ジグヘッドのボトム付近スイミング/リフト&フォール、よりスローな巻きを説明。タックル共通帯と5〜30gはSHIMANO公式ロックフィッシュガイド ${sourceGuide} を併用。`,
      confidence:'A'
    }
  },
  methods:[{
    id:'tight-bottom-rig',
    method:'フリーリグ / テキサス',
    style:'lure',
    why:'甲殻類を意識し、沈み根や岩穴へタイトに入れたい場面ではフリーリグ/テキサスでボトムをズル引き・リフト&フォール・ボトムバンプして探り分けられる。',
    requirements:{...sharedRequirements,rig:'PE→リーダー→フリーリグ/テキサス 5〜30g→クロー/ホッグ系ワーム'},
    first_cast:{
      bait:'クロー/ホッグ系ワーム',
      size:'5〜30gシンカー（潮流・水深で調整）',
      color:'甲殻類/赤・ナチュラル系',
      bait_action:'ズル引き→リフト&フォール / ボトムバンプ',
      range:'ボトム',
      action:'根へタイトに入れる',
      time:'潮が効く時間'
    },
    steps:[
      '沈み根や岩穴が絡む場所へ投げ、着底後にボトムコンタクトを保つ',
      '障害物が少なければズル引き、根が荒ければリフト&フォールやボトムバンプへ切り替える',
      '一投ごとに角度を変えて広く探り、バイト後はすぐ底から引き離す'
    ],
    places:['磯','堤防','沈み根・岩穴周り'],
    mistakes:['根掛かりを恐れて根から離し過ぎ、アカハタのボトム帯を外す','同じ角度だけを通して広範囲を探らない'],
    source:{
      provider:'SHIMANO ロックフィッシュ初心者ガイド + 2026 アカハタ実釣',
      url:sourceGuide,
      reviewed_at:'2026-09-02',
      evidence:`SHIMANO公式はアカハタを主要ロックフィッシュに含め、5〜30gのテキサス/フリーリグ等で海底をズル引き・リフト&フォール・ボトムバンプする基本を説明。アカハタ固有の底付近・スロー攻略は ${sourceArticle} で確認。`,
      confidence:'A'
    }
  }]
};

authoring.targets.push(akahata);
await writeJson('authoring/species-methods.v1.json',authoring);

const queue=await json('authoring/content-expansion-queue.v1.json');
if(queue.baseline_lock?.species!==62||queue.baseline_lock?.plans!==156)throw new Error(`unexpected baseline ${queue.baseline_lock?.species}/${queue.baseline_lock?.plans}`);
queue.baseline_lock.species=63;
queue.baseline_lock.plans=158;
await writeJson('authoring/content-expansion-queue.v1.json',queue);

const generated=spawnSync(process.execPath,['scripts/species-method-authoring.mjs'],{stdio:'inherit'});
if(generated.status!==0)throw new Error(`authoring generator failed: ${generated.status}`);

let browser=await readFile('scripts/content-expansion-browser-qa.mjs','utf8');
browser=replaceAllExact(browser,"document.querySelectorAll('#grid .fish').length===62","document.querySelectorAll('#grid .fish').length===63",'browser grid readiness');
browser=replaceAllExact(browser,'FISH_TARGET_METHOD_STATUS?.targets===62&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===156','FISH_TARGET_METHOD_STATUS?.targets===63&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===158','browser method status');
browser=replaceAllExact(browser,'FISH_TARGET_SPECIES_REGISTRY?.count===62&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===156','FISH_TARGET_SPECIES_REGISTRY?.count===63&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===158','browser registries');
browser=replaceExact(browser,"assert.equal(await page.locator('#grid .fish').count(),62,'content expansion renders 62 targets');","assert.equal(await page.locator('#grid .fish').count(),63,'content expansion renders 63 targets');",'browser target count');
browser=replaceExact(browser,"assert.equal(await text(page,'#home .heroStats span:nth-of-type(1)'),'62魚種','hero species count');","assert.equal(await text(page,'#home .heroStats span:nth-of-type(1)'),'63魚種','hero species count');",'browser hero species');
browser=replaceExact(browser,"includes('156釣法プラン')","includes('158釣法プラン')",'browser hero plans');
browser=replaceExact(browser,"  await openTarget(page,'カマス');","  await openTarget(page,'アカハタ');\n  assert.equal(await text(page,'#pmethod'),'ボトム・ジグヘッド','Akahata default is bottom-focused jighead');\n  assert.equal(await text(page,'#firstBait'),'ジグヘッド+シャッドテールワーム','Akahata FIRST CAST exposes the bottom jighead plan');\n  assert.equal(await page.locator('#methodPickerV1 [data-method-id=\"tight-bottom-rig\"]').count(),1,'Akahata exposes a distinct tight-bottom rig');\n  await selectMethod(page,'tight-bottom-rig');\n  assert.equal(await text(page,'#pmethod'),'フリーリグ / テキサス','Akahata tight-bottom method selectable');\n  assert.match(await text(page,'#steps'),/沈み根|岩穴/,'Akahata field steps keep the tight-structure decision');\n  assert.equal(await page.locator('#lureCatalogPanel').count(),0,'Akahata adds no research lure catalog UI');\n  await page.locator('#fieldModeBtn').click();\n  await page.locator('#fieldmode.on').waitFor({state:'visible'});\n  assert.equal(await text(page,'#fmFish'),'アカハタ','Akahata FIELD MODE target');\n  assert.equal(await text(page,'#fmMethod'),'フリーリグ / テキサス','Akahata FIELD MODE method');\n  await page.locator('#fmBackPlan').click();\n  await page.locator('#result.on').waitFor({state:'visible'});\n  const akahataLayout=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));\n  assert.ok(akahataLayout.doc<=391&&akahataLayout.body<=391&&akahataLayout.viewport===390,'390px Akahata result remains overflow-free');\n  await backHome(page);\n\n  await openTarget(page,'カマス');",'Akahata browser scenario');
browser=replaceExact(browser,"JSON.stringify({species:62,plans:156,catalogProducts:985,catalogBatches:46,lureRequests:requests,renderedKamasu:3,katsuoMethod:'offshore-jigging'})","JSON.stringify({species:63,plans:158,catalogProducts:985,catalogBatches:46,lureRequests:requests,renderedKamasu:3,katsuoMethod:'offshore-jigging',akahataMethods:2})",'browser summary');
await writeFile('scripts/content-expansion-browser-qa.mjs',browser);

let publication=await readFile('scripts/publication-browser-qa.mjs','utf8');
publication=replaceAllExact(publication,"document.querySelectorAll('#grid .fish').length===62","document.querySelectorAll('#grid .fish').length===63",'publication grid');
publication=replaceAllExact(publication,'FISH_TARGET_METHOD_STATUS?.plans===156&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===156','FISH_TARGET_METHOD_STATUS?.plans===158&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===158','publication plans');
publication=replaceExact(publication,"assert.equal(boot.targets,62,'publication build must retain all target decisions');","assert.equal(boot.targets,63,'publication build must retain all target decisions');",'publication target assert');
publication=replaceExact(publication,"assert.equal(boot.plans,156,'publication build must retain all approved fishing plans');","assert.equal(boot.plans,158,'publication build must retain all approved fishing plans');",'publication plan assert');
publication=replaceExact(publication,'PUBLICATION BROWSER QA PASS · 62 targets · 156 plans','PUBLICATION BROWSER QA PASS · 63 targets · 158 plans','publication summary');
await writeFile('scripts/publication-browser-qa.mjs',publication);

let readinessTest=await readFile('tests/content-expansion-readiness.test.mjs','utf8');
readinessTest=replaceExact(readinessTest,"assert.deepEqual(authoring.targets.map(x=>x.name),['カマス','オオモンハタ']);","assert.deepEqual(authoring.targets.map(x=>x.name),['カマス','オオモンハタ','アカハタ']);",'readiness authored targets');
await writeFile('tests/content-expansion-readiness.test.mjs',readinessTest);

let batch2=await readFile('tests/content-expansion-batch2.test.mjs','utf8');
batch2=replaceExact(batch2,'assert.equal(report.baseline.species,62);','assert.ok(report.baseline.species>=62,\'later additive batches must preserve the Batch 2 species floor\');','Batch2 species floor');
batch2=replaceExact(batch2,'assert.equal(report.baseline.plans,156);','assert.ok(report.baseline.plans>=156,\'later additive batches must preserve the Batch 2 plan floor\');','Batch2 plan floor');
await writeFile('tests/content-expansion-batch2.test.mjs',batch2);

const batch3Test=`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {readFile} from 'node:fs/promises';\nimport path from 'node:path';\nimport {fileURLToPath} from 'node:url';\nimport {collectReadiness} from '../scripts/content-expansion-readiness.mjs';\n\nconst root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');\nconst json=async rel=>JSON.parse(await readFile(path.join(root,rel),'utf8'));\n\ntest('batch3 adds Akahata as a materially distinct two-plan bottom rockfish target',async()=>{\n  const authoring=await json('authoring/species-methods.v1.json');\n  const target=authoring.targets.find(x=>x.name==='アカハタ');\n  assert.ok(target,'Akahata authoring target must exist');\n  assert.equal(target.species_id,'akahata');\n  assert.equal(target.default_method.method,'ボトム・ジグヘッド');\n  assert.equal(target.default_method.first_cast.range,'ボトム付近');\n  assert.match(target.default_method.first_cast.bait_action,/スロー/);\n  assert.equal(target.methods.length,1);\n  assert.equal(target.methods[0].id,'tight-bottom-rig');\n  assert.equal(target.methods[0].method,'フリーリグ / テキサス');\n  assert.equal(target.methods[0].first_cast.range,'ボトム');\n  assert.equal(target.default_method.source.confidence,'A');\n  assert.equal(target.methods[0].source.confidence,'A');\n  const report=await collectReadiness();\n  assert.deepEqual(report.errors,[]);\n  assert.equal(report.baseline.species,63);\n  assert.equal(report.baseline.plans,158);\n  assert.equal(report.catalog.batches,46);\n  assert.equal(report.catalog.expected_rows,971);\n  assert.equal(report.queue.total,0);\n});\n\ntest('batch3 does not grow rod/reel or lure catalog scope',async()=>{\n  const catalog=await json('catalog-batch-manifest.json');\n  assert.equal(catalog.batches.length,46);\n  assert.equal(catalog.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),971);\n  const lure=await json('lure-catalog-manifest.json');\n  assert.equal(lure.batches.some(x=>x.targets?.includes('アカハタ')),false);\n});\n`;
await writeFile('tests/content-expansion-batch3.test.mjs',batch3Test);

console.log('BATCH3_AKAHATA_APPLY_READY',JSON.stringify({species:63,plans:158,catalog:'46/971',lureCatalog:'unchanged'}));
