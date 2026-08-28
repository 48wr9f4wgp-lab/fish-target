import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(source('catalog-batch-manifest.json'));
const batchFiles=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const context=vm.createContext({console});
for(const file of ['catalog-providers.js','catalog-adapters.js',...batchFiles,'catalog-fixtures.js','catalog.js'])vm.runInContext(source(file),context,{filename:file});
const catalog=context.FISH_TARGET_CATALOG;
const providers=context.FISH_TARGET_CATALOG_PROVIDERS;
const expectedOfficial=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);

test('research catalog contains manifest factual rows plus 14 synthetic fixtures',()=>{
  assert.ok(catalog);
  assert.equal(expectedOfficial,150);
  assert.equal(catalog.products.length,expectedOfficial+14);
  const official=catalog.products.filter(p=>p.source.source_type==='manufacturer_official');
  const synthetic=catalog.products.filter(p=>p.source.source_type==='synthetic');
  assert.equal(official.length,expectedOfficial);
  assert.equal(synthetic.length,14);
  assert.equal(official.filter(p=>p.maker==='DAIWA').length,116);
  assert.equal(official.filter(p=>p.maker==='SHIMANO').length,34);
  assert.equal(catalog.validateCatalog(catalog.products).length,0);
});

test('SHIMANO official research rows preserve JAN/source facts but remain production-blocked',()=>{
  const rows=catalog.products.filter(p=>p.maker==='SHIMANO'&&p.source.source_type==='manufacturer_official');
  assert.equal(rows.length,34);
  const provider=providers.byMaker('SHIMANO');
  assert.equal(provider.id,'shimano-official-research');
  assert.equal(provider.productionEnabled,false);
  const jans=rows.map(p=>p.identifiers.jan);
  assert.equal(new Set(jans).size,34);
  assert.ok(jans.every(jan=>/^\d{13}$/.test(jan)));
  assert.ok(rows.every(p=>p.source.license_status==='restricted'));
  assert.ok(rows.every(p=>catalog.productionEligible(p)===false));
});

test('SHIMANO rod normalization follows FISH TARGET ft.in convention and preserves power',()=>{
  const s106=catalog.list({maker:'SHIMANO',series:'COLTSNIPER BB'}).find(p=>p.model==='S106M');
  const s96mh=catalog.list({maker:'SHIMANO',series:'COLTSNIPER BB'}).find(p=>p.model==='S96MH');
  assert.equal(s106.specs.length_ft,10.6);
  assert.equal(s106.specs.length_m,3.2);
  assert.equal(s96mh.specs.length_ft,9.6);
  assert.equal(s96mh.specs.power,'MH');
  assert.equal(s96mh.specs.jig_max_g,80);
});

test('reel capacity is searchable product metadata but never inferred as the currently spooled line',()=>{
  const nasci=catalog.search({query:'4969363048165'}).items[0];
  assert.equal(nasci.display_name,'NASCI 4000XG');
  assert.match(nasci.specs.pe_capacity_raw,/PE 1-490m/);
  const owned=catalog.ownedSnapshot(nasci,{id:'test-reel'});
  assert.equal(owned.size,4000);
  assert.equal(owned.lineType,'');
  assert.equal(owned.lineNo,null);

  const emeraldas=catalog.search({query:'4550133579592'}).items[0];
  assert.equal(emeraldas.display_name,'EMERALDAS AIR PC LT2500-H');
  assert.equal(emeraldas.specs.pe_capacity_raw,'0.8号-200m');
  const emeraldasOwned=catalog.ownedSnapshot(emeraldas,{id:'test-daiwa-reel'});
  assert.equal(emeraldasOwned.lineType,'');
  assert.equal(emeraldasOwned.lineNo,null);
});
