import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');

test('catalog preview labels official research accurately instead of synthetic',()=>{
  const source=read('tackle.js');
  assert.match(source,/公式スペック参照/);
  assert.doesNotMatch(source,/\$\{esc\(p\.maker\)\} · SYNTHETIC/);
  assert.match(source,/s\.sinker_load_raw/,'native sinker load can be shown without gram conversion');
});

test('MY TACKLE recognizes XXH and XXXH as heavy rod power classes',()=>{
  const context=vm.createContext({console});
  const source=read('tackle.js').split('  const best=')[0]+'\n})();';
  vm.runInContext(source,context,{filename:'tackle.js'});
  const logic=context.FISH_TARGET_TACKLE_LOGIC;
  const xxh=logic.rodFit({length:7,power:'XXH',maxLure:130},{rod:'7ft / XXH',style:'lure',size:'100g'},null);
  assert.equal(xxh.level,0);
  const xxxh=logic.rodFit({length:7,power:'XXXH',maxLure:200},{rod:'7ft / XXXH',style:'lure',size:'150g'},null);
  assert.equal(xxxh.level,0);
});
