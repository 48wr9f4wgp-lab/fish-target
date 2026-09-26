import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
test('trip conditions has a dedicated fish-scoped view and compact result summary',()=>{
  const html=text('index.html'),page=text('conditions-page-v34.js'),history=text('navigation-history-v34.js'),simplify=text('simplify.js');
  assert.match(html,/id="conditions"/);
  assert.match(html,/id="conditionsTeaser"/);
  assert.match(html,/id="conditionsOpenBtn"/);
  assert.match(page,/moveWithHeading\(\$\('\.fieldLive'\),liveMount\)/);
  assert.match(page,/conditionsDecisionSst/);
  assert.match(history,/views=\['home','result','saved','conditions','fieldmode'\]/);
  assert.match(history,/\['result','conditions','fieldmode'\]/);
  assert.match(simplify,/!dedicatedConditions&&!fieldLive\.closest/);
});
test('conditions extension is shipped in the offline shell',()=>{
  const pwa=text('pwa.js'),build=text('scripts/build.mjs');
  assert.match(pwa,/conditions-page-v34\.css/);
  assert.match(pwa,/conditions-page-v34\.js/);
  assert.match(build,/'conditions-page-v34\.css'/);
  assert.match(build,/'conditions-page-v34\.js'/);
});