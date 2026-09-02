import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

function recommendationContext() {
  const context = vm.createContext({console});
  vm.runInContext(read('data.js'), context, {filename: 'data.js'});
  const appSource = read('app.js').split("if($('spotSearchBtn'))")[0];
  vm.runInContext(appSource, context, {filename: 'app.js'});
  return context;
}

function evaluate(context, source) {
  return vm.runInContext(source, context);
}

test('all 19 targets have complete canonical recommendation plans', () => {
  const context = recommendationContext();
  const diagnostics = evaluate(context, `F.map(f=>{
    cur=f;
    state={place:'おすすめ',season:'秋',goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false};
    const p=basePlan(),cast=currentRotation(p);
    return {name:f.name,method:p.method,cast,rod:p.rod,reel:p.reel,line:p.line,leader:p.leader,steps:p.steps};
  })`);
  assert.equal(diagnostics.length, 19);
  for (const item of diagnostics) {
    assert.ok(item.method, `${item.name}: method`);
    assert.ok(item.cast?.name && item.cast?.size && item.cast?.range && item.cast?.action, `${item.name}: FIRST CAST`);
    assert.ok(item.rod, `${item.name}: rod`);
    assert.ok(item.reel, `${item.name}: reel`);
    assert.ok(item.line, `${item.name}: line`);
    assert.ok(item.leader, `${item.name}: leader`);
    assert.equal(item.steps?.length, 3, `${item.name}: 3 steps`);
    assert.ok(item.steps.every(Boolean), `${item.name}: non-empty steps`);
  }
});

test('RC blocker recommendations are canonical without accuracy.js', () => {
  const context = recommendationContext();
  const cases = evaluate(context, `(()=>{
    const plan=(name,place='おすすめ')=>{
      cur=F.find(f=>f.name===name);
      state={place,season:'秋',goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false};
      const p=basePlan();return {style:p.style,method:p.method,size:p.size,cast:currentRotation(p)};
    };
    return {
      tachiuoShore:plan('タチウオ'),
      tachiuoBoat:plan('タチウオ','船'),
      hirameBoat:plan('ヒラメ','船'),
      madaiBoat:plan('マダイ','船'),
      sawaraShore:plan('サワラ'),
      sawaraBoat:plan('サワラ','船'),
      aori:plan('アオリイカ')
    };
  })()`);

  assert.equal(cases.tachiuoShore.style, 'bait');
  assert.equal(cases.tachiuoShore.method, 'テンヤ釣り');
  assert.match(cases.tachiuoShore.size, /2〜6号/);
  assert.match(cases.tachiuoShore.cast.size, /2〜6号/);
  assert.equal(cases.tachiuoBoat.style, 'bait');
  assert.equal(cases.hirameBoat.style, 'bait');
  assert.equal(cases.madaiBoat.style, 'lure');
  assert.equal(cases.sawaraShore.method, 'ショアジギング');
  assert.match(cases.sawaraShore.cast.name, /ジグ/);
  assert.equal(cases.sawaraBoat.method, 'ブレードジギング');
  assert.equal(cases.aori.style, 'lure');
});

test('manual FIRST CAST is retained until AUTO is explicitly restored', () => {
  const context = recommendationContext();
  const result = evaluate(context, `(()=>{
    cur=F.find(f=>f.name==='サワラ');
    state={place:'おすすめ',season:'秋',goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false};
    setManualRotation(1);
    state.wind='強い';
    if(!state.rotationManual)state.rotation=autoRotationIndex(basePlan());
    const manual={index:state.rotation,manual:state.rotationManual};
    restoreAutoRotation();
    return {manual,auto:{index:state.rotation,manual:state.rotationManual,expected:autoRotationIndex(basePlan())}};
  })()`);
  assert.deepEqual({...result.manual}, {index: 1, manual: true});
  assert.equal(result.auto.manual, false);
  assert.equal(result.auto.index, result.auto.expected);
});

test('MY TACKLE keeps weight and line units separate', () => {
  const context = vm.createContext({console});
  const source = read('tackle.js').split('  const best=')[0] + '\n})();';
  vm.runInContext(source, context, {filename: 'tackle.js'});
  const {weightRange, lineOptions, rodFit, reelFit} = context.FISH_TARGET_TACKLE_LOGIC;

  for (const value of ['9〜14cm', '3〜5inch', '2.5〜3.5号', 'チヌ針1〜3号']) {
    assert.equal(weightRange(value), null, `${value} must not be grams`);
  }
  assert.deepEqual({...weightRange('20〜30g / 4inch')}, {min: 20, max: 30});
  assert.deepEqual([...lineOptions('フロロ 4〜8lb').map(x=>x.unit)], ['lb']);
  assert.deepEqual([...lineOptions('ナイロン 3〜4lb / PE 0.2〜0.4号').map(x=>x.unit)], ['lb', '号']);

  const lbPlan={reel:'2500番',line:'フロロ 4〜8lb'};
  assert.equal(reelFit({size:2500,lineType:'フロロ',lineNo:6},lbPlan).level, 1, 'lb must not auto-match a 号 input');

  const lurePlan={style:'lure',rod:'9〜10ft / M〜MH',reel:'4000番',line:'PE 1〜1.5号',size:'30〜40g'};
  assert.notEqual(rodFit({},lurePlan,{size:'30〜40g'}).level, 0, 'missing rod fields must not be green');
  assert.notEqual(reelFit({},lurePlan).level, 0, 'missing reel fields must not be green');
});

test('shore Tachiuo audit, data and rotation contain no former 3〜8号 fallback', () => {
  const data = read('data.js');
  const app = read('app.js');
  const audit = read('ACCURACY_AUDIT_V20.md');
  assert.match(data, /テンヤ2〜6号目安/);
  assert.match(app, /テンヤ＋キビナゴ',size:'2〜6号'/);
  assert.match(audit, /FIRST CAST 2〜6号/);
  assert.doesNotMatch(data, /テンヤ3〜8号/);
  assert.doesNotMatch(app, /テンヤ＋キビナゴ',size:'3〜8号'/);
});
