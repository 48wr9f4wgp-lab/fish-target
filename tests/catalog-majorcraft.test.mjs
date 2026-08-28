import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const context=vm.createContext({console});
for(const file of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(file),context,{filename:file});
const catalog=context.FISH_TARGET_CATALOG;

test('Major Craft current research batch keeps all 33 official rods as catalog grows',()=>{
  const rows=catalog.list({maker:'MAJOR CRAFT'});
  assert.equal(rows.length,33);
  assert.ok(catalog.products.length>=354,'later maker batches may grow the catalog without changing the Major Craft contract');
  assert.ok(rows.every(x=>x.category==='rod'));
  assert.ok(rows.every(x=>x.source.source_type==='manufacturer_official'));
  assert.ok(rows.every(x=>x.source.license_status==='restricted'));
  assert.ok(rows.every(x=>catalog.productionEligible(x)===false));
  const jans=rows.map(x=>x.identifiers.jan);
  assert.equal(new Set(jans).size,33);
  assert.ok(jans.every(x=>/^4573236\d{6}$/.test(x)));
});

test('AJIDO 5G preserves light through float/caro official facts without inventing FC power',()=>{
  const rows=catalog.list({maker:'MAJOR CRAFT',series:'AJIDO 5G'});
  assert.equal(rows.length,11);
  const light=rows.find(x=>x.model==='AD5-S582UL/AJI');
  assert.equal(light.specs.length_ft,5.8);
  assert.equal(light.specs.pieces,2);
  assert.equal(light.specs.weight_g,50);
  assert.equal(light.specs.power,'UL');
  assert.equal(light.specs.lure_min_g,0.2);
  assert.equal(light.specs.lure_max_g,2.5);
  assert.equal(light.specs.line_pe_min,0.1);
  assert.equal(light.specs.line_pe_max,0.4);
  assert.equal(light.identifiers.jan,'4573236272887');

  const fc=rows.find(x=>x.model==='AD5-S832FC/AJI');
  assert.equal(fc.specs.length_ft,8.3);
  assert.equal(fc.specs.weight_g,78);
  assert.equal(fc.specs.power,'','FC is a model/application suffix, not silently mapped to a power class');
  assert.equal(fc.specs.lure_min_g,3);
  assert.equal(fc.specs.lure_max_g,24);
  assert.equal(fc.identifiers.jan,'4573236272986');
});

test('CROSSRIDE rows preserve official ranges and resolve 962MH piece discrepancy with official catalog evidence',()=>{
  const shore=catalog.list({maker:'MAJOR CRAFT',series:'CROSSRIDE 5G'});
  const lsj=catalog.list({maker:'MAJOR CRAFT',series:'CROSSRIDE 5G LSJ'});
  const seven=catalog.list({maker:'MAJOR CRAFT',series:'CROSSRIDE 7G'});
  assert.equal(shore.length,5);
  assert.equal(lsj.length,3);
  assert.equal(seven.length,4);
  const mh=shore.find(x=>x.model==='XR5-962MH');
  assert.equal(mh.specs.pieces,2);
  assert.equal(mh.specs.lure_min_g,40);
  assert.equal(mh.specs.lure_max_g,80);
  assert.equal(mh.source.source_url,'https://www.majorcraft.co.jp/catalog/2024-EN/44/');
  const h=seven.find(x=>x.model==='XR7-1002H');
  assert.equal(h.specs.weight_g,247);
  assert.equal(h.specs.lure_min_g,null,'MAX-only official spec must not invent a lower bound');
  assert.equal(h.specs.lure_max_g,120);
  assert.equal(h.specs.line_pe_min,2.5);
  assert.equal(h.specs.line_pe_max,5);
  assert.equal(h.identifiers.jan,'4573236278629');
});

test('NEW SOLPARA Ajing and Tiprun preserve current official facts and avoid unsupported 5ft10 numeric encoding',()=>{
  const ajing=catalog.list({maker:'MAJOR CRAFT',series:'NEW SOLPARA AJING'});
  const tip=catalog.list({maker:'MAJOR CRAFT',series:'NEW SOLPARA TIPRUN'});
  assert.equal(ajing.length,7);
  assert.equal(tip.length,3);
  const a=ajing.find(x=>x.model==='SPAJ-S682M');
  assert.equal(a.specs.length_ft,6.8);
  assert.equal(a.specs.weight_g,78);
  assert.equal(a.specs.power,'M');
  assert.equal(a.specs.lure_min_g,0.6);
  assert.equal(a.specs.lure_max_g,5);
  assert.equal(a.identifiers.jan,'4573236269061');
  const t=tip.find(x=>x.model==='SPJTE-S632M');
  assert.equal(t.specs.length_ft,6.3);
  assert.equal(t.specs.lure_min_g,null);
  assert.equal(t.specs.lure_max_g,90);
  assert.equal(t.identifiers.jan,'4573236269122');
  assert.equal(tip.some(x=>x.model==='SPJTE-S5102L'||x.model==='SPJTE-S5102ML'),false,'5ft10 models wait for unambiguous length representation');
});

test('Major Craft catalog ownership snapshots preserve rod specs without mutating canonical product facts',()=>{
  const rod=catalog.list({maker:'MAJOR CRAFT',series:'CROSSRIDE 7G'}).find(x=>x.model==='XR7-1002MH');
  const owned=catalog.ownedSnapshot(rod,{id:'mc-rod'});
  assert.equal(owned.source,'catalog');
  assert.equal(owned.maker,'MAJOR CRAFT');
  assert.equal(owned.size,undefined);
  assert.equal(owned.length,10);
  assert.equal(owned.power,'MH');
  assert.equal(owned.maxLure,100);
  assert.equal(rod.specs.lure_min_g,null);
});
