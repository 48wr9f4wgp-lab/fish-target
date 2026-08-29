(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  document.documentElement.classList.add('app-shell-v26');

  const activateView=view=>{
    const legacy=$(`.nav button[data-v="${view}"]`);
    if(legacy)legacy.click();
    syncTabs(view);
  };
  const syncTabs=view=>$$('#appTabBarV26 button').forEach(b=>b.classList.toggle('on',b.dataset.appTab===view));

  function ensureTabBar(){
    if($('#appTabBarV26'))return;
    const bar=document.createElement('nav');
    bar.id='appTabBarV26';bar.className='appTabBarV26';bar.setAttribute('aria-label','メインナビゲーション');
    bar.innerHTML=`
      <button class="on" data-app-tab="home" type="button"><span class="tabIcon">⌕</span><b>探す</b></button>
      <button data-app-tab="saved" type="button"><span class="tabIcon">▣</span><b>保存</b></button>
      <button data-app-tab="tackle" type="button"><span class="tabIcon">◎</span><b>タックル</b></button>`;
    document.body.appendChild(bar);
    bar.addEventListener('click',e=>{
      const btn=e.target.closest('button');if(!btn)return;
      if(btn.dataset.appTab==='tackle'){$('#tackleManage')?.click();return}
      activateView(btn.dataset.appTab);
    });
  }

  function ensureResultRail(){
    const result=$('#result');if(!result||$('#resultRailV26'))return;
    const hero=$('.resultHero',result);if(!hero)return;
    const rail=document.createElement('nav');rail.id='resultRailV26';rail.className='resultRailV26';rail.setAttribute('aria-label','プラン内ナビゲーション');
    rail.innerHTML=`<button class="on" data-jump="plan" type="button">PLAN</button><button data-jump="tackle" type="button">TACKLE</button><button data-jump="field" type="button">FIELD</button>`;
    hero.insertAdjacentElement('afterend',rail);
    rail.addEventListener('click',e=>{
      const btn=e.target.closest('button');if(!btn)return;
      const target=btn.dataset.jump==='plan'?$('.ux23AnswerTitle',result)||$('.firstCast',result):btn.dataset.jump==='tackle'?$('#tackleFitCard'):$('.steps',result);
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
      $$('#resultRailV26 button').forEach(x=>x.classList.toggle('on',x===btn));
    });
  }

  function polishTackleSheet(){
    const sheet=$('#tackleSheet');if(!sheet)return;
    sheet.classList.add('appTackleSheetV26');
    $$('.catalogDevNote',sheet).forEach(el=>{el.classList.add('userCatalogNote');el.textContent='メーカー・シリーズ・モデルから公式公開スペックを選択';});
    const body=$('.tackleSheetBody',sheet);if(body&&!$('.tackleSheetIntroV26',sheet)){
      const intro=document.createElement('div');intro.className='tackleSheetIntroV26';intro.innerHTML='<b>MY GEAR</b><span>持っている道具を登録すると、魚ごとの適合を自動判定します。</span>';body.prepend(intro);
    }
  }

  function tagFishCards(){
    $$('#grid .fish').forEach(card=>{
      card.classList.add('discoveryCardV26');
      const art=$('.art',card);if(art)art.classList.add('discoveryArtV26');
      const name=card.dataset.fish||$('h3',card)?.textContent||'';
      if(art&&!art.getAttribute('aria-label'))art.setAttribute('aria-label',`${name}のイメージ`);
    });
  }

  function syncShell(){
    ensureTabBar();ensureResultRail();polishTackleSheet();tagFishCards();
    const current=$('.view.on')?.id;
    document.body.classList.toggle('resultOpenV26',current==='result'||current==='fieldmode');
    document.body.classList.toggle('savedOpenV26',current==='saved');
    if(current==='home'||current==='saved')syncTabs(current);
  }

  const mo=new MutationObserver(()=>requestAnimationFrame(syncShell));
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  syncShell();
})();