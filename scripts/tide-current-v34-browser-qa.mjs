import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch();
const base=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const start=new Date('2026-09-26T18:00:00Z');
const hours=Array.from({length:24},(_,i)=>new Date(start.getTime()+i*3600000).toISOString().slice(0,13)+':00');
const weatherHours=hours.slice(0,8);
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const weatherMock={
    current:{temperature_2m:22,precipitation:0,weather_code:1,wind_speed_10m:3,wind_gusts_10m:5,wind_direction_10m:90,time:hours[0]},
    hourly:{time:weatherHours,temperature_2m:weatherHours.map(()=>22),precipitation:weatherHours.map(()=>0),weather_code:weatherHours.map(()=>1),wind_speed_10m:weatherHours.map(()=>3),wind_gusts_10m:weatherHours.map(()=>5)}
  };
  const marineMock={
    latitude:34.6833,longitude:138.9667,
    current:{wave_height:0.5,sea_surface_temperature:24,ocean_current_velocity:1.2,ocean_current_direction:90,sea_level_height_msl:0.1,time:hours[0]},
    hourly:{
      time:hours,
      wave_height:hours.map(()=>0.5),
      sea_surface_temperature:hours.map(()=>24),
      ocean_current_velocity:[1.2,0.7,0.2,0.6,1.0,1.4,1.0,0.5,0.2,0.4,0.9,1.3,1.1,0.8,0.4,0.2,0.5,0.9,1.4,1.0,0.6,0.3,0.5,0.8],
      ocean_current_direction:hours.map((_,i)=>(90+i*5)%360),
      sea_level_height_msl:[0.10,0.16,0.24,0.33,0.39,0.42,0.40,0.34,0.25,0.15,0.06,-0.02,-0.08,-0.11,-0.09,-0.03,0.06,0.16,0.27,0.35,0.39,0.37,0.31,0.22]
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
  await page.locator('button.fish[data-fish="シーバス"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  const conditions=page.locator('#v19Conditions');
  await conditions.waitFor({state:'visible'});
  if(await conditions.getAttribute('open')===null)await conditions.locator(':scope > summary').click();
  await page.locator('#spotPresets button',{hasText:'伊豆・下田'}).click();
  await page.locator('#tideFlow').waitFor({state:'visible'});
  assert.match(await page.locator('#tideNow').innerText(),/潮位 上げ/);
  assert.match(await page.locator('#tideNow').innerText(),/弱まり傾向/);
  assert.match(await page.locator('#tideNextSlack').innerText(),/20:00 · 0\.2km\/h/);
  assert.doesNotMatch(await page.locator('#tideBiteWindow').innerText(),/^-$/);
  assert.equal(await page.locator('#tideFlowChart .nowLine').count(),1);
  assert.equal(await page.locator('#tideFlowChart .biteBand').count(),1);
  assert.ok(await page.locator('#tideFlowChart .dirArrow').count()>=4);
  assert.match(await page.locator('#tideFlowMeta').innerText(),/地合い候補は魚の基本時間帯と気象・海況の重なりを使う目安/);
  await page.locator('#fieldModeBtn').click();
  const field=await page.locator('#fmCondition').innerText();
  assert.match(field,/次の弱まり 20:00 · 0\.2km\/h/);
  assert.match(field,/地合い候補/);
  await page.locator('#fieldBack').click();
  await page.locator('#back').click();
  await page.locator('button.fish[data-fish="ニジマス"]').click();
  assert.equal(await page.locator('#tideFlow').isHidden(),true,'freshwater must not inherit marine tide/current UI');
  assert.deepEqual(errors,[]);
  console.log('TIDE_CURRENT_V34_BROWSER_QA_PASS',engine.name());
}finally{await browser.close()}
