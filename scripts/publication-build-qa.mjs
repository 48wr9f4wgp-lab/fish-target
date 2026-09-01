import {access,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const manifest=JSON.parse(await readFile(path.join(root,'catalog-batch-manifest.json'),'utf8'));
const productionBatches=manifest.batches.filter(batch=>batch.stage==='production');
const researchFiles=[...new Set(manifest.batches.filter(batch=>batch.stage==='research').flatMap(batch=>batch.files||[]))];
const exists=async file=>access(path.join(dist,file)).then(()=>true,()=>false);
const runBuild=publication=>{
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{
    cwd:root,
    env:{...process.env,FISH_TARGET_PUBLICATION_BUILD:publication?'1':'0'},
    stdio:'inherit'
  });
  if(result.status!==0)throw new Error(`${publication?'publication':'research'} build failed with ${result.status}`);
};

let primaryError=null;
try{
  runBuild(true);
  const html=await readFile(path.join(dist,'index.html'),'utf8');
  const runtimeExpected=productionBatches.length>0;
  if(!html.includes(`data-catalog-runtime="${runtimeExpected?'on':'off'}"`))throw new Error('publication catalog runtime marker mismatch');
  if(!(await exists('catalog-loader.js')))throw new Error('publication build must retain fail-closed catalog loader');
  if(!(await exists('tackle.js')))throw new Error('publication build must retain MY TACKLE manual fallback');
  if(await exists('catalog-fixtures.js'))throw new Error('synthetic catalog fixtures leaked into publication build');
  for(const file of researchFiles){if(await exists(file))throw new Error(`research catalog batch leaked into publication build: ${file}`)}
  if(runtimeExpected){
    if(!(await exists('catalog-batch-manifest.json')))throw new Error('publication manifest missing with production batches');
    const published=JSON.parse(await readFile(path.join(dist,'catalog-batch-manifest.json'),'utf8'));
    if(published.batches.length!==productionBatches.length||published.batches.some(batch=>batch.stage!=='production'))throw new Error('publication manifest is not production-only');
  }else{
    for(const file of ['catalog-batch-manifest.json','catalog-providers.js','catalog-adapters.js','catalog-research.js','catalog.js']){
      if(await exists(file))throw new Error(`catalog runtime leaked with zero production batches: ${file}`);
    }
  }
  console.log(`PUBLICATION BUILD QA PASS · production batches ${productionBatches.length} · research files excluded ${researchFiles.length}`);
}catch(error){primaryError=error}finally{
  try{
    runBuild(false);
    const html=await readFile(path.join(dist,'index.html'),'utf8');
    if(!html.includes('data-catalog-runtime="on"'))throw new Error('research build restore did not re-enable catalog runtime');
    if(!(await exists('catalog-batch-manifest.json')))throw new Error('research build restore missing catalog manifest');
  }catch(error){if(!primaryError)primaryError=error;else console.error(error)}
}
if(primaryError)throw primaryError;
