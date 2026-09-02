import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectReadiness} from '../scripts/content-expansion-readiness.mjs';
import {loadFragments,loadCombinedAuthoring} from '../scripts/species-method-fragments.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=async rel=>JSON.parse(await readFile(path.join(root,rel),'utf8'));

test('batch2 fragment composes without mutating the batch1 source payload',async()=>{
  const [fragments,combined,base]=await Promise.all([
    loadFragments(),
    loadCombinedAuthoring(),
    json('authoring/species-methods.v1.json')
  ]);
  assert.equal(fragments.length,1);
  assert.equal(fragments[0].id,'batch2-offshore-premium');
  assert.equal(fragments[0].file,'authoring/species-methods-batch2.v1.json');
  assert.deepEqual(base.targets.map(x=>x.name),['カマス','オオモンハタ']);
  assert.deepEqual(new Set(combined.targets.map(x=>x.name)),new Set(['カマス','オオモンハタ','アマダイ','アカムツ']));
  assert.equal(combined.existing.length,1);
  assert.equal(combined.existing[0].species,'サワラ');
  const authoredPlans=combined.targets.reduce((n,target)=>n+1+(target.methods||[]).length,0)
    +combined.existing.reduce((n,entry)=>n+(entry.methods||[]).length,0);
  assert.equal(authoredPlans,9);
});

test('batch2 advances the audited expansion baseline and clears the intake queue',async()=>{
  const report=await collectReadiness();
  assert.deepEqual(report.errors,[]);
  assert.equal(report.ready_for_input,true);
  assert.equal(report.doorstep_locked,true);
  assert.equal(report.queue.total,0);
  assert.equal(report.baseline.species,64);
  assert.equal(report.baseline.plans,159);
  assert.equal(report.catalog.batches,47);
  assert.equal(report.catalog.expected_rows,975);
  assert.equal(report.catalog.production_batches,0);
});

test('batch2 offshore rod rows stay compact, official-source-backed, and identifier-safe',async()=>{
  const batch=await json('catalog-batches/daiwa-offshore-premium-batch2-2026.json');
  assert.equal(batch.rows.length,4);
  assert.ok(batch.rows.every(row=>row.maker==='DAIWA'&&row.category==='rod'));
  assert.ok(batch.rows.every(row=>row.source?.source_type==='manufacturer_official'));
  assert.ok(batch.rows.every(row=>/^https:\/\/www\.daiwa\.com\/jp\//.test(row.source?.source_url||'')));
  assert.ok(batch.rows.every(row=>row.source?.last_verified==='2026-09-02'));
  assert.ok(batch.rows.every(row=>/^\d{13}$/.test(row.identifiers?.jan||'')));
  assert.equal(new Set(batch.rows.map(row=>row.identifiers.jan)).size,4);
  assert.deepEqual(batch.rows.map(row=>row.model),['190・R','S-210','M-210','J63B-2']);
});
