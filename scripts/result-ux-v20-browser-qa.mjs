import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

async function ready(){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_RESULT_UX_V20&&globalThis.FISH_TARGET_RESULT_UX_V21&&globalThis.FISH_TARGET_RESULT_UX_V23),null,{timeout:20000});
  await page.locator('button.fish[data-fish="シロギス"]').waitFor({state:'visible',timeout:20000});
}
async function openFish(name){
  await page.locator(`button.fish[data-fish="${name}"]`).click();
  await page.locator('#result.on').waitFor({state:'visible'});
  await page.locator('.fitV20Summary').waitFor({state:'visible'});
}
async function setTackle(data){await page.evaluate(value=>localStorage.setItem('fish_target_v17_tackle',JSON.stringify(value)),data)}
async function backHome(){await page.locator('#back').click();await page.locator('#home.on').waitFor({state:'visible'})}

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await ready();
await setTackle({
  rods:[{id:'bad-rod',source:'manual',name:'DEMO LIGHT 76L',length:7.6,power:'L',maxLure:20}],
  reels:[{id:'surf-reel',source:'catalog',name:'SURF LEADER SD 35 HYOUJYUN',applicationRaw:'投げ・遠投',dragTypeRaw:'ドラグあり',lineType:'',lineNo:null}]
});
await page.reload({waitUntil:'networkidle'});await ready();await openFish('シロギス');

assert.equal((await page.locator('.tackleFitHead strong').textContent()).trim(),'このセットで行ける？','action-first tackle title');
assert.equal((await page.locator('.fitV20Summary b').textContent()).trim(),'このセットは見直し推奨','bad rod drives clear summary');
const rod=page.locator('.fitV20Item').filter({hasText:'ROD'}),reel=page.locator('.fitV20Item').filter({hasText:'REEL'});
assert.match((await rod.textContent())||'',/DEMO LIGHT 76L/,'bad rod selected');
assert.match((await rod.textContent())||'',/× 非推奨/,'metric surf rod mismatch is hard fail');
assert.match((await rod.textContent())||'',/3\.6〜4\.2m/,'metric target remains native display');
assert.match((await reel.textContent())||'',/SURF LEADER SD 35 HYOUJYUN/,'surf reel selected');
assert.match((await reel.textContent())||'',/△ 要確認/,'missing installed line remains explicit soft check');
assert.match((await reel.textContent())||'',/今巻いているライン種類を登録/,'reel explains only missing user data');
assert.match((await page.locator('.fitV20Details>summary em').textContent())||'',/見直し:/,'detail summary names concrete review causes');
assert.equal(await page.locator('.fitV20DetailBody').isVisible(),false,'technical rationale stays collapsed');

const answerTitle=((await page.locator('#result .ux23AnswerTitle').textContent())||'').trim();
assert.equal(answerTitle,'まず投げる','answer heading is concise plain-language action');
assert.doesNotMatch(answerTitle,/FIRST CAST/,'FIRST CAST label is not duplicated in the section heading');
assert.equal(((await page.locator('#firstCastKicker').textContent())||'').trim(),'最初の1投','answer card identity uses plain Japanese');
assert.equal(((await page.locator('#result .rotationLabel').textContent())||'').trim(),'ダメなら →','rotation is demoted to a short next-step label');

const first=page.locator('#result .firstCast'),plan=page.locator('#result .planCard'),fit=page.locator('#tackleFitCard'),gear=page.locator('#gear');
const firstBox=await first.boundingBox(),planBox=await plan.boundingBox(),fitBox=await fit.boundingBox(),gearBox=await gear.boundingBox();
assert.ok(firstBox&&planBox&&firstBox.y<planBox.y,'FIRST CAST is the first answer before method controls');
assert.ok(fitBox&&gearBox&&fitBox.y<gearBox.y,'MY TACKLE decision comes before generic required tackle');
assert.ok((await page.locator('#firstBait').boundingBox())?.y<470,'FIRST CAST answer is visible in the opening decision window');
assert.ok(firstBox&&firstBox.height<=390,`FIRST CAST density stays bounded: ${firstBox?.height}`);
assert.ok(planBox&&planBox.height<=240,`method card density stays bounded: ${planBox?.height}`);
assert.equal(await page.locator('#methodPickerV1').isVisible(),false,'method chooser is collapsed by default');
const methodChange=page.locator('#ux23MethodChange');
const changeBox=await methodChange.boundingBox();assert.ok(changeBox&&changeBox.height>=44,'method change target meets 44px minimum');
const shiroMethodCount=await page.locator('#methodPickerV1 [data-method-id]').count();assert.ok(shiroMethodCount>=2,'fish retains multiple supported methods');
await methodChange.click();
assert.equal(await page.locator('#methodPickerV1').isVisible(),true,'method chooser opens only on demand');
const visibleMethodButtons=await page.locator('#methodPickerV1 [data-method-id]:visible').count();assert.equal(visibleMethodButtons,shiroMethodCount,'all methods defined for this fish remain accessible');
await methodChange.click();assert.equal(await page.locator('#methodPickerV1').isVisible(),false,'method chooser collapses again');

assert.equal(await page.locator('#v19Conditions .planOptions').count(),1,'basic conditions unified into the single conditions group');
assert.equal(await page.locator('#result .planCard .planOptions').count(),0,'duplicate top-level condition control removed');
const favorite=page.locator('#favoriteBtn');
assert.match(((await favorite.textContent())||'').trim(),/^[☆★]$/,'favorite is a low-noise star icon');
assert.match((await favorite.getAttribute('aria-label'))||'',/お気に入り/,'favorite remains explicitly named for assistive tech');
assert.equal(await favorite.evaluate(el=>el.parentElement?.classList.contains('planTop')),true,'favorite moves into method header instead of consuming a full row');
const favoriteBox=await favorite.boundingBox();assert.ok(favoriteBox&&favoriteBox.width>=44&&favoriteBox.height>=44,'favorite target meets 44px minimum');
const favoritePseudo=await favorite.evaluate(el=>({before:getComputedStyle(el,'::before').content,after:getComputedStyle(el,'::after').content}));
const pseudoEmpty=v=>v==='none'||v==='normal'||v==='""'||v==="''";
assert.ok(pseudoEmpty(favoritePseudo.before)&&pseudoEmpty(favoritePseudo.after),`favorite renders exactly one glyph with no legacy pseudo icon: ${JSON.stringify(favoritePseudo)}`);
const backBox=await page.locator('#back').boundingBox();assert.ok(backBox&&backBox.width>=44&&backBox.height>=44,'back target meets 44px minimum');

assert.equal(await page.locator('#resultDockV20').isVisible(),true,'result action dock visible');
assert.equal(await page.locator('#resultDockV20 [data-action="home"]').isVisible(),false,'redundant fish-list dock action removed');
assert.equal(await page.locator('#resultDockV20 button:visible').count(),2,'dock exposes only save and field mode');
const dockBox=await page.locator('#resultDockV20').boundingBox();assert.ok(dockBox&&dockBox.height<=56,`dock chrome stays thin while preserving targets: ${dockBox?.height}`);
const dockButtons=await page.locator('#resultDockV20 button:visible').evaluateAll(btns=>btns.map(b=>b.getBoundingClientRect().height));
assert.ok(dockButtons.every(h=>h>=44),`dock targets meet 44px minimum: ${dockButtons.join(',')}`);
assert.equal(await page.locator('.nav').isVisible(),false,'generic nav hidden on result');

const gearMetrics=await page.locator('#gear').evaluate(el=>({display:getComputedStyle(el).display,cols:getComputedStyle(el).gridTemplateColumns,height:el.getBoundingClientRect().height,children:[...el.children].map(x=>x.getBoundingClientRect().height)}));
assert.equal(gearMetrics.cols.split(' ').length,1,'required tackle is a single fast-scan spec list');
assert.ok(gearMetrics.height<=230,`required tackle list stays compact: ${gearMetrics.height}`);
assert.ok(gearMetrics.children.every(h=>h>=44),`required tackle rows stay readable/tappable scale: ${gearMetrics.children.join(',')}`);
const activeRotation=page.locator('#rotation button.on');if(await activeRotation.count())assert.equal(await activeRotation.isVisible(),false,'current FIRST CAST is not repeated as its own alternative');
assert.equal(await page.locator('#switchRule').isVisible(),false,'10-15 cast switching rule leaves the primary result flow');
const rotationTargets=await page.locator('#rotation button:visible').evaluateAll(btns=>btns.map(b=>({h:b.getBoundingClientRect().height,bg:getComputedStyle(b).backgroundColor})));
assert.ok(rotationTargets.every(x=>x.h>=44),`alternative touch targets stay accessible: ${JSON.stringify(rotationTargets)}`);

const x=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(x.doc<=391&&x.body<=391&&x.viewport===390,'no result overflow');

await page.locator('#resultDockV20 [data-action="field"]').click();
await page.locator('#fieldmode.on').waitFor({state:'visible'});
assert.equal((await page.locator('#fmFish').textContent()||'').trim(),'シロギス','field mode keeps selected fish');
assert.ok((await page.locator('#fmBait').textContent()||'').trim(),'field mode keeps FIRST CAST');
await page.locator('#fmBackPlan').click();await page.locator('#result.on').waitFor({state:'visible'});

await backHome();
const tackleShortcut=page.locator('.v19TackleShortcut');
await tackleShortcut.waitFor({state:'visible'});
await tackleShortcut.click();
await page.locator('#tackleSheet').waitFor({state:'visible'});
assert.equal(await page.locator('.tackleSheetIntroV26').count(),0,'redundant tackle intro is removed from default flow');
await page.locator('#tackleClose').click();

assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await context.close();await browser.close();
console.log('RESULT_UX_V20_BROWSER_QA_PASS');
