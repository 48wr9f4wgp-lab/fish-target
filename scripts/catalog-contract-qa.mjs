import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=file=>new URL(`../${file}`,import.meta.url);
const read=async file=>readFile(root(file),'utf8');
const exists=async file=>{try{await access(root(file));return true}catch{return false}};
const text=value=>String(value??'').trim();
const canonical=value=>text(value).normalize('NFKC').toLowerCase();
const rowKey=row=>[row.maker,row.category,row.series,row.generation||'unknown',row.model].map(canonical).join('|');
const rowLike=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&text(value.maker)&&text(value.category)&&text(value.series)&&text(value.model));
const forbiddenOwnershipKeys=new Set(['installed_line','installed_line_type','installed_line_no','current_line','current_line_type','current_line_no','lineType','lineNo','user_overrides']);
const sourceLicenses=new Set(['internal','permitted','licensed','restricted','unknown']);

const manifest=JSON.parse(await read('catalog-batch-manifest.json'));
assert.match(text(manifest.version),/^CATALOG-BATCHES-\d+$/,'catalog manifest version contract');
assert.ok(Array.isArray(manifest.batches)&&manifest.batches.length>0,'catalog manifest needs batches');

const batchIds=new Set();
const ownedFiles=new Map();
const factualRows=[];
const batchSummaries=[];

function rowsFromSandbox(sandbox){
  const rows=[];
  for(const value of Object.values(sandbox)){
    if(!Array.isArray(value))continue;
    if(value.every(rowLike))rows.push(...value);
    else for(const item of value){if(Array.isArray(item?.rows))rows.push(...item.rows.filter(rowLike))}
  }
  const seen=new Set();
  return rows.filter(row=>{if(seen.has(row))return false;seen.add(row);return true});
}

for(const [index,batch] of manifest.batches.entries()){
  assert.ok(batch&&typeof batch==='object'&&!Array.isArray(batch),`batch ${index}: object required`);
  assert.ok(text(batch.id),`batch ${index}: id required`);
  assert.ok(!batchIds.has(batch.id),`batch ${index}: duplicate id ${batch.id}`);
  batchIds.add(batch.id);
  assert.equal(text(batch.stage),'research',`${batch.id}: current catalog batches must remain research stage`);
  assert.ok(text(batch.maker),`${batch.id}: maker required`);
  assert.ok(Number.isInteger(batch.expected_rows)&&batch.expected_rows>0,`${batch.id}: positive expected_rows required`);
  assert.ok(Array.isArray(batch.files)&&batch.files.length>0,`${batch.id}: files required`);

  const rows=[];
  for(const file of batch.files){
    assert.ok(text(file),`${batch.id}: empty file entry`);
    assert.ok(await exists(file),`${batch.id}: missing runtime file ${file}`);
    const previous=ownedFiles.get(file);
    assert.ok(!previous||previous===batch.id,`${file}: assigned to multiple batches (${previous}, ${batch.id})`);
    ownedFiles.set(file,batch.id);
    const sandbox={};
    sandbox.globalThis=sandbox;
    vm.runInNewContext(await read(file),sandbox,{filename:file});
    rows.push(...rowsFromSandbox(sandbox));
  }

  assert.equal(rows.length,batch.expected_rows,`${batch.id}: manifest expected_rows must match runtime rows`);
  for(const [rowIndex,row] of rows.entries()){
    assert.equal(row.maker,batch.maker,`${batch.id} row ${rowIndex}: maker mismatch`);
    assert.notEqual(row.source?.source_type,'synthetic',`${batch.id} row ${rowIndex}: research row cannot be synthetic`);
    assert.ok(text(row.source?.source_type),`${batch.id} row ${rowIndex}: source_type required`);
    assert.ok(text(row.source?.source_provider),`${batch.id} row ${rowIndex}: source_provider required`);
    assert.ok(sourceLicenses.has(text(row.source?.license_status)),`${batch.id} row ${rowIndex}: research license_status invalid`);
    assert.ok(!Object.hasOwn(row,'productionEnabled'),`${batch.id} row ${rowIndex}: productionEnabled belongs to provider policy`);
    assert.ok(!Object.hasOwn(row.source||{},'productionEnabled'),`${batch.id} row ${rowIndex}: source cannot override production policy`);
    for(const key of forbiddenOwnershipKeys){
      assert.ok(!Object.hasOwn(row,key),`${batch.id} row ${rowIndex}: ${key} is user-owned state, not catalog data`);
      assert.ok(!Object.hasOwn(row.specs||{},key),`${batch.id} row ${rowIndex}: specs.${key} is user-owned state, not product spec`);
    }
  }
  factualRows.push(...rows);
  batchSummaries.push({id:batch.id,maker:batch.maker,rows:rows.length});
}

const seenKeys=new Map();
const seenJan=new Map();
for(const [index,row] of factualRows.entries()){
  const key=rowKey(row);
  assert.ok(!seenKeys.has(key),`duplicate canonical product key: ${key} (rows ${seenKeys.get(key)} and ${index})`);
  seenKeys.set(key,index);
  const jan=text(row.identifiers?.jan);
  if(jan){
    assert.match(jan,/^\d{13}$/,`row ${index}: JAN must be 13 digits`);
    assert.ok(!seenJan.has(jan),`duplicate JAN ${jan}`);
    seenJan.set(jan,index);
  }
}

const runtime={console:{warn:()=>{}}};
runtime.globalThis=runtime;
for(const file of ['catalog-providers.js','catalog-adapters.js',...ownedFiles.keys(),'catalog-research.js','catalog-fixtures.js','catalog.js']){
  vm.runInNewContext(await read(file),runtime,{filename:file});
}

const catalog=runtime.FISH_TARGET_CATALOG;
const research=runtime.FISH_TARGET_CATALOG_RESEARCH_ROWS;
const fixtures=runtime.FISH_TARGET_CATALOG_FIXTURES;
const composition=runtime.FISH_TARGET_CATALOG_COMPOSITION;
assert.ok(catalog,'catalog runtime must initialize');
assert.equal(research.length,factualRows.length,'research registry count must match manifest factual rows');
assert.ok(research.every(row=>row.source?.source_type!=='synthetic'),'research registry cannot contain synthetic rows');
assert.ok(fixtures.every(row=>row.source?.source_type==='synthetic'),'fixture registry must contain synthetic rows only');
assert.equal(catalog.products.length,research.length+fixtures.length,'runtime count must equal research + fixtures');
assert.equal(composition.research,research.length,'composition research count');
assert.equal(composition.synthetic,fixtures.length,'composition synthetic count');
assert.equal(composition.total,catalog.products.length,'composition total count');
assert.deepEqual(Array.from(catalog.validateCatalog(catalog.products)),[],'runtime catalog validation must be clean');

const researchIds=new Set(Array.from(research,row=>catalog.productId(row)));
const factualRuntime=catalog.products.filter(product=>researchIds.has(product.product_id));
assert.equal(factualRuntime.length,research.length,'all research rows must survive runtime composition exactly once');
for(const product of factualRuntime){
  assert.equal(catalog.productionEligible(product),false,`${product.product_id}: research product publication gate must remain off`);
  if(product.source?.source_type==='manufacturer_official'&&product.source?.license_status==='restricted'){
    assert.equal(catalog.productionEligible(product),false,`${product.product_id}: restricted manufacturer row cannot publish`);
  }
}

const summary={
  manifest:manifest.version,
  batches:manifest.batches.length,
  makers:new Set(factualRows.map(row=>row.maker)).size,
  research:research.length,
  synthetic:fixtures.length,
  runtime:catalog.products.length,
  jan:seenJan.size,
  sources:[...new Set(research.map(row=>row.source?.source_type))].sort(),
  largestBatches:batchSummaries.slice().sort((a,b)=>b.rows-a.rows).slice(0,5)
};
console.log(`CATALOG CONTRACT QA PASS ${JSON.stringify(summary)}`);
