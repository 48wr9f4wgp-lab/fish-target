import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const simplify=readFileSync(new URL('../simplify.js',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
const pwaCss=readFileSync(new URL('../pwa.css',import.meta.url),'utf8');

test('home metrics come from live registries before the UI is revealed',()=>{
  assert.match(simplify,/FISH_TARGET_SPECIES_REGISTRY\?\.records\?\.length/);
  assert.match(simplify,/FISH_TARGET_METHOD_REGISTRY\?\.count/);
  assert.match(simplify,/ゲームプラン/);
  assert.ok(pwa.indexOf("loadScript('./simplify.js'")<pwa.indexOf('await reveal()'),'home metric sync must load before ft-ready reveal');
  assert.match(pwaCss,/html:not\(\.ft-ready\) \.app\{visibility:hidden/,'stale static placeholders must stay hidden during bootstrap');
});
