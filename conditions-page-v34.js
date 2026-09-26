(()=>{
  if(document.documentElement.dataset.fieldLive!=='on')return;
  const $=selector=>document.querySelector(selector),byId=id=>document.getElementById(id);
  const page=byId('conditions'),liveMount=byId('conditionsLiveMount'),autoMount=byId('conditionsAutoMount');
  if(!page||!liveMount||!autoMount)return;
  function moveWithHeading(node,mount){if(!node||!mount)return;const heading=node.previousElementSibling;if(heading?.matches('h2.sectionTitle'))mount.appendChild(heading);mount.appendChild(node)}
  moveWithHeading($('.fieldLive'),liveMount);moveWithHeading(byId('autoAdjust'),autoMount);
  const text=(id,fallback='-')=>byId(id)?.textContent?.trim()||fallback,set=(id,value)=>{const el=byId(id);if(el)el.textContent=value},target=()=>LIVE.conditionsFish||null;
  function sync(){
    const fish=target(),place=LIVE?.place?.name||'地点未取得',status=text('fieldFit','FIELD STATUS · 未取得').replace('FIELD STATUS · ','');
    const now=text('tideNow','地点を選んで取得'),slack=text('tideNextSlack','-'),bite=text('tideBiteWindow','-'),sst=text('seaTemp','-');
    set('conditionsFish',fish?.name||'魚種未選択');set('conditionsPlace',` · ${place}`);set('conditionsPageStatus',status);
    set('conditionsDecisionNow',now);set('conditionsDecisionSlack',slack);set('conditionsDecisionBite',bite);set('conditionsDecisionSst',sst);set('conditionsDecisionBiteLabel',fish?'地合い候補':'釣行しやすい時間');
    set('conditionsTeaserStatus',status);set('conditionsTeaserNow',now);set('conditionsTeaserSlack',slack);set('conditionsTeaserBite',bite);
    autoMount.hidden=!fish;const field=byId('conditionsFieldModeBtn'),choose=byId('conditionsChooseFishBtn');if(field){field.hidden=!fish;field.disabled=!fish}if(choose)choose.hidden=Boolean(fish);page.dataset.entry=fish?'fish':'global';
  }
  const observer=new MutationObserver(sync);['fieldFit','wxPlace','tideNow','tideNextSlack','tideBiteWindow','seaTemp'].map(byId).filter(Boolean).forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));
  function openGlobal(){LIVE.conditionsFish=null;sync();show('conditions');renderFieldLive();if(LIVE.place&&LIVE.weather&&!LIVE.marine)void fetchWeather(LIVE.place);track('conditions_page_open',{fish:null,place:LIVE?.place?.name||null,mode:'global'})}
  function openForFish(){if(typeof cur==='undefined'||!cur)return;LIVE.conditionsFish=cur;sync();show('conditions');renderFieldLive();track('conditions_page_open',{fish:cur.name,place:LIVE?.place?.name||null,mode:'fish'})}
  function restoreFish(name){LIVE.conditionsFish=name?F.find(f=>f.name===name)||null:null;sync();renderFieldLive()}
  byId('conditionsOpenBtn')?.addEventListener('click',openForFish);byId('conditionsBack')?.addEventListener('click',()=>show('result'));byId('conditionsChooseFishBtn')?.addEventListener('click',()=>show('home'));byId('conditionsPackBtn')?.addEventListener('click',()=>globalThis.FISH_TARGET_QUICK_PACK?.open?.());byId('conditionsFieldModeBtn')?.addEventListener('click',()=>{if(target())byId('fieldModeBtn')?.click()});
  globalThis.FISH_TARGET_CONDITIONS_PAGE=Object.freeze({version:'CONDITIONS-V34-GLOBAL',sync,open:openGlobal,openGlobal,openForFish,restoreFish});sync();
})();