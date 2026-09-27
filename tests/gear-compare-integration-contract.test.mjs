import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('gear-compare-v1.js');
test('comparison entry stays outside collapsed Home filters and uses shared stylesheet readiness',()=>{const pwa=read('pwa.js');assert.match(source,/homeBody=byId\('home'\)\?\.querySelector\('\.body'\)/);assert.match(source,/homeUtilities\.after\(home\)/);assert.doesNotMatch(source,/querySelector\('\.filterPanel'\)\?\.after\(home\)/);assert.ok(pwa.indexOf("['./gear-compare-v1.css','gear-compare-v1-css']")>pwa.indexOf('const extensionStyles=['));assert.ok(pwa.indexOf("['./gear-compare-v1.css','gear-compare-v1-css']")<pwa.indexOf('const extensionCss='));assert.equal((pwa.match(/gear-compare-v1\.css/g)||[]).length,1);});
