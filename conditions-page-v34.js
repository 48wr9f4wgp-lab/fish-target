(()=>{
  if(document.documentElement.dataset.fieldLive!=='on')return;
  const $=selector=>document.querySelector(selector);
  const byId=id=>document.getElementById(id);
  const page=byId('conditions'),liveMount=byId('conditionsLiveMount'),autoMount=byId('conditionsAutoMount');
  if(!page||!liveMount||!autoMount)return;

  function moveWithHeading(node,mount){
    if(!node||!mount)return;
    const heading=node.previousElementSibling;
    if(heading?.matches('h2.sectionTitle'))mount.appendChild(heading);
    mount.appendChild(node);
  }
  moveWithHeading($('.fieldLive'),liveMount);
  moveWithHeading(byId('autoAdjust'),autoMount);

  const text=(id,fallback='-')=>byId(id)?.textContent?.trim()||fallback;
  const set=(id,value)=>{const el=byId(id);if(el)el.textContent=value};
  function sync(){
    const fish=typeof cur!=='undefined'&&cur?.name?cur.name:'-';
    const place=typeof LIVE!=='undefined'&&LIVE?.place?.name?LIVE.place.name:'地点未取得';
    const status=text('fieldFit','FIELD STATUS · 未取得').replace('FIELD STATUS · ','');
    const now=text('tideNow','地点を選んで取得');
    const slack=text('tideNextSlack','-');
    const bite=text('tideBiteWindow','-');
    const sst=text('seaTemp','-');
    set('conditionsFish',fish);set('conditionsPlace',` · ${place}`);set('conditionsPageStatus',status);
    set('conditionsDecisionNow',now);set('conditionsDecisionSlack',slack);set('conditionsDecisionBite',bite);set('conditionsDecisionSst',sst);
    set('conditionsTeaserStatus',status);set('conditionsTeaserNow',now);set('conditionsTeaserSlack',slack);set('conditionsTeaserBite',bite);
  }

  const observed=['fieldFit','wxPlace','tideNow','tideNextSlack','tideBiteWindow','seaTemp'].map(byId).filter(Boolean);
  const observer=new MutationObserver(sync);
  observed.forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));

  byId('conditionsOpenBtn')?.addEventListener('click',()=>{
    if(typeof cur==='undefined'||!cur)return;
    sync();show('conditions');track('conditions_page_open',{fish:cur.name,place:LIVE?.place?.name||null});
  });
  byId('conditionsBack')?.addEventListener('click',()=>show('result'));
  byId('conditionsFieldModeBtn')?.addEventListener('click',()=>byId('fieldModeBtn')?.click());
  globalThis.FISH_TARGET_CONDITIONS_PAGE=Object.freeze({version:'CONDITIONS-V34',sync,open:()=>{if(cur){sync();show('conditions')}}});
  sync();
})();