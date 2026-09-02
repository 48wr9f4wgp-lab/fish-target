import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectReadiness} from '../scripts/content-expansion-readiness.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const text=rel=>readFile(path.join(root,rel),'utf8');
const json=async rel=>JSON.parse(await text(rel));

test('batch2 adds only Katsuo offshore jigging and keeps the species count fixed',async()=>{
  const authoring=await json('authoring/species-methods.v1.json');
  const katsuo=authoring.existing.find(x=>x.species==='カツオ');
  assert.ok(katsuo,'Katsuo authoring block must exist');
  assert.equal(katsuo.methods.length,1);
  const method=katsuo.methods[0];
  assert.equal(method.id,'offshore-jigging');
  assert.equal(method.method,'オフショアジギング');
  assert.equal(method.style,'lure');
  assert.equal(method.first_cast.bait,'メタルジグ');
  assert.equal(method.first_cast.bait_action,'着底→ワンピッチワンジャーク');
  assert.equal(method.first_cast.range,'ボトム〜表層');
  assert.match(method.requirements.rod,/オフショアジギング用スピニング/);
  assert.match(method.requirements.line,/対象魚の大きさ・ポイントに合わせる/);
  assert.match(method.requirements.leader,/対象魚の大きさ・ポイントに合わせる/);
  assert.equal(method.source.provider,'DAIWA ジギング入門');
  assert.equal(method.source.confidence,'A');
  assert.equal(method.source.url,'https://www.daiwa.com/jp/beginner/place/kanpachi_buri_jigging');

  const report=await collectReadiness();
  assert.deepEqual(report.errors,[]);
  assert.equal(report.baseline.species,62);
  assert.equal(report.baseline.plans,156);
  assert.equal(report.queue.total,0);
});

test('batch2 intentionally adds no rod/reel or lure catalog rows',async()=>{
  const catalog=await json('catalog-batch-manifest.json');
  assert.equal(catalog.batches.length,46);
  assert.equal(catalog.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),971);
  assert.equal(catalog.batches.some(x=>/nasci/i.test(x.id)),false,'do not duplicate NASCI into a new batch');

  const shimano=await text('catalog-shimano-poc.js');
  const nasciModels=['500','1000','C2000S','C2000SHG','2500','2500HG','2500SHG','C3000','C3000HG','4000','4000XG','C5000XG'];
  for(const model of nasciModels)assert.match(shimano,new RegExp(`NASCI ${model.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`),`existing SHIMANO POC retains NASCI ${model}`);

  const lure=await json('lure-catalog-manifest.json');
  assert.equal(lure.batches.length,2);
  assert.deepEqual(lure.batches.flatMap(x=>x.targets),['カマス','サワラ']);
  assert.equal(lure.batches.some(x=>x.targets?.includes('カツオ')),false,'Katsuo method depth must not grow lure data by default');
});
