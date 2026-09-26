import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {loadContentModel} from './content-expansion-readiness.mjs';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const CORE_REQUIRED=Object.freeze(['plan-rod','plan-reel','plan-line','plan-rig','plan-first-cast']);

export async function collectTripReadiness(){
  const model=await loadContentModel();
  const speciesMeta=new Map(model.records.map(row=>[row.name,{name:row.name,water:row.water,styles:[...new Set(row.methods.map(method=>method.style).filter(Boolean))],tags:[]} ]));
  const context=vm.createContext({console,FISH_TARGET_SPECIES_REGISTRY:{resolve:name=>speciesMeta.get(name)||null}});
  context.globalThis=context;
  vm.runInContext(read('trip-pack-rules-v34.js'),context,{filename:'trip-pack-rules-v34.js'});
  const rules=context.FISH_TARGET_TRIP_PACK;
  const plans=model.records.flatMap(row=>row.methods.map(method=>({
    plan_id:`${row.name}:${method.id}`,
    species_name:row.name,
    method:method.method,
    style:method.style,
    requirements:{rod:method.rod,reel:method.reel,line:method.line,leader:method.leader,rig:method.rig},
    first_cast:{bait:method.bait,size:method.size},
    places:[]
  })));
  const coverage=plans.map(plan=>{
    const items=rules.derive(plan,{ownedSet:null});
    const ids=new Set(items.map(item=>item.id));
    const missing=CORE_REQUIRED.filter(id=>!ids.has(id));
    return {
      plan_id:plan.plan_id,
      species:plan.species_name,
      method:plan.method,
      style:plan.style,
      required:items.filter(item=>item.priority==='required').length,
      total:items.length,
      missing,
      has_spare:ids.has('plan-spare'),
      has_line_cutter:ids.has('handling-line-cutter'),
      has_pliers:ids.has('handling-pliers'),
      has_landing:ids.has('handling-landing')
    };
  });
  const incomplete=coverage.filter(row=>row.missing.length);
  const lurePlans=coverage.filter(row=>row.style==='lure');
  const min=(key,rows=coverage)=>rows.length?Math.min(...rows.map(row=>row[key])):0;
  const max=(key,rows=coverage)=>rows.length?Math.max(...rows.map(row=>row[key])):0;
  return {
    version:'TRIP-READINESS-AUDIT-V34',
    plans:coverage.length,
    core_ready:coverage.length-incomplete.length,
    core_incomplete:incomplete.length,
    required_count:{min:min('required'),max:max('required')},
    total_item_count:{min:min('total'),max:max('total')},
    spare_plans:coverage.filter(row=>row.has_spare).length,
    line_cutter_plans:coverage.filter(row=>row.has_line_cutter).length,
    lure_plans:lurePlans.length,
    lure_pliers_plans:lurePlans.filter(row=>row.has_pliers).length,
    landing_plans:coverage.filter(row=>row.has_landing).length,
    incomplete_plans:incomplete
  };
}

export {CORE_REQUIRED};
