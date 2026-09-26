import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
const screenshots=process.env.FISH_TARGET_SCREENSHOTS;
if(screenshots)await mkdir(screenshots,{recursive:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
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
  assert.equal(metrics.length,2);
  for(const metric of metrics){assert.ok(metric.transparent>.55,`${metric.name} must have true transparency`);assert.ok(metric.opaque>.12,`${metric.name} must retain an opaque fish body`)}

  for(const width of [375,390,430]){
    await page.setViewportSize({width,height:844});
    for(const [i,name] of ['ブリ・ワラサ','ニジマス'].entries()){
      await page.locator('#q').fill(name);
      const card=page.locator(`button.fish[data-fish="${name}"]`);
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(name=>globalThis.FISH_TARGET_REAL_FISH.prefetch(name),name);
      await card.locator('.realFishCanvas').waitFor();
      await card.click();
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
      // Playwright visibility alone ignores the fixed bottom navigation.
      await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
      const reachable=await card.evaluate(el=>({bottom:el.getBoundingClientRect().bottom,dockTop:document.getElementById('appTabBarV26').getBoundingClientRect().top}));
      assert.ok(reachable.bottom<=reachable.dockTop,`last filtered card must scroll clear of navigation: ${JSON.stringify(reachable)}`);
      if(screenshots&&width===390)await card.screenshot({path:`${screenshots}/preview-${i}-card.png`});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('FISH_VISUAL_PREVIEW_BROWSER_QA_PASS',JSON.stringify({engine:engine.name(),widths:[375,390,430],metrics}));
}finally{await browser.close()}
