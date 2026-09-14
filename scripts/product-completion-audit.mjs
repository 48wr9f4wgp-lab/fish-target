import {readFileSync} from 'node:fs';
import vm from 'node:vm';
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
  style:method.style,
  rod:method.rod,reel:method.reel,line:method.line,leader:method.leader,rig:method.rig,bait:method.bait,size:method.size
})));

const catalog=readJson('catalog-batch-manifest.json');
const lureCatalog=readJson('lure-catalog-manifest.json');
const fishAssets=readJson('authoring/fish-assets.v1.json');
const policy=readJson('authoring/product-completion-policy.v1.json');

const lureSandbox={};lureSandbox.globalThis=lureSandbox;
for(const batch of lureCatalog.batches)vm.runInNewContext(read(batch.file),lureSandbox,{filename:batch.file});
const lureRows=Array.isArray(lureSandbox.FISH_TARGET_LURE_CATALOG_BATCH_ROWS)
  ?lureSandbox.FISH_TARGET_LURE_CATALOG_BATCH_ROWS.flatMap(batch=>Array.isArray(batch?.rows)?batch.rows:[])
  :[];

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
const lurePlans=plans.filter(plan=>plan.style==='lure');
const lurePlanCoverage=lurePlans.map(plan=>{
  const candidates=lureRows.filter(row=>Array.isArray(row?.targets)&&row.targets.includes(plan.species_name)&&(!Array.isArray(row.methods)||!row.methods.length||row.methods.includes(plan.method)));
  return {plan_id:plan.plan_id,species:plan.species_name,method:plan.method,candidates:candidates.length,makers:[...new Set(candidates.map(row=>text(row.maker)).filter(Boolean))]};
});
const lureCovered=lurePlanCoverage.filter(row=>row.candidates>0);
const lureUncovered=lurePlanCoverage.filter(row=>row.candidates===0);
const makerNeutralCovered=lureCovered.filter(row=>row.makers.length>=2);
const pct=(value,total)=>total?Math.round(value/total*1000)/10:0;

const report={
  version:'PRODUCT-COMPLETION-AUDIT-V34',
  policy:policy.version,
  species:{total:species.length,bundled:bundledNames.size,uncovered:uncoveredFish.length},
  plans:{total:plans.length,critical_complete:plans.length-criticalMissing.length,critical_missing:criticalMissing.length},
  catalog:{batches:catalog.batches.length,expected_rows:expectedRows,stages:stageCounts},
  lure_catalog:{
    batches:lureCatalog.batches.length,
    rows:lureRows.length,
    targets:lureTargets.length,
    lure_plans:lurePlans.length,
    covered_plans:lureCovered.length,
    coverage_pct:pct(lureCovered.length,lurePlans.length),
    maker_neutral_plans:makerNeutralCovered.length,
    maker_neutral_pct:pct(makerNeutralCovered.length,lurePlans.length)
  },
  fish_rights:fishRights,
  critical_missing_plans:criticalMissing,
  uncovered_lure_plans:lureUncovered,
  uncovered_fish:uncoveredFish
};

console.log(JSON.stringify(report,null,2));

if(species.length!==63)throw new Error(`Expected 63 species, got ${species.length}`);
if(plans.length!==158)throw new Error(`Expected 158 plans, got ${plans.length}`);
if(criticalMissing.length)throw new Error(`Technical plan coverage has ${criticalMissing.length} critical gaps`);
if(!catalog.batches.length)throw new Error('Catalog manifest is empty');
if(!fishAssets.assets.length)throw new Error('Fish asset authoring is empty');
if(lureRows.some(row=>row.publication_ready!==false))throw new Error('V34 lure research contains a publication-ready row before promotion review');
