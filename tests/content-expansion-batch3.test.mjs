import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectReadiness} from '../scripts/content-expansion-readiness.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=async rel=>JSON.parse(await readFile(path.join(root,rel),'utf8'));

test('batch3 adds Akahata as a materially distinct two-plan bottom rockfish target',async()=>{
  const authoring=await json('authoring/species-methods.v1.json');
  const target=authoring.targets.find(x=>x.name==='アカハタ');
  assert.ok(target,'Akahata authoring target must exist');
  assert.equal(target.species_id,'akahata');
  assert.equal(target.default_method.method,'ボトム・ジグヘッド');
  assert.equal(target.default_method.first_cast.range,'ボトム付近');
  assert.match(target.default_method.first_cast.bait_action,/スロー/);
  assert.equal(target.methods.length,1);
  assert.equal(target.methods[0].id,'tight-bottom-rig');
  assert.equal(target.methods[0].method,'フリーリグ / テキサス');
  assert.equal(target.methods[0].first_cast.range,'ボトム');
  assert.equal(target.default_method.source.confidence,'A');
  assert.equal(target.methods[0].source.confidence,'A');
  const report=await collectReadiness();
  assert.deepEqual(report.errors,[]);
  assert.equal(report.baseline.species,63);
  assert.equal(report.baseline.plans,158);
  assert.equal(report.catalog.batches,46);
  assert.equal(report.catalog.expected_rows,971);
  assert.equal(report.queue.total,0);
});

test('batch3 does not grow rod/reel or lure catalog scope',async()=>{
  const catalog=await json('catalog-batch-manifest.json');
  assert.equal(catalog.batches.length,46);
  assert.equal(catalog.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),971);
  const lure=await json('lure-catalog-manifest.json');
  assert.equal(lure.batches.some(x=>x.targets?.includes('アカハタ')),false);
});
