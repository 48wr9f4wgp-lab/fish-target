import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {collectReadiness} from '../scripts/content-expansion-readiness.mjs';

const readJson=file=>JSON.parse(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'));
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('content expansion readiness locks the current post-batch baseline with no pending queue',async()=>{
  const report=await collectReadiness();
  const queue=readJson('authoring/content-expansion-queue.v1.json');
  assert.deepEqual(report.errors,[]);
  assert.equal(report.ready_for_input,true);
  assert.equal(report.doorstep_locked,true);
  assert.equal(report.baseline.species,queue.baseline_lock.species);
  assert.equal(report.baseline.plans,queue.baseline_lock.plans);
  assert.equal(report.coverage.all_species.length,queue.baseline_lock.species);
  assert.equal(report.coverage.all_species.reduce((sum,row)=>sum+row.plans,0),queue.baseline_lock.plans);
  assert.ok(report.coverage.all_species.every(row=>row.species&&row.water&&Array.isArray(row.methods)&&row.methods.length===row.plans));
  assert.equal(report.catalog.batches,queue.baseline_lock.catalog_batches);
  assert.equal(report.catalog.expected_rows,queue.baseline_lock.catalog_expected_rows);
  assert.equal(report.catalog.production_batches,0);
  assert.deepEqual(report.queue.counts,{species:0,methods:0,catalog:0});
  assert.equal(report.queue.total,0);
});

test('readiness baseline is tied to current catalog manifest rather than guessed counts',async()=>{
  const queue=readJson('authoring/content-expansion-queue.v1.json');
  const manifest=readJson('catalog-batch-manifest.json');
  const expectedRows=manifest.batches.reduce((sum,batch)=>sum+Number(batch.expected_rows||0),0);
  assert.equal(queue.baseline_lock.catalog_batches,manifest.batches.length);
  assert.equal(queue.baseline_lock.catalog_expected_rows,expectedRows);
  assert.ok(manifest.batches.every(batch=>batch.stage==='research'),'current factual catalog batches must remain research-only');
});

test('doorstep templates are inert and fail closed on publication',()=>{
  const species=readJson('authoring/templates/species-method-entry.v1.json');
  const catalog=readJson('authoring/templates/catalog-batch.v1.json');
  assert.equal(species.template_only,true);
  assert.equal(catalog.template_only,true);
  assert.equal(catalog.stage,'research');
  assert.equal(catalog.publication_ready,false);
  assert.equal(catalog.rows[0].status,'unknown','template must not infer lifecycle');
  assert.equal(catalog.rows[0].source.license_status,'restricted','template must fail closed on source rights');
  assert.equal(catalog.rows[0].identifiers.jan,undefined,'template must not invent JAN');
});

test('applied content batches remain explicit while the next runtime authoring queue is empty',()=>{
  const authoring=readJson('authoring/species-methods.v1.json');
  assert.deepEqual(authoring.targets.map(x=>x.name),['カマス','オオモンハタ']);
  const appliedExisting=new Map(authoring.existing.map(x=>[x.species,x]));
  assert.equal(appliedExisting.get('サワラ')?.methods?.some(method=>method.id==='boat-blade'),true,'Batch 1 Sawara method remains explicit');
  assert.equal(appliedExisting.get('カツオ')?.methods?.some(method=>method.id==='offshore-jigging'),true,'Batch 2 Katsuo method remains explicit');
  const queue=readJson('authoring/content-expansion-queue.v1.json');
  assert.deepEqual(queue.species_candidates,[]);
  assert.deepEqual(queue.method_candidates,[]);
  assert.deepEqual(queue.catalog_candidates,[]);
});

test('single-command expansion gate and runbook are present',()=>{
  const gate=read('scripts/content-expansion-gate.mjs');
  const runbook=read('docs/CONTENT_EXPANSION_RUNBOOK_V1.md');
  assert.match(gate,/content-expansion-readiness\.mjs/);
  assert.match(gate,/catalog-contract-qa\.mjs/);
  assert.match(gate,/\['test'\]/);
  assert.match(runbook,/node scripts\/content-expansion-gate\.mjs/);
  assert.match(runbook,/実データ追加の直前/);
  assert.match(runbook,/rod \/ reel/);
});