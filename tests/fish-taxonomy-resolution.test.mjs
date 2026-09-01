import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateTaxonomyResolutions} from '../scripts/fish-taxonomy-resolution-contract.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const load=file=>JSON.parse(read(file));

test('remaining six fish-image taxonomy semantics resolve without granting image rights',()=>{
  const resolutions=load('authoring/fish-taxonomy-resolutions.v1.json');
  const candidates=load('authoring/fish-asset-candidates.v1.json');
  const status=validateTaxonomyResolutions(resolutions,{candidateRegistry:candidates});
  assert.deepEqual(status,{count:6,generic:3,canonical:3,unresolved:0});
  const byName=new Map(resolutions.records.map(row=>[row.species_name,row]));
  for(const name of ['カレイ','タナゴ','ヒイカ']){
    assert.equal(byName.get(name).resolution_kind,'generic-category');
    assert.equal(byName.get(name).canonical_taxon,null);
    assert.equal(byName.get(name).visual_strategy,'generic-category-svg');
  }
  assert.equal(byName.get('オニカサゴ').canonical_taxon,'Scorpaena neglecta');
  assert.equal(byName.get('エソ').canonical_taxon,'Saurida macrolepis');
  assert.equal(byName.get('マルイカ').canonical_taxon,'Uroteuthis (Photololigo) edulis');
  assert.ok(resolutions.records.every(row=>!('publication_ready' in row)&&!('rights_status' in row)&&!('license' in row)));
});

test('taxonomy resolution cannot silently promote the six image candidates',()=>{
  const resolutions=load('authoring/fish-taxonomy-resolutions.v1.json');
  const candidates=load('authoring/fish-asset-candidates.v1.json');
  const candidateByName=new Map(candidates.records.map(row=>[row.species_name,row]));
  for(const row of resolutions.records)assert.equal(candidateByName.get(row.species_name)?.status,'taxonomy-review');
});
