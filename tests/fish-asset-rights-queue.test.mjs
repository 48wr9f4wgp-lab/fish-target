import assert from 'node:assert/strict';
import test from 'node:test';
import {loadRightsQueue,loadSpeciesNames,stableSpeciesId} from '../scripts/fish-asset-rights-queue.mjs';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('fish asset rights queue is derived from the canonical 60-species composition with stable ids',()=>{
  const species=loadSpeciesNames();
  const queue=loadRightsQueue();
  const authoring=JSON.parse(read('authoring/fish-assets.v1.json'));
  const bundled=new Set(authoring.assets.map(x=>x.species_name));
  assert.equal(species.length,60);
  assert.equal(new Set(species).size,60);
  assert.equal(bundled.size,19);
  assert.equal(queue.length,41);
  assert.equal(new Set(queue.map(x=>x.species_name)).size,41);
  assert.equal(new Set(queue.map(x=>x.species_id)).size,41);
  assert.equal(new Set(queue.map(x=>x.queue_id)).size,41);
  assert.ok(queue.every(x=>!bundled.has(x.species_name)),'queue must contain only non-bundled species');
  assert.ok(queue.every(x=>x.status==='needs-candidate'));
  assert.ok(queue.every(x=>x.species_id===stableSpeciesId(x.species_name)));
  assert.ok(queue.every(x=>x.queue_id===`fish-rights:${x.species_id}`),'queue ids must not depend on queue position');
  console.log(`FISH_ASSET_RIGHTS_QUEUE ${JSON.stringify(queue.map(x=>({species_id:x.species_id,species_name:x.species_name})))}`);
});

test('rights queue species id algorithm stays aligned with runtime species registry',()=>{
  const registry=read('species-registry.js');
  assert.ok(registry.includes('h=2166136261'));
  assert.ok(registry.includes('Math.imul(h,16777619)'));
  for(const name of ['サバ','エソ','カジカ'])assert.match(stableSpeciesId(name),/^species-[a-z0-9]+$/);
});
