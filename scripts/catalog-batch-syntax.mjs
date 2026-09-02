import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
if(!Array.isArray(manifest.batches))throw new Error('catalog manifest batches required');
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
for(const file of files){
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
for(const batch of manifest.batches){
  if(!batch.source_input)continue;
  JSON.parse(readFileSync(new URL(`../${batch.source_input}`,import.meta.url),'utf8'));
}
console.log(`CATALOG BATCH SYNTAX PASS · ${manifest.batches.length} batches / ${files.length} runtime files`);
