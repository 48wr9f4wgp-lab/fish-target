import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
const screenshots=process.env.FISH_TARGET_SCREENSHOTS;
const expectedNames=['ブリ・ワラサ','ニジマス','ヒラメ','アオリイカ','シーバス','アジ','メバル','マゴチ','タチウオ','マダイ','ブラックバス','サワラ'];
if(screenshots)await mkdir(screenshots,{recursive:true});
const diagnostics=process.env.FISH_TARGET_QA_DIAGNOSTICS;
const events=[];let step='launch',page,context;
const record=(event,detail='')=>{const row={time:new Date().toISOString(),step,event,detail};events.push(row);console.log('FISH_VISUAL_DIAGNOSTIC',JSON.stringify(row))};
if(diagnostics)await mkdir(diagnostics,{recursive:true});
browser.on('disconnected',()=>record('browser-disconnected'));
try{
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
  if(diagnostics)await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  page=await context.newPage();
  page.on('crash',()=>record('page-crash'));page.on('close',()=>record('page-close'));
  context.on('close',()=>record('context-close'));
  step='initial-load';
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(BASE);
  await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'));
  const metrics=await page.evaluate(async()=>{
    const rows=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST.developmentOnlyRecords;
    return Promise.all(rows.map(async row=>{
      const img=new Image();img.src=new URL(row.asset.file,location.href).href;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let transparent=0,opaque=0;
      for(let i=3;i<data.length;i+=4){if(data[i]===0)transparent++;if(data[i]>=240)opaque++}
      return {name:row.species_name,transparent:transparent/(data.length/4),opaque:opaque/(data.length/4),file:row.asset.file};
    }));
  });
  assert.deepEqual(metrics.map(row=>row.name).sort(),[...expectedNames].sort());
  for(const metric of metrics){assert.ok(metric.transparent>.55,`${metric.name} must have true transparency`);assert.ok(metric.opaque>.12,`${metric.name} must retain an opaque fish body`)}

  for(const width of [375,390,430]){
    await page.setViewportSize({width,height:844});
    for(const [i,name] of expectedNames.entries()){
      step=`${width}/${name}/search`;record('start');
      await page.locator('#q').fill(name);
      const card=page.locator(`button.fish[data-fish="${name}"]`);
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(name=>globalThis.FISH_TARGET_REAL_FISH.prefetch(name),name);
      await card.locator('.realFishCanvas').waitFor();
      step=`${width}/${name}/click`;record('click');
      await card.click();
      step=`${width}/${name}/paint`;
      await page.waitForFunction(name=>document.querySelector('#tart .realFishCanvas')?.dataset.fish===name&&document.querySelector('#tart .realFishCanvas')?.width>0,name,{timeout:10000});
      const bounds=await page.locator('#tart .realFishCanvas').evaluate(canvas=>{
        const {width:w,height:h}=canvas;const data=canvas.getContext('2d').getImageData(0,0,w,h).data;
        let minX=w,maxX=-1,minY=h,maxY=-1;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>32){minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY)}
        return {left:minX/w,right:(w-1-maxX)/w,top:minY/h,bottom:(h-1-maxY)/h,pixels:maxX>=minX};
      });
      assert.ok(bounds.pixels,`${name} actually paints`);
      assert.ok(bounds.left>=.08&&bounds.right>=.08&&bounds.top>=.08&&bounds.bottom>=.08,`${name}/${width} safe margins: ${JSON.stringify(bounds)}`);
      if(screenshots&&width===390)await page.locator('#tart').screenshot({path:`${screenshots}/preview-${i}-result.png`});
      await page.locator('#back').click();
      await page.waitForFunction(()=>!globalThis.FISH_TARGET_NAVIGATION||(!FISH_TARGET_NAVIGATION.isRestoring()&&FISH_TARGET_NAVIGATION.getState()?.view==='home'));
      // Playwright visibility alone ignores the fixed bottom navigation.
      await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
      const reachable=await card.evaluate(el=>({bottom:el.getBoundingClientRect().bottom,dockTop:document.getElementById('appTabBarV26').getBoundingClientRect().top}));
      assert.ok(reachable.bottom<=reachable.dockTop,`last filtered card must scroll clear of navigation: ${JSON.stringify(reachable)}`);
      if(screenshots&&width===390)await card.screenshot({path:`${screenshots}/preview-${i}-card.png`});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('FISH_VISUAL_PREVIEW_BROWSER_QA_PASS',JSON.stringify({engine:engine.name(),widths:[375,390,430],metrics}));
}catch(error){
  record('failure',String(error));
  if(diagnostics){
    await writeFile(`${diagnostics}/events.json`,JSON.stringify(events,null,2));
    if(page&&!page.isClosed())await page.screenshot({path:`${diagnostics}/failure.png`}).catch(()=>{});
  }
  throw error;
}finally{
  if(diagnostics&&context)await context.tracing.stop({path:`${diagnostics}/trace.zip`}).catch(error=>record('trace-save-failed',String(error)));
  step='cleanup';await browser.close();
  if(diagnostics)await writeFile(`${diagnostics}/events.json`,JSON.stringify(events,null,2));
}
