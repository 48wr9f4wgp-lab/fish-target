import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const auto=await readFile(new URL('../tackle-auto-build-v29.js',import.meta.url),'utf8');
const css=await readFile(new URL('../tackle-auto-build-v29.css',import.meta.url),'utf8');
const pwa=await readFile(new URL('../pwa.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

const count=(source,token)=>source.split(token).length-1;

test('auto build resolves ideal set MY SET and gaps before optional product picks',()=>{
  assert.match(auto,/FISH_TARGET_TACKLE_SET_RESOLVER/);
  assert.match(auto,/setResolver\.resolvePlan\(plan,readOwned\(\)\)/);
  for(const token of ['IDEAL SET','MY SET','MISSING'])assert.ok(auto.includes(token),`missing ${token}`);
  assert.ok(auto.indexOf('IDEAL SET')<auto.indexOf('商品候補・詳細'),'set decision hierarchy must precede product detail');
  assert.doesNotMatch(auto,/DAIWA|SHIMANO/,'AUTO BUILD must stay maker-neutral');
});

test('MY TACKLE is read-only during auto build and next action is explicit',()=>{
  assert.match(auto,/fish_target_v17_tackle/);
  assert.match(auto,/localStorage\.getItem\(OWNED_KEY\)/);
  assert.doesNotMatch(auto,/localStorage\.(?:setItem|removeItem|clear)/);
  assert.match(auto,/手持ちは変更しません/);
  assert.match(auto,/STEP 4 · 現場へ/);
  assert.match(auto,/MY TACKLEを編集/);
  assert.match(auto,/MY TACKLEを追加/);
  assert.match(auto,/compatibleForField/);
  assert.match(auto,/fieldModeBtn/);
  assert.match(auto,/tackleManage/);
});

test('catalog is optional and remains user-triggered',()=>{
  assert.equal(count(auto,'loader.ensureLoaded()'),1,'Catalog hydration has one explicit AUTO BUILD trigger');
  assert.match(auto,/if\(catalogEnabled\(\)&&loader\?\.ensureLoaded&&resolver\?\.matchCatalog\)/);
  assert.doesNotMatch(auto,/if\(!catalogEnabled\(\)\).*return/,'Catalog OFF must not block spec/MY SET resolution');
});

test('RC32 makes auto build the immediate post-FIRST-CAST action',()=>{
  assert.match(auto,/const anchor=\$\('#result \.firstCast'\)/);
  assert.match(auto,/STEP 3 · セットを組む/);
  assert.match(auto,/理想＋MY TACKLE＋不足を一発判定/);
  assert.match(auto,/autoBuildStatusV29" id="autoBuildStatusV29" hidden/);
  assert.match(css,/min-height:48px/,'primary AUTO BUILD tap target must be at least 48px');
  assert.match(css,/autoBuildReadyV29 button\{[^}]*min-height:44px/,'next-action tap target must be at least 44px');
});

test('optional product detail retains rod reel line rig and accessible alternatives',()=>{
  for(const token of ['01 · ROD','02 · REEL','03 · LINE','04 · RIG','商品候補・詳細','別候補'])assert.ok(auto.includes(token),`missing ${token}`);
  assert.match(auto,/MAX_ALTERNATES=3/);
  assert.match(css,/autoBuildSetSummaryV31/);
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