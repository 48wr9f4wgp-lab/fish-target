import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {collectReadiness} from '../scripts/content-expansion-readiness.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const text=rel=>readFile(path.join(root,rel),'utf8');
const json=async rel=>JSON.parse(await text(rel));

async function loadLureRows(){
  const manifest=await json('lure-catalog-manifest.json');
  const sandbox={};sandbox.globalThis=sandbox;
  for(const batch of manifest.batches)vm.runInNewContext(await text(batch.file),sandbox,{filename:batch.file});
  return {manifest,rows:(sandbox.FISH_TARGET_LURE_CATALOG_BATCH_ROWS||[]).flatMap(batch=>batch.rows||[])};
}

test('batch1 content remains intact when later additive batches are present',async()=>{
  const authoring=await json('authoring/species-methods.v1.json');
  const batch1Targets=authoring.targets.filter(x=>['カマス','オオモンハタ'].includes(x.name));
  assert.deepEqual(batch1Targets.map(x=>x.name),['カマス','オオモンハタ']);
  assert.deepEqual(batch1Targets.map(x=>x.methods.length+1),[2,2]);
  const sawara=authoring.existing.find(x=>x.species==='サワラ');
  assert.ok(sawara,'Batch 1 Sawara block remains authored');
  assert.equal(sawara.methods[0].id,'boat-blade');
  assert.equal(sawara.methods[0].method,'ボート・ブレードジギング');
  const report=await collectReadiness();
  assert.deepEqual(report.errors,[]);
  assert.ok(report.baseline.species>=62,'later additive batches must preserve the Batch 1 species floor');
  assert.ok(report.baseline.plans>=155,'later additive batches must preserve the Batch 1 plan floor');
  assert.equal(report.queue.total,0);
});

test('rod expansion stays inside the existing lazy rod/reel catalog boundary',async()=>{
  const manifest=await json('catalog-batch-manifest.json');
  const ids=new Set(manifest.batches.map(x=>x.id));
  assert.ok(ids.has('daiwa-gekkabijin-mebaru-rods-2023'));
  assert.ok(ids.has('daiwa-outrage-br-lc'));
  assert.equal(manifest.batches.length,46);
  assert.equal(manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),971);
  const rods=[...(await json('catalog-batches/daiwa-gekkabijin-mebaru-rods-2023.json')).rows,...(await json('catalog-batches/daiwa-outrage-br-lc.json')).rows];
  assert.equal(rods.length,7);
  assert.ok(rods.every(x=>x.category==='rod'&&x.maker==='DAIWA'));
  assert.equal(new Set(rods.map(x=>x.identifiers.jan)).size,7);
  assert.ok(rods.every(x=>/^\d{13}$/.test(x.identifiers.jan)));
});

test('lure catalog is target-sharded, research-only, and excludes color-SKU/image bloat',async()=>{
  const {manifest,rows}=await loadLureRows();
  assert.equal(manifest.batches.length,2);
  assert.deepEqual(manifest.batches.map(x=>x.targets),[['カマス'],['サワラ']]);
  assert.equal(rows.length,5);
  assert.equal(rows.filter(x=>x.targets.includes('カマス')).length,3);
  assert.equal(rows.filter(x=>x.targets.includes('サワラ')).length,2);
  assert.ok(rows.every(x=>x.publication_ready===false));
  assert.ok(rows.every(x=>x.variant_scope==='functional-size'));
  const serialized=JSON.stringify(rows);
  assert.doesNotMatch(serialized,/image|thumbnail|color_sku|price|stock/i);
  const batchBytes=(await Promise.all(manifest.batches.map(async x=>(await stat(path.join(root,x.file))).size))).reduce((a,b)=>a+b,0);
  assert.ok(batchBytes<6000,`lure target shards too large: ${batchBytes} bytes`);
  assert.ok((await stat(path.join(root,'lure-catalog-loader.js'))).size<5000);
  assert.ok((await stat(path.join(root,'lure-catalog-entry.js'))).size<5000);
  assert.ok((await stat(path.join(root,'pwa.js'))).size<8000,'lure demand gate must not bloat the startup bootstrap');
});

test('research build keeps every lure asset out of install-time shell and exposes only target metadata',async()=>{
  const [html,sw,pwa,build]=await Promise.all([text('dist/index.html'),text('dist/sw.js'),text('pwa.js'),text('scripts/build.mjs')]);
  assert.match(html,/data-lure-catalog-runtime="on"/);
  assert.match(html,/data-lure-catalog-targets="カマス\|サワラ"/);
  for(const lazy of ['lure-catalog.css','lure-catalog-entry.js','lure-catalog-loader.js','lure-catalog-manifest.json','lure-catalog-daiwa-kamasu-light-2026.js','lure-catalog-daiwa-sawara-blade-2026.js']){
    assert.doesNotMatch(sw,new RegExp(`\\./${lazy.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:["'])`),`${lazy} must not be install-time shell`);
  }
  assert.match(pwa,/dataset\.lureCatalogTargets/);
  assert.match(pwa,/const maybeLoadLureUi=/);
  assert.match(pwa,/lureTargets\.has\(species\)/);
  assert.match(pwa,/loadCss\('\.\/lure-catalog\.css','lure-catalog-css'\)/);
  assert.match(pwa,/loadScript\('\.\/lure-catalog-entry\.js','lure-catalog-entry-js'\)/);
  assert.match(pwa,/new MutationObserver/);
  assert.doesNotMatch(pwa,/if\(lureRuntime\)await loadScript\('\.\/lure-catalog-entry\.js'/);
  assert.doesNotMatch(pwa,/extensionStyles\.splice[^\n]*lure-catalog\.css/);
  assert.match(build,/lureLazyRuntimeAssets=lureRuntimeEnabled\?\[/);
  assert.match(build,/'lure-catalog\.css','lure-catalog-entry\.js','lure-catalog-loader\.js'/);
  assert.match(build,/publicationBuild\?lureCatalogManifest\.batches\.filter\(batch=>batch\?\.stage==='production'\)/);
});

test('lure loader fetches manifest only after explicit per-species demand',async()=>{
  const src=await text('lure-catalog-loader.js');
  assert.match(src,/async function ensureFor\(species\)/);
  assert.match(src,/batch\.targets\.includes\(species\)/);
  assert.match(src,/fetch\('lure-catalog-manifest\.json'/);
  assert.doesNotMatch(src,/Promise\.all\(m\.batches\.map/);
  const entry=await text('lure-catalog-entry.js');
  assert.match(entry,/panel\.addEventListener\('toggle'/);
  assert.match(entry,/if\(panel\.open\)/);
  assert.doesNotMatch(entry,/fetch\(/);
});
