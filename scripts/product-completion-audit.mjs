import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const readJson=file=>JSON.parse(read(file));
const context=vm.createContext({console});
context.globalThis=context;
const run=(file,append='')=>vm.runInContext(`${read(file)}${append}`,context,{filename:file});
const text=value=>String(value??'').trim();

run('data.js','\n;globalThis.__PRODUCT_BASE_F=F;');
for(const version of [1,2,3,4]){
  for(let part=1;part<=5;part++)run(`target-method-data-v${version}-part${part}.js`);
  run(`target-method-data-v${version}.js`);
}
run('species-method-authoring-generated.js');
run('species-method-authoring-runtime.js');

const base=Array.isArray(context.__PRODUCT_BASE_F)?context.__PRODUCT_BASE_F:[];
const expansion=context.FISH_TARGET_METHOD_EXPANSION_V1||{targets:[],existing:{}};
const existing=expansion.existing&&typeof expansion.existing==='object'?expansion.existing:{};
const targets=Array.isArray(expansion.targets)?expansion.targets:[];
const species=[];
const plans=[];
const names=new Set();

function pushSpecies(name,water,methods){
  name=text(name);
  if(!name||names.has(name))throw new Error(`Invalid/duplicate species in product audit: ${name||'(blank)'}`);
  names.add(name);species.push({name,water:text(water)});
  methods.forEach((method,index)=>plans.push({
    plan_id:`${name}:${text(method?.id)||(index===0?'default':`method-${index}`)}`,
    species_name:name,
    method:text(method?.method),
    rod:text(method?.rod),reel:text(method?.reel),line:text(method?.line),leader:text(method?.leader),rig:text(method?.rig),
    bait:text(method?.bait),size:text(method?.size)
  }));
}

for(const fish of base){
  pushSpecies(fish.name,fish.water,[fish,...(Array.isArray(existing[fish.name])?existing[fish.name]:[])]);
}
for(const target of targets){
  pushSpecies(target.name,target.water,Array.isArray(target.methods)?target.methods:[]);
}

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
