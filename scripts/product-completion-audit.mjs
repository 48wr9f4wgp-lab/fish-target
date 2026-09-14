import {readFileSync} from 'node:fs';
import {loadContentModel} from './content-expansion-readiness.mjs';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const readJson=file=>JSON.parse(read(file));
const text=value=>String(value??'').trim();

const model=await loadContentModel();
const species=model.records.map(row=>({name:row.name,water:row.water}));
const plans=model.records.flatMap(row=>row.methods.map(method=>({
  plan_id:`${row.name}:${method.id}`,
  species_name:row.name,
  method:method.method,
  rod:method.rod,reel:method.reel,line:method.line,leader:method.leader,rig:method.rig,bait:method.bait,size:method.size
})));

const catalog=readJson('catalog-batch-manifest.json');
const lureCatalog=readJson('lure-catalog-manifest.json');
const fishAssets=readJson('authoring/fish-assets.v1.json');
const policy=readJson('authoring/product-completion-policy.v1.json');

const criticalMissing=plans.map(plan=>{
  const missing=[];
  if(!plan.rod)missing.push('rod');
  if(!plan.reel)missing.push('reel');
  if(!plan.line)missing.push('main_line');
  if(!plan.rig)missing.push('terminal');
  if(!plan.bait)missing.push('first_cast');
  return missing.length?{plan_id:plan.plan_id,species:plan.species_name,method:plan.method,missing}:null;
}).filter(Boolean);

const stageCounts=catalog.batches.reduce((acc,batch)=>{const stage=text(batch.stage)||'unknown';acc[stage]=(acc[stage]||0)+1;return acc},{});
const expectedRows=catalog.batches.reduce((sum,batch)=>sum+(Number(batch.expected_rows)||0),0);
const fishRights=fishAssets.assets.reduce((acc,asset)=>{const status=text(asset.rights_status)||'unknown';acc[status]=(acc[status]||0)+1;return acc},{});
const bundledNames=new Set(fishAssets.assets.map(asset=>text(asset.species_name)).filter(Boolean));
const uncoveredFish=species.map(entry=>entry.name).filter(name=>!bundledNames.has(name));
const lureTargets=[...new Set(lureCatalog.batches.flatMap(batch=>Array.isArray(batch.targets)?batch.targets:[]).map(text).filter(Boolean))];

const report={
  version:'PRODUCT-COMPLETION-AUDIT-V34',
  policy:policy.version,
  species:{total:species.length,bundled:bundledNames.size,uncovered:uncoveredFish.length},
  plans:{total:plans.length,critical_complete:plans.length-criticalMissing.length,critical_missing:criticalMissing.length},
  catalog:{batches:catalog.batches.length,expected_rows:expectedRows,stages:stageCounts},
  lure_catalog:{batches:lureCatalog.batches.length,targets:lureTargets.length},
  fish_rights:fishRights,
  critical_missing_plans:criticalMissing,
  uncovered_fish:uncoveredFish
};

console.log(JSON.stringify(report,null,2));

if(species.length!==63)throw new Error(`Expected 63 species, got ${species.length}`);
if(plans.length!==158)throw new Error(`Expected 158 plans, got ${plans.length}`);
if(criticalMissing.length)throw new Error(`Technical plan coverage has ${criticalMissing.length} critical gaps`);
if(!catalog.batches.length)throw new Error('Catalog manifest is empty');
if(!fishAssets.assets.length)throw new Error('Fish asset authoring is empty');
