import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildIntakePlan} from '../scripts/fish-asset-intake-plan.mjs';
import {stableSpeciesId} from '../scripts/fish-asset-rights-queue.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('intake planner creates stable AVIF targets only for verified candidates',()=>{
  const input=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  const verified=input.records.filter(x=>x.status==='verified-candidate');
  const plan=buildIntakePlan();
  assert.equal(plan.length,verified.length);
  assert.ok(plan.length>=30);
  assert.equal(new Set(plan.map(x=>x.target_file)).size,plan.length);
  for(const item of plan){
    assert.equal(item.species_id,stableSpeciesId(item.species_name));
    assert.equal(item.target_file,`assets/fish/${item.species_id}.avif`);
    assert.equal(item.execution_state,'planned-only');
    assert.match(item.source_page_url,/^https:\/\//);
  }
  assert.ok(!plan.some(x=>x.species_name==='エソ'),'taxonomy-review species must not enter intake plan');
});

test('explicit intake request fails closed on taxonomy-review species',()=>{
  assert.throws(()=>buildIntakePlan({speciesNames:['エソ']}),/Taxonomy review blocks intake/);
  const one=buildIntakePlan({speciesNames:['サバ']});
  assert.equal(one.length,1);
  assert.equal(one[0].species_name,'サバ');
});

test('intake planner has no network, binary-write, or publication side effects',()=>{
  const source=read('scripts/fish-asset-intake-plan.mjs');
  assert.ok(!source.includes('fetch('));
  assert.ok(!source.includes('writeFile'));
  assert.ok(!source.includes('exec('));
  assert.ok(!source.includes('publication_ready'));
});
