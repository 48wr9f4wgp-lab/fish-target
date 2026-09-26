import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch();
const base=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const start=new Date('2026-09-26T14:00:00Z');
const hours=Array.from({length:28},(_,i)=>new Date(start.getTime()+i*3600000).toISOString().slice(0,13)+':00');
const nowIndex=4,weatherHours=hours.slice(nowIndex,nowIndex+8),futureVelocity=[1.2,0.7,0.2,0.6,1.0,1.4,1.0,0.5,0.2,0.4,0.9,1.3,1.1,0.8,0.4,0.2,0.5,0.9,1.4,1.0,0.6,0.3,0.5,0.8],futureLevel=[0.10,0.16,0.24,0.33,0.39,0.42,0.40,0.34,0.25,0.15,0.06,-0.02,-0.08,-0.11,-0.09,-0.03,0.06,0.16,0.27,0.35,0.39,0.37,0.31,0.22];
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const weatherMock={
    current:{temperature_2m:22,precipitation:0,weather_code:1,wind_speed_10m:3,wind_gusts_10m:5,wind_direction_10m:90,time:hours[nowIndex]},
    hourly:{time:weatherHours,temperature_2m:weatherHours.map(()=>22),precipitation:weatherHours.map(()=>0),weather_code:weatherHours.map(()=>1),wind_speed_10m:weatherHours.map(()=>3),wind_gusts_10m:weatherHours.map(()=>5)},
    daily:{time:['2026-09-26','2026-09-27'],sunrise:['2026-09-26T05:34','2026-09-27T05:35'],sunset:['2026-09-26T17:39','2026-09-27T17:38']}
  };
  const marineMock={
    latitude:34.6833,longitude:138.9667,
    current:{wave_height:0.5,wave_period:8,wave_direction:120,swell_wave_height:0.4,swell_wave_period:12,swell_wave_direction:135,sea_surface_temperature:24,ocean_current_velocity:1.2,ocean_current_direction:90,sea_level_height_msl:0.1,time:hours[nowIndex]},
    hourly:{
      time:hours,
      wave_height:hours.map(()=>0.5),
      wave_period:hours.map(()=>8),
      wave_direction:hours.map(()=>120),
      swell_wave_height:hours.map(()=>0.4),
      swell_wave_period:hours.map(()=>12),
      swell_wave_direction:hours.map(()=>135),
      sea_surface_temperature:hours.map((_,i)=>i<nowIndex?23.9:24+(0.5*(i-nowIndex)/23)),
      ocean_current_velocity:[1.5,1.4,1.3,1.1,...futureVelocity],
      ocean_current_direction:hours.map((_,i)=>(70+i*5)%360),
      sea_level_height_msl:[-0.08,-0.04,0.00,0.05,...futureLevel]
    }
  };
  await page.addInitScript(({weatherMock,marineMock})=>{
    const nativeFetch=globalThis.fetch.bind(globalThis);
    globalThis.fetch=(input,init)=>{
      const url=typeof input==='string'?input:String(input?.url||input);
      if(url.startsWith('https://api.open-meteo.com/v1/forecast'))return Promise.resolve(new Response(JSON.stringify(weatherMock),{status:200,headers:{'Content-Type':'application/json'}}));
      if(url.startsWith('https://marine-api.open-meteo.com/v1/marine'))return Promise.resolve(new Response(JSON.stringify(marineMock),{status:200,headers:{'Content-Type':'application/json'}}));
      return nativeFetch(input,init);
    };
  },{weatherMock,marineMock});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fieldLive==='on');
  await page.locator('#appTabBarV26 [data-app-tab="conditions"]').waitFor({state:'visible'});
  await page.locator('#appTabBarV26 [data-app-tab="conditions"]').click();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='conditions'&&FISH_TARGET_NAVIGATION?.getState?.()?.view==='conditions');
  assert.equal((await page.locator('#conditionsFish').textContent()||'').trim(),'魚種未選択');
  assert.equal(await page.locator('#conditionsFieldModeBtn').isHidden(),true);
  await page.locator('#spotPresets button',{hasText:'伊豆・下田'}).click();
  await page.locator('#tripDashboardV35:not(.is-empty)').waitFor({state:'visible'});
  assert.equal((await page.locator('#tripDashPlaceV35').textContent()||'').trim(),'伊豆・下田');
  assert.equal((await page.locator('#tripDashLevelV35').textContent()||'').trim(),'+10 cm');
  assert.match(await page.locator('#tripDashTurnLabelV35').textContent(),/満潮候補/);
  assert.equal((await page.locator('#tripDashTurnTimeV35').textContent()||'').trim(),'23:00');
  const nowPct=Number(await page.locator('#tripDashGraphV35').getAttribute('data-now-percent'));assert.ok(nowPct>=15&&nowPct<=22,`NOW should sit around 17% of the graph, got ${nowPct}%`);
  assert.match(await page.locator('#tripDashGraphV35 .tripDashTurnMarkV35').first().textContent(),/満 23:00/);
  assert.match(await page.locator('#tripDashSunV35').textContent(),/05:34/);
  assert.match(await page.locator('#tripDashWeatherV35').textContent(),/晴れ|曇り/);
  assert.match(await page.locator('#tripDashWindV35').textContent(),/3\.0m\/s/);
  assert.match(await page.locator('#tripDashWaveV35').textContent(),/0\.5m · 8s/);
  assert.match(await page.locator('#tripDashTempV35').textContent(),/24\.0℃/);
  assert.match(await page.locator('#tripDashTempSubV35').textContent(),/上昇 · \+0\.5℃\/24h/);
  assert.equal(await page.locator('#tripDashGraphV35 .tripDashCurveV35').count(),1);
  assert.ok(await page.locator('#tripDashGraphV35 .tripDashMazumeV35').count()>=1,'mazume band appears in the main dashboard graph');
  assert.equal(await page.locator('#conditionsDetailsV35').getAttribute('open'),null,'detailed telemetry stays collapsed by default');
  assert.equal(await page.locator('#conditionsLocationMountV35').isVisible(),false,'selected location controls collapse after choice');
  assert.equal((await page.locator('#conditionsLocationEditV36').textContent()||'').trim(),'変更');
  assert.doesNotMatch(await page.locator('#tripDashVerdictV35').textContent(),/^標準$/,'verdict must use human language');
  assert.equal((await page.locator('#tripDashSlackLabelV37').textContent()||'').trim(),'潮止まり前後');
  assert.equal((await page.locator('#tripDashSlackV35').textContent()||'').trim(),'19:00–21:00');
  assert.match(await page.locator('#tripDashSlackSubV37').textContent(),/中心 20:00 · 0\.2km\/h/);
  assert.equal(await page.locator('#tripDashGraphV35 .tripDashSlackBandV37').count(),1,'slack watch band appears on the main graph');
  assert.equal(await page.locator('#tripDashGraphV35 .tripDashSlackCenterV37').count(),1,'slack center line appears on the main graph');
  for(const width of [375,390,430]){await page.setViewportSize({width,height:844});const metrics=await page.evaluate(()=>{const d=document.getElementById('tripDashboardV35'),mini=[...document.querySelectorAll('.tripDashMiniV35>div')];return {doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,dash:d.getBoundingClientRect().width,viewport:innerWidth,mini:mini.map(x=>({client:x.clientWidth,scroll:x.scrollWidth}))}});assert.ok(metrics.doc<=width+1&&metrics.body<=width+1,`dashboard overflow at ${width}: ${JSON.stringify(metrics)}`);assert.ok(metrics.mini.every(x=>x.scroll<=x.client+1),`mini-card horizontal overflow at ${width}: ${JSON.stringify(metrics.mini)}`)}
  await page.setViewportSize({width:390,height:844});
  await page.locator('#conditionsChooseFishBtn').click();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='home');
  await page.locator('button.fish[data-fish="シーバス"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  await page.locator('#conditionsOpenBtn').click();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='conditions'&&FISH_TARGET_NAVIGATION?.getState?.()?.view==='conditions');
  assert.equal((await page.locator('#conditionsFish').textContent()||'').trim(),'シーバス');
  assert.match(await page.locator('#conditionsDecisionBiteLabel').innerText(),/地合い候補/);
  assert.equal(await page.locator('#conditions .fieldLive').count(),1,'dedicated view owns the single FIELD LIVE card');
  assert.equal(await page.locator('#result .fieldLive').count(),0,'result must keep summary only');
  await page.goBack();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='result'&&!FISH_TARGET_NAVIGATION.isRestoring());
  await page.goForward();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='conditions'&&!FISH_TARGET_NAVIGATION.isRestoring());
  await page.locator('#tripDashboardV35:not(.is-empty)').waitFor({state:'visible'});
  assert.match(await page.locator('#tripDashTrendV35').textContent(),/潮位 上げ/);
  assert.match(await page.locator('#tripDashTrendV35').textContent(),/弱まり傾向/);
  assert.equal((await page.locator('#tripDashSlackV35').textContent()||'').trim(),'19:00–21:00');
  assert.match(await page.locator('#tripDashSlackSubV37').textContent(),/中心 20:00 · 0\.2km\/h/);
  assert.doesNotMatch(await page.locator('#tripDashBiteV35').textContent(),/^-$/);
  assert.equal(await page.locator('#tripDashGraphV35 .tripDashCurveV35').count(),1);
  assert.match(await page.locator('#tideFlowMeta').textContent(),/地合い候補は魚の基本時間帯と気象・海況の重なりを使う目安/);
  await page.locator('#conditionsFieldModeBtn').click();
  const field=await page.locator('#fmCondition').innerText();
  assert.match(field,/次の弱まり 20:00 · 0\.2km\/h/);
  assert.match(field,/地合い候補/);
  await page.locator('#fieldBack').click();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='conditions');
  await page.locator('#conditionsBack').click();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='result');
  await page.locator('#back').click();
  await page.locator('button.fish[data-fish="ニジマス"]').click();
  assert.equal(await page.evaluate(()=>document.getElementById('tideFlow').hidden),true,'freshwater must not retain marine tide/current model state');
  assert.deepEqual(errors,[]);
  console.log('TIDE_CURRENT_V34_BROWSER_QA_PASS',engine.name());
}finally{await browser.close()}
