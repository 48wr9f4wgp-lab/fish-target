import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareRows,renderModule} from '../scripts/catalog-ingest.mjs';

const official=(overrides={})=>({
  maker:'SHIMANO',category:'reel',series:'NASCI',generation:'unknown',model:'4000XG',status:'current',
  specs:{reel_size:'4000',weight_g:'280',pe_capacity_raw:'PE 1-490m, 1.5-320m, 2-240m'},
  source:{source_type:'manufacturer_official',source_provider:'shimano-official-research',source_url:'https://fish.shimano.com/example',retrieved_at:'2026-08-26',last_verified:'2026-08-26',license_status:'restricted'},
  identifiers:{jan:'4969363048165'},
  ...overrides
});

test('catalog ingest normalizes safe numerics without inventing line or unit conversions',()=>{
  const [row]=prepareRows([official()],{expectedMaker:'SHIMANO',requireOfficial:true});
  assert.equal(row.specs.reel_size,4000);
  assert.equal(row.specs.weight_g,280);
  assert.equal(row.specs.pe_capacity_raw,'PE 1-490m, 1.5-320m, 2-240m');
  assert.equal('lineType' in row.specs,false);
  assert.equal('lineNo' in row.specs,false);
  assert.equal(row.source.license_status,'restricted');
});

test('catalog ingest rejects duplicate JAN and duplicate canonical product keys',()=>{
  assert.throws(()=>prepareRows([official(),official({model:'C5000XG'})]),/duplicate JAN/);
  assert.throws(()=>prepareRows([official(),official({identifiers:{jan:'4969363048172'}})]),/duplicate product key/);
});

test('catalog ingest rejects malformed provenance, reversed ranges, and provider policy leakage',()=>{
  assert.throws(()=>prepareRows([official({source:{source_type:'manufacturer_official',source_provider:'x',source_url:'http://example.com',license_status:'restricted'}})]),/https/);
  assert.throws(()=>prepareRows([official({specs:{line_pe_min:2,line_pe_max:1}})]),/PE range reversed/);
  assert.throws(()=>prepareRows([official({productionEnabled:true})]),/provider policy/);
  assert.throws(()=>prepareRows([official({identifiers:{jan:'123'}})]),/13 digits/);
});

test('catalog ingest official gate and maker gate fail closed',()=>{
  assert.throws(()=>prepareRows([official({maker:'DAIWA'})],{expectedMaker:'SHIMANO'}),/expected maker/);
  assert.throws(()=>prepareRows([official({source:{source_type:'synthetic',source_provider:'fixture',source_url:null,license_status:'synthetic'}})],{requireOfficial:true}),/manufacturer_official/);
});

test('generated catalog module is deterministic and freezes row metadata',()=>{
  const input=[official({model:'C5000XG',identifiers:{jan:'4969363048172'}}),official()];
  const a=prepareRows(input,{expectedMaker:'SHIMANO',requireOfficial:true});
  const b=prepareRows([...input].reverse(),{expectedMaker:'SHIMANO',requireOfficial:true});
  assert.equal(JSON.stringify(a),JSON.stringify(b));
  const module=renderModule(a,'FISH_TARGET_SHIMANO_BATCH_ROWS');
  assert.match(module,/globalThis\.FISH_TARGET_SHIMANO_BATCH_ROWS/);
  assert.match(module,/Object\.freeze\(\{\.\.\.row\.source\}\)/);
  assert.match(module,/4969363048165/);
});
