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
  assert.ok(resolutions.records.every(row=>!('publication_ready' in row)&&!('rights_status' in row)&&!('license' in row)&&!('author' in row)&&!('attribution' in row)));
});

test('independently verified canonical candidate may advance only when its taxon matches the taxonomy resolution',()=>{
  const resolutions=load('authoring/fish-taxonomy-resolutions.v1.json');
  const candidates=load('authoring/fish-asset-candidates.v1.json');
  const byName=new Map(candidates.records.map(row=>[row.species_name,row]));
  assert.equal(byName.get('オニカサゴ')?.status,'verified-candidate');
  assert.equal(byName.get('オニカサゴ')?.source_taxon,'Scorpaena neglecta');
  assert.doesNotThrow(()=>validateTaxonomyResolutions(resolutions,{candidateRegistry:candidates}));

  const mismatch=structuredClone(candidates);
  mismatch.records.find(row=>row.species_name==='オニカサゴ').source_taxon='Scorpaenopsis cirrosa';
  assert.throws(()=>validateTaxonomyResolutions(resolutions,{candidateRegistry:mismatch}),/verified candidate taxon must match resolved canonical taxon/);
});

test('generic taxonomy remains fail-closed against single-species candidate promotion',()=>{
  const resolutions=load('authoring/fish-taxonomy-resolutions.v1.json');
  const candidates=load('authoring/fish-asset-candidates.v1.json');
  for(const name of ['カレイ','タナゴ','ヒイカ'])assert.equal(candidates.records.find(row=>row.species_name===name)?.status,'taxonomy-review');

  const promoted=structuredClone(candidates);
  const row=promoted.records.find(item=>item.species_name==='カレイ');
  row.status='verified-candidate';
  delete row.review_reason;
  assert.throws(()=>validateTaxonomyResolutions(resolutions,{candidateRegistry:promoted}),/generic taxonomy cannot promote a single-species image candidate/);
});

test('taxonomy registry itself cannot carry rights or attribution assertions',()=>{
  const resolutions=load('authoring/fish-taxonomy-resolutions.v1.json');
  const candidates=load('authoring/fish-asset-candidates.v1.json');
  for(const field of ['license','author','attribution','rights_status','publication_ready']){
    const invalid=structuredClone(resolutions);
    invalid.records[0][field]=field==='publication_ready'?true:'forbidden';
    assert.throws(()=>validateTaxonomyResolutions(invalid,{candidateRegistry:candidates}),/taxonomy registry cannot assert rights\/publication state/);
  }
});
