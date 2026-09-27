import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const source=read('gear-compare-v1.js');
const ctx=vm.createContext({module:{exports:{}},URL});vm.runInContext(source,ctx);
const E=ctx.module.exports;
const dir=existsSync(new URL('catalog-batch-manifest.json',root))?'':'dist/';
const catalogCtx=vm.createContext({console});
const manifest=JSON.parse(read(dir+'catalog-batch-manifest.json'));
for(const f of new Set(['catalog-providers.js','catalog-adapters.js',...manifest.batches.flatMap(b=>b.files),'catalog-research.js','catalog-fixtures.js','catalog.js']))vm.runInContext(read(dir+f),catalogCtx,{filename:f});
const original=catalogCtx.FISH_TARGET_CATALOG.products,raw=JSON.stringify(original),rows=E.normalizeAll(original);
const get=s=>rows.find(p=>p.id.endsWith(s)),legalis=get('legalis:2023:lt5000-cxh'),nasci=get('nasci:unknown:c5000xg');
const plain=o=>JSON.parse(JSON.stringify(o));

test('comparison normalizes the existing catalog without editing owned/canonical records',()=>{assert.equal(rows.length,971);assert.equal(rows.filter(p=>p.category==='reel').length,254);assert.equal(rows.filter(p=>p.category==='rod').length,717);assert.equal(JSON.stringify(original),raw);assert.equal(rows.filter(p=>p.price).length,9);assert.equal(E.normalizeAll(null).length,0);});
for(const v of [null,undefined,'',true,false,'not a number',Infinity])test(`unknown number is not zero: ${String(v)}`,()=>assert.equal(E.number(v),null));
test('legitimate numeric zero remains a number',()=>assert.equal(E.number('0'),0));
test('only exact checked SKUs receive maker price, source, date and field evidence',()=>{assert.equal(legalis.price.amount,15100);assert.equal(nasci.price.amount,16000);assert.equal(nasci.price.basis,'maker_list_ex_tax');assert.equal(nasci.generation,'unknown');assert.equal(nasci.specs.retrieve_cm,105);assert.equal(nasci.evidence.checked_at,'2026-09-27');});
test('JAN conflicts fail closed instead of joining by a similar model name',()=>{const p=E.normalize({...legalis.source_product,identifiers:{jan:'wrong'}});assert.equal(p.price,null);assert.equal(p.family,null);assert.match(p.issues.join(),/JAN/);});
test('unverified manufacturer prices stay unknown',()=>{const p=rows.find(p=>p.maker==='ABU GARCIA');assert.ok(p);assert.equal(p.price,null);assert.equal(E.compareValue(p,'price'),null);});
test('typed PE capacity reads gauge and metres without extrapolation',()=>{assert.deepEqual(plain(E.capacities('1.5-430, 2-300, 2.5-260')),[{pe:1.5,m:430},{pe:2,m:300},{pe:2.5,m:260}]);assert.equal(E.capacity(legalis,2),300);assert.equal(E.capacity(legalis,1),null);});
for(const raw of ['ナイロン 2-300','20lb-300m','0.25mm-300m','フロロ 2-300','2-200,2-300',''])test('ambiguous or non-PE capacity is not silently converted: '+raw,()=>assert.equal(E.capacities(raw).length,0));
test('PE pair is a required pair and zero/negative inputs are rejected',()=>{assert.match(E.validateCriteria({pe:2}),/両方/);assert.match(E.validateCriteria({budget:-1}),/0より/);assert.match(E.validateCriteria({weight:0}),/0より/);assert.match(E.validateCriteria({lengthMin:4,lengthMax:3}),/下限/);assert.equal(E.validateCriteria({pe:2,metres:300}),'');});
test('required capacity evaluates exact gauge only; budget is a hard bound',()=>{assert.equal(E.requirements(legalis,{pe:2,metres:300}).status,'pass');assert.equal(E.requirements(legalis,{pe:2,metres:301}).status,'fail');assert.equal(E.requirements(legalis,{pe:1,metres:100}).status,'unknown');assert.equal(E.requirements(legalis,{budget:15000}).status,'fail');});
test('unknown specs require an explicit include-unknown option when filtering',()=>{const subset=[legalis,{...legalis,id:'unknown',price:null}];assert.equal(E.filter(subset,{budget:20000}).length,1);assert.equal(E.filter(subset,{budget:20000,includeUnknown:true}).length,2);assert.equal(E.filter(subset,{band:'under20',includeUnknown:true}).length,1);});
test('Japanese product aliases and manufacturer/category filters work across data sources',()=>{const a=E.filter(rows,{category:'reel',query:'ダイワ レガリス 5000'});assert.equal(a.length,1);assert.equal(a[0].id,legalis.id);assert.ok(E.filter(rows,{category:'rod',maker:'SHIMANO'}).every(p=>p.category==='rod'&&p.maker==='SHIMANO'));});
test('price band is maker MSRP, not manufacturer rank or a quality score',()=>{const a=E.filter(rows,{category:'reel',band:'under20'});assert.equal(a.length,5);assert.ok(a.every(p=>p.price.amount<20000));assert.equal(E.filter(rows,{band:'over70'}).length,2);assert.equal(E.filter(rows,{band:'unknown'}).length,962);});
test('null prices sort last, never as free products',()=>{const a=E.filter(rows,{category:'reel',sort:'price'});assert.equal(a[0].price.amount,14600);assert.equal(a.at(-1).price,null);});
test('length_m beats ambiguous decimal-feet values',()=>{assert.equal(E.lengthMetres({length_m:3.2,length_ft:10.6}).value,3.2);assert.equal(E.lengthMetres({length_ft:9.6}).value,null);assert.ok(Math.abs(E.lengthMetres({length_raw:`9'6"`}).value-2.8956)<1e-8);});
test('jig MAX cannot be used as plug/casting lure MAX',()=>{const p={category:'rod',price:null,length_m:3,specs:{lure_min_g:null,lure_max_g:null,jig_max_g:80}};assert.equal(E.requirements(p,{lure:60}).status,'unknown');assert.equal(E.requirements({...p,specs:{lure_min_g:10,lure_max_g:50,jig_max_g:80}},{lure:60}).status,'fail');});
test('same reel number or higher max drag is not a reason for auto-equivalence',()=>{assert.deepEqual(plain(E.similar({...legalis,family:null},rows)),[]);const a=E.similar(legalis,rows,{category:'reel'});assert.ok(a.length>0);assert.ok(a.every(m=>m.product.maker!==legalis.maker&&m.product.family===legalis.family&&m.reasons.length===3));assert.ok(a.some(m=>m.product.id===nasci.id));assert.ok(a.every(m=>!m.reasons.join().includes('ドラグ')));});
test('auto-alternatives with incompatible type, missing matching PE or insufficient specification evidence are excluded',()=>{assert.equal(E.similar(legalis,[{...nasci,family:'sw_heavy'},{...nasci,capacities:[]},{...nasci,specs:{weight_g:null}}]).length,0);assert.equal(E.similar(legalis,rows,{budget:15000}).length,0);});
test('publication mode creates neither UI nor a new data lookup',()=>{for(const dataset of [{publicationBuild:'on'},{catalogPublication:'on'},{catalogRuntime:'off'}]){const c=vm.createContext({document:{documentElement:{dataset}},URL});vm.runInContext(source,c);assert.equal(c.FISH_TARGET_GEAR_COMPARE,undefined);assert.equal(c.FISH_TARGET_GEAR_COMPARE_ENGINE,undefined);}});
test('invalid links and synthetic products cannot enter the comparison',()=>{assert.equal(E.https('javascript:alert(1)'),null);assert.equal(E.normalize({...legalis.source_product,source:{source_type:'synthetic',source_url:'https://example.com'}}),null);assert.equal(E.normalize({...legalis.source_product,source:{source_url:'data:text/html,a'}}),null);});
test('new assets are excluded from publication output and loaded before history binding in preview',()=>{const build=read('scripts/build.mjs'),pwa=read('pwa.js');assert.ok(build.includes("...(publicationBuild?[]:['gear-compare-v1.js','gear-compare-v1.css'])"));assert.ok(pwa.indexOf("loadScript('./gear-compare-v1.js'")<pwa.indexOf("loadScript('./navigation-history-v34.js'"));assert.match(pwa,/dataset\.publicationBuild!=='on'/);});

test('product-first alternatives do not inherit a maker or exact model search that would exclude other makers',()=>{assert.ok(E.similar(legalis,rows,{category:'reel',query:'レガリス 5000',maker:'DAIWA'}).some(m=>m.product.id===nasci.id));});

test('invalid comparison criteria clear stale comparison output and disable actions in UI source',()=>{
  assert.match(source,/if\(error\)\{[^}]*gcComparison[^}]*hidden=true/);
  assert.match(source,/gcTable'\)\.replaceChildren\(\)/);
  assert.match(source,/gcQuickCompare'\)\.disabled=true/);
});
