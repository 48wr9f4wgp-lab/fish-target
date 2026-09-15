import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const manifest=JSON.parse(read('lure-catalog-manifest.json'));

const requiredIds=Object.freeze([
  'daiwa-lightgame-jighead-v34','shimano-lightgame-jighead-v34',
  'daiwa-surf-flatfish-v34','majorcraft-surf-flatfish-v34',
  'daiwa-seabass-v34','shimano-seabass-v34',
  'daiwa-tairaba-v34','shimano-tairaba-v34'
]);

test('V34 integration candidate composes one complete research manifest',()=>{
  assert.equal(manifest.version,'LURE-CATALOG-7');
  assert.equal(manifest.batches.length,14);
  assert.equal(manifest.batches.reduce((sum,batch)=>sum+batch.expected_rows,0),29);
  assert.equal(new Set(manifest.batches.map(batch=>batch.id)).size,14,'batch ids must be unique');
  assert.equal(new Set(manifest.batches.map(batch=>batch.file)).size,14,'batch files must be unique');
  assert.ok(manifest.batches.every(batch=>batch.stage==='research'));
  for(const id of requiredIds)assert.ok(manifest.batches.some(batch=>batch.id===id),`missing integrated batch ${id}`);
  for(const batch of manifest.batches)assert.equal(existsSync(new URL(batch.file,root)),true,`missing ${batch.file}`);
});

test('light-game UI keeps complete rig, component and complete-lure labels',()=>{
  const loader=read('lure-catalog-loader.js');
  assert.match(loader,/FIRST CASTセット/);
  assert.match(loader,/仕掛け部品/);
  assert.match(loader,/ルアー完成品/);
});

test('TRIP READY all-plan audit is present in the integrated candidate',()=>{
  assert.equal(existsSync(new URL('scripts/trip-readiness-audit-v34.mjs',root)),true);
  assert.equal(existsSync(new URL('tests/trip-readiness-audit-v34.test.mjs',root)),true);
  const rules=read('trip-pack-rules-v34.js');
  assert.match(rules,/style==='lure'/);
  assert.match(rules,/青物\|大型/);
});

test('catalog integration stays research-only at the manifest boundary',()=>{
  assert.ok(manifest.batches.every(batch=>batch.stage==='research'));
  assert.doesNotMatch(JSON.stringify(manifest),/price|stock|color_sku/i);
});
