import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const auto=await readFile(new URL('../tackle-auto-build-v29.js',import.meta.url),'utf8');
const css=await readFile(new URL('../tackle-auto-build-v29.css',import.meta.url),'utf8');
const pwa=await readFile(new URL('../pwa.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

const count=(source,token)=>source.split(token).length-1;

test('v33 exposes one consumer MY SET decision before optional evidence',()=>{
  assert.match(auto,/FISH_TARGET_TACKLE_SET_RESOLVER/);
  assert.match(auto,/setResolver\.resolvePlan\(plan,readOwned\(\)\)/);
  for(const token of ['今回の判定','このセットで行ける','確認が必要','足りない'])assert.ok(auto.includes(token),`missing ${token}`);
  assert.doesNotMatch(auto,/>IDEAL SET</,'engineering IDEAL label must not be required in primary UI');
  assert.doesNotMatch(auto,/>MY SET</,'engineering MY SET label must not be required in primary UI');
  assert.doesNotMatch(auto,/>MISSING</,'engineering MISSING label must not be required in primary UI');
  assert.ok(auto.indexOf('今回の判定')<auto.indexOf('基準・確認ポイントを見る'),'answer must precede evidence disclosure');
  assert.doesNotMatch(auto,/DAIWA|SHIMANO/,'AUTO BUILD must stay maker-neutral');
});

test('MY TACKLE stays read-only and forward action uses canonical decision wording',()=>{
  assert.match(auto,/fish_target_v17_tackle/);
  assert.match(auto,/localStorage\.getItem\(OWNED_KEY\)/);
  assert.doesNotMatch(auto,/localStorage\.(?:setItem|removeItem|clear)/);
  assert.match(auto,/このセットで現場へ/);
  assert.match(auto,/確認して現場へ/);
  assert.match(auto,/MY TACKLEを編集/);
  assert.match(auto,/MY TACKLEを追加/);
  assert.match(auto,/compatibleForField/);
  assert.match(auto,/fieldModeBtn/);
  assert.match(auto,/tackleManage/);
});

test('local set decision is automatic while Catalog remains user-triggered',()=>{
  assert.match(auto,/scheduleLocalResolve/);
  assert.match(auto,/run\(\{loadCatalog:false,automatic:true\}\)/);
  assert.match(auto,/addEventListener\('click',\(\)=>run\(\{loadCatalog:true\}\)\)/);
  assert.equal(count(auto,'loader.ensureLoaded()'),1,'Catalog hydration has one explicit user-triggered path');
  assert.match(auto,/if\(catalogEnabled\(\)&&loader\?\.ensureLoaded&&resolver\?\.matchCatalog\)/);
  assert.doesNotMatch(auto,/if\(!catalogEnabled\(\)\).*return/,'Catalog OFF must not block local MY SET resolution');
});

test('v33 keeps immediate post-FIRST-CAST hierarchy and ergonomic targets',()=>{
  assert.match(auto,/const anchor=\$\('#result \.firstCast'\)/);
  assert.match(auto,/STEP 3 · 今回のセット/);
  assert.match(auto,/手持ちから今回の1セットを決める/);
  assert.match(css,/autoBuildHeadV29>button\{[^}]*min-height:44px/,'secondary product action keeps a 44px target');
  assert.match(css,/autoBuildReadyV29 button\{[^}]*min-height:48px/,'primary next action keeps a 48px target');
  assert.match(css,/autoBuildSetSummaryV31 article>b\{[^}]*font-size:17px/,'primary decision text stays legible');
  assert.match(css,/autoBuildStageV29>small\{[^}]*font-size:12px/,'detail text no longer uses tiny critical type');
});

test('optional detail retains baseline gaps rod reel line rig and accessible alternatives',()=>{
  for(const token of ['推奨基準','確認ポイント','01 · ROD','02 · REEL','03 · LINE','04 · RIG','別候補'])assert.ok(auto.includes(token),`missing ${token}`);
  assert.match(auto,/autoBuildProductDetailV33/);
  assert.match(auto,/MAX_ALTERNATES=3/);
  assert.match(css,/autoBuildReferenceV33/);
  assert.match(css,/autoBuildStageInV29/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test('build and PWA shell include resolver before AUTO BUILD runtime',()=>{
  for(const asset of ['tackle-set-rules-v31.js','tackle-set-resolver-v31.js','tackle-auto-build-v29.js','tackle-auto-build-v29.css'])assert.ok(build.includes(`'${asset}'`),`build missing ${asset}`);
  const rulesIndex=pwa.indexOf("loadScript('./tackle-set-rules-v31.js'");
  const resolverIndex=pwa.indexOf("loadScript('./tackle-set-resolver-v31.js'");
  const autoIndex=pwa.indexOf("loadScript('./tackle-auto-build-v29.js'");
  assert.ok(rulesIndex>=0&&resolverIndex>rulesIndex&&autoIndex>resolverIndex,'PWA must load rules → resolver → AUTO BUILD');
  assert.match(pwa,/tackle-auto-build-v29-css/);
});

test('in-flight Catalog results are invalidated and the new plan auto-resolves locally',()=>{
  assert.match(auto,/let runEpoch=0,autoResolveQueued=false/);
  assert.match(auto,/runStillCurrent/);
  assert.match(auto,/const epoch=\+\+runEpoch/);
  assert.match(auto,/if\(!runStillCurrent\(epoch,plan\)\)return/);
  assert.match(auto,/function resetForPlanChange\(\)\{runEpoch\+=1/);
  assert.match(auto,/resetForPlanChange\(\)[\s\S]*scheduleLocalResolve/);
});
