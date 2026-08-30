import assert from 'node:assert/strict';
import test from 'node:test';
import {loadRightsQueue,loadSpeciesNames} from '../scripts/fish-asset-rights-queue.mjs';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('fish asset rights queue is derived from the canonical 60-species composition',()=>{
  const species=loadSpeciesNames();
  const queue=loadRightsQueue();
  const authoring=JSON.parse(read('authoring/fish-assets.v1.json'));
  const bundled=new Set(authoring.assets.map(x=>x.species_name));
  assert.equal(species.length,60);
  assert.equal(new Set(species).size,60);
  assert.equal(bundled.size,19);
  assert.equal(queue.length,41);
  assert.equal(new Set(queue.map(x=>x.species_name)).size,41);
  assert.ok(queue.every(x=>!bundled.has(x.species_name)),'queue must contain only non-bundled species');
  assert.ok(queue.every(x=>x.status==='needs-candidate'));
  console.log(`FISH_ASSET_RIGHTS_QUEUE ${JSON.stringify(queue.map(x=>x.species_name))}`);
});
