import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const QUEUE_PATH=path.join(root,'authoring/content-expansion-queue.v1.json');
const text=value=>String(value??'').trim();
const canonical=value=>text(value).normalize('NFKC').toLowerCase();
const HTTP=/^https:\/\//i;
const ID=/^[a-z0-9][a-z0-9_-]*$/;
const SPECIES_ID=/^[a-z0-9][a-z0-9-]{2,63}$/;
const PRIORITIES=new Set(['P0','P1','P2']);
const CATEGORIES=new Set(['rod','reel']);

async function exists(rel){try{await access(path.join(root,rel));return true}catch{return false}}
async function source(rel){return readFile(path.join(root,rel),'utf8')}
async function json(rel){return JSON.parse(await source(rel))}
async function runIfPresent(rel,sandbox,append=''){
  if(!(await exists(rel)))return false;
  vm.runInNewContext(`${await source(rel)}${append}`,sandbox,{filename:rel});
  return true;
}

async function loadContentModel(){
  const sandbox={console:{log(){},warn(){},error(){}}};
  sandbox.globalThis=sandbox;
  await runIfPresent('data.js',sandbox,'\n;globalThis.__CONTENT_BASE_F=F;');
  for(let version=1;version<=4;version++){
    for(let part=1;part<=5;part++)await runIfPresent(`target-method-data-v${version}-part${part}.js`,sandbox);
    await runIfPresent(`target-method-data-v${version}.js`,sandbox);
  }
  await runIfPresent('species-method-authoring-generated.js',sandbox);
  await runIfPresent('species-method-authoring-runtime.js',sandbox);

  const base=Array.isArray(sandbox.__CONTENT_BASE_F)?sandbox.__CONTENT_BASE_F:[];
  const expansion=sandbox.FISH_TARGET_METHOD_EXPANSION_V1||{targets:[],existing:{}};
  const existing=expansion.existing&&typeof expansion.existing==='object'?expansion.existing:{};
  const targetList=Array.isArray(expansion.targets)?expansion.targets:[];
  const records=[];
  const names=new Set();
  const push=(name,water,methods,origin)=>{
    name=text(name);
    if(!name)throw new Error(`content model ${origin} has blank species name`);
    if(names.has(name))throw new Error(`content model duplicate species name: ${name}`);
    names.add(name);
    const normalized=(methods||[]).map((method,index)=>({
      id:text(method?.id)||(index===0?'default':`method-${index}`),
      method:text(method?.method),
      style:text(method?.style)
    }));
    records.push({name,water:text(water),origin,methods:normalized,plan_count:normalized.length});
  };

  for(const fish of base){
    const methods=[{id:'default',method:fish.method,style:fish.style},...(Array.isArray(existing[fish.name])?existing[fish.name]:[])];
    push(fish.name,fish.water,methods,'base');
  }
  for(const target of targetList){
    const methods=[...(Array.isArray(target.methods)?target.methods:[]),...(Array.isArray(existing[target.name])?existing[target.name]:[])];
    push(target.name,target.water,methods,'expansion');
  }

  const dangling=Object.keys(existing).filter(name=>!names.has(name));
  return {records,dangling};
}

function summarizeContent(model){
  const methodUsage=new Map(),styleUsage=new Map(),waterUsage=new Map();
  for(const row of model.records){
    waterUsage.set(row.water,(waterUsage.get(row.water)||0)+1);
    for(const method of row.methods){
      const label=method.method||'(blank)';
      methodUsage.set(label,(methodUsage.get(label)||0)+1);
      const style=method.style||'(blank)';
      styleUsage.set(style,(styleUsage.get(style)||0)+1);
    }
  }
  const sortedUsage=map=>Object.fromEntries([...map].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ja')));
  const coverage=model.records
    .map(row=>({species:row.name,plans:row.plan_count,methods:row.methods.map(method=>method.method).filter(Boolean)}))
    .sort((a,b)=>a.plans-b.plans||a.species.localeCompare(b.species,'ja'));
  return {
    species:model.records.length,
    plans:model.records.reduce((sum,row)=>sum+row.plan_count,0),
    coverage,
    one_plan:coverage.filter(row=>row.plans===1),
    two_or_fewer:coverage.filter(row=>row.plans<=2),
    method_usage:sortedUsage(methodUsage),
    style_usage:sortedUsage(styleUsage),
    water_usage:sortedUsage(waterUsage),
    dangling_existing:model.dangling
  };
}

function validateQueue(queue,currentNames){
  const errors=[];
  if(!queue||typeof queue!=='object'||Array.isArray(queue))return ['queue root must be an object'];
  if(queue.version!=='CONTENT-EXPANSION-QUEUE-1')errors.push('queue.version must be CONTENT-EXPANSION-QUEUE-1');
  if(!['ready-for-input','researching','review-ready','applied'].includes(queue.state))errors.push('queue.state is invalid');
  for(const key of ['species_candidates','method_candidates','catalog_candidates'])if(!Array.isArray(queue[key]))errors.push(`${key} must be an array`);
  if(errors.length)return errors;

  const newSpeciesNames=new Set(),newSpeciesIds=new Set();
  for(const [index,row] of queue.species_candidates.entries()){
    const label=`species_candidates[${index}]`,name=text(row?.display_name_ja),id=text(row?.species_id);
    if(!PRIORITIES.has(text(row?.priority)))errors.push(`${label}.priority must be P0/P1/P2`);
    if(!SPECIES_ID.test(id))errors.push(`${label}.species_id must be a stable lowercase slug`);
    if(!name)errors.push(`${label}.display_name_ja is required`);
    if(currentNames.has(name))errors.push(`${label} duplicates current species: ${name}`);
    if(newSpeciesNames.has(name))errors.push(`${label} duplicates queued species name: ${name}`);else if(name)newSpeciesNames.add(name);
    if(newSpeciesIds.has(id))errors.push(`${label} duplicates queued species_id: ${id}`);else if(id)newSpeciesIds.add(id);
    if(!text(row?.rationale))errors.push(`${label}.rationale is required`);
    if(!Array.isArray(row?.evidence_urls)||row.evidence_urls.length<1||row.evidence_urls.some(url=>!HTTP.test(text(url))))errors.push(`${label}.evidence_urls must contain https evidence`);
  }

  const methodKeys=new Set();
  for(const [index,row] of queue.method_candidates.entries()){
    const label=`method_candidates[${index}]`,species=text(row?.species),id=text(row?.method_id);
    if(!PRIORITIES.has(text(row?.priority)))errors.push(`${label}.priority must be P0/P1/P2`);
    if(!species)errors.push(`${label}.species is required`);
    if(species&&!currentNames.has(species)&&!newSpeciesNames.has(species))errors.push(`${label}.species is not current or queued: ${species}`);
    if(!ID.test(id)||id==='default')errors.push(`${label}.method_id must be a non-default stable lowercase id`);
    const key=`${canonical(species)}|${id}`;
    if(methodKeys.has(key))errors.push(`${label} duplicates queued species/method_id: ${key}`);else methodKeys.add(key);
    if(!text(row?.display_name_ja))errors.push(`${label}.display_name_ja is required`);
    if(!text(row?.rationale))errors.push(`${label}.rationale is required`);
    if(!Array.isArray(row?.evidence_urls)||row.evidence_urls.length<1||row.evidence_urls.some(url=>!HTTP.test(text(url))))errors.push(`${label}.evidence_urls must contain https evidence`);
  }

  const batchIds=new Set();
  for(const [index,row] of queue.catalog_candidates.entries()){
    const label=`catalog_candidates[${index}]`,batchId=text(row?.batch_id);
    if(!PRIORITIES.has(text(row?.priority)))errors.push(`${label}.priority must be P0/P1/P2`);
    if(!/^[a-z0-9][a-z0-9-]*$/.test(batchId))errors.push(`${label}.batch_id must be lowercase kebab-case`);
    if(batchIds.has(batchId))errors.push(`${label} duplicates batch_id: ${batchId}`);else if(batchId)batchIds.add(batchId);
    if(!text(row?.maker))errors.push(`${label}.maker is required`);
    if(!Array.isArray(row?.categories)||row.categories.length<1||row.categories.some(category=>!CATEGORIES.has(text(category))))errors.push(`${label}.categories must contain only rod/reel`);
    if(text(row?.stage)!=='research')errors.push(`${label}.stage must remain research at candidate stage`);
    if(row?.publication_ready!==false)errors.push(`${label}.publication_ready must be false`);
    if(!text(row?.rationale))errors.push(`${label}.rationale is required`);
    if(!Array.isArray(row?.source_urls)||row.source_urls.length<1||row.source_urls.some(url=>!HTTP.test(text(url))))errors.push(`${label}.source_urls must contain https evidence`);
  }
  return errors;
}

export async function collectReadiness(){
  const requiredFiles=[
    'authoring/species-methods.v1.json',
    'scripts/species-method-authoring.mjs',
    'scripts/catalog-ingest.mjs',
    'scripts/fish-asset-authoring.mjs',
    'catalog-batch-manifest.json',
    'species-method-authoring-runtime.js',
    'species-registry.js',
    'method-registry.js',
    'resolver-engine.js'
  ];
  const missing=[];
  for(const file of requiredFiles)if(!(await exists(file)))missing.push(file);

  const queue=await json('authoring/content-expansion-queue.v1.json');
  const model=await loadContentModel();
  const content=summarizeContent(model);
  const manifest=await json('catalog-batch-manifest.json');
  const batches=Array.isArray(manifest.batches)?manifest.batches:[];
  const catalog={
    batches:batches.length,
    expected_rows:batches.reduce((sum,batch)=>sum+Number(batch.expected_rows||0),0),
    makers:new Set(batches.map(batch=>text(batch.maker)).filter(Boolean)).size,
    research_batches:batches.filter(batch=>batch.stage==='research').length,
    production_batches:batches.filter(batch=>batch.stage==='production').length,
    source_input_batches:batches.filter(batch=>text(batch.source_input)).length
  };
  const baseline=queue.baseline_lock||{};
  const errors=[...validateQueue(queue,new Set(content.coverage.map(row=>row.species)))];
  if(content.dangling_existing.length)errors.push(`dangling existing-method blocks: ${content.dangling_existing.join(', ')}`);
  if(missing.length)errors.push(`missing pipeline files: ${missing.join(', ')}`);
  for(const [key,actual] of [['species',content.species],['plans',content.plans],['catalog_batches',catalog.batches],['catalog_expected_rows',catalog.expected_rows]]){
    if(Number(baseline[key])!==actual)errors.push(`baseline_lock.${key} expected ${baseline[key]} but current is ${actual}`);
  }
  const counts={
    species:queue.species_candidates.length,
    methods:queue.method_candidates.length,
    catalog:queue.catalog_candidates.length
  };
  const queued=counts.species+counts.methods+counts.catalog;
  return {
    version:'CONTENT-EXPANSION-READINESS-1',
    ready_for_input:errors.length===0,
    doorstep_locked:errors.length===0&&queued===0&&queue.state==='ready-for-input',
    queue:{state:queue.state,counts,total:queued},
    baseline:{species:content.species,plans:content.plans},
    coverage:{one_plan_count:content.one_plan.length,two_or_fewer_count:content.two_or_fewer.length,one_plan:content.one_plan,two_or_fewer:content.two_or_fewer,method_usage:content.method_usage,style_usage:content.style_usage,water_usage:content.water_usage},
    catalog,
    pipeline:{missing,required:requiredFiles},
    errors
  };
}

async function main(){
  const report=await collectReadiness();
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else{
    console.log(`CONTENT EXPANSION READINESS ${report.ready_for_input?'PASS':'FAIL'} · species ${report.baseline.species} · plans ${report.baseline.plans} · catalog ${report.catalog.batches}/${report.catalog.expected_rows} · one-plan ${report.coverage.one_plan_count} · <=2 plans ${report.coverage.two_or_fewer_count} · queued ${report.queue.total}`);
    if(report.doorstep_locked)console.log('DOORSTEP READY · candidate queues empty · no runtime content added');
    if(report.coverage.one_plan.length)console.log(`ONE-PLAN SPECIES · ${report.coverage.one_plan.map(row=>row.species).join(' / ')}`);
    for(const error of report.errors)console.error(`ERROR · ${error}`);
  }
  if(report.errors.length)process.exitCode=1;
}

if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))await main();
