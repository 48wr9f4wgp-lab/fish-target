(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  document.documentElement.classList.add('app-shell-v26','clarity-v27');

  const OWNED_STORAGE_KEYS=Object.freeze([
    'fish_target_v9','fish_target_v8','fish_target_v7','fish_target_v6','fish_target_v5',
    'fish_target_v9_checklists','fish_target_v9_events',
    'fish_target_v16_last_plan','fish_target_v16_recent','fish_target_v16_favorites',
    'fish_target_v17_tackle'
  ]);
  const OWNED_STORAGE_PREFIXES=Object.freeze(['ft-fish-photo-v27r3:']);

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
    const result=$('#result');if(!result)return;
    let rail=$('#resultRailV26');
    if(!rail){
      const hero=$('.resultHero',result);if(!hero)return;
      rail=document.createElement('nav');rail.id='resultRailV26';rail.className='resultRailV26';rail.setAttribute('aria-label','プラン内ナビゲーション');
      rail.innerHTML=`<button class="on" data-jump="plan" type="button">釣り方</button><button data-jump="tackle" type="button">セット</button><button data-jump="field" type="button">現場</button>`;
      hero.insertAdjacentElement('afterend',rail);
      rail.addEventListener('click',e=>{
        const btn=e.target.closest('button');if(!btn)return;
        const target=btn.dataset.jump==='plan'?$('.planCard',result):btn.dataset.jump==='tackle'?$('#tackleAutoBuildV29')||$('#tackleFitCard'):$('.steps',result);
        if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
        $$('#resultRailV26 button').forEach(x=>x.classList.toggle('on',x===btn));
      });
    }
    const labels={plan:'釣り方',tackle:'セット',field:'現場'};
    $$('button[data-jump]',rail).forEach(btn=>{const text=labels[btn.dataset.jump];if(text&&btn.textContent!==text)btn.textContent=text});
  }

  function polishTackleSheet(){
    const sheet=$('#tackleSheet');if(!sheet)return;
    sheet.classList.add('appTackleSheetV26');
    if(sheet.dataset.clarityV27!=='1'){
      sheet.dataset.clarityV27='1';
      const eyebrow=$('.tackleSheetHead span',sheet),title=$('.tackleSheetHead h2',sheet);
      if(eyebrow)eyebrow.textContent='MY TACKLE';
      if(title)title.textContent='タックル追加';
      const cards=$$('.tackleFormCard',sheet);
      if(cards[0]?.querySelector('h3'))cards[0].querySelector('h3').textContent='ロッド';
      if(cards[1]?.querySelector('h3'))cards[1].querySelector('h3').textContent='リール';
      $$('.tackleEntryModes',sheet).forEach(group=>{
        const buttons=$$('button',group);if(buttons[0])buttons[0].textContent='商品から';if(buttons[1])buttons[1].textContent='手入力';
      });
      $$('.catalogDevNote',sheet).forEach(el=>{el.classList.add('userCatalogNote');el.textContent='公式スペックから選択'});
      $$('.catalogSearch input',sheet).forEach(el=>{el.placeholder='商品名で検索'});
      $$('.catalogLine>small,.ownedEditor>small',sheet).forEach(el=>{el.hidden=true});
      $$('.tackleAdd',sheet).forEach(btn=>{btn.textContent='登録'});
    }
  }

  function simplifyDynamicCopy(){
    const answer=$('#result .ux23AnswerTitle');if(answer&&answer.innerHTML!=='STEP 2 · 最初の1投<small>釣り方を決めたら、ここから始める。</small>')answer.innerHTML='STEP 2 · 最初の1投<small>釣り方を決めたら、ここから始める。</small>';
    const kicker=$('#firstCastKicker');if(kicker&&kicker.textContent!=='FIRST CAST')kicker.textContent='FIRST CAST';
    const rotation=$('#result .rotationLabel');if(rotation&&rotation.textContent!=='ダメなら →')rotation.textContent='ダメなら →';
    const recommend=$('#result .planCard .recommend');if(recommend&&recommend.textContent!=='STEP 1 · 釣り方')recommend.textContent='STEP 1 · 釣り方';
    const manage=$('#tackleManage');if(manage&&manage.textContent!=='編集')manage.textContent='編集';
    const empty=$('#tackleEmptyCta');if(empty){const b=$('b',empty),s=$('span',empty);if(b)b.textContent='タックルを追加';if(s)s.textContent='ロッド・リールを選ぶ ›'}
    const count=$('.tackleCount p');if(count)count.textContent='魚ごとに自動判定';
    $$('.fitNote').forEach(el=>{el.hidden=true});
    const fitEmpty=$('.fitEmpty span');if(fitEmpty)fitEmpty.textContent='登録すると使えるか判定';
    const ownedEmpty=$('.tackleOwned .tackleEmpty');if(ownedEmpty)ownedEmpty.textContent='まだ未登録';
  }

  function installCatalogSearchDebounce(){
    if(document.documentElement.dataset.catalogSearchDebounce==='1')return;
    document.documentElement.dataset.catalogSearchDebounce='1';
    const timers=new WeakMap();
    document.addEventListener('input',event=>{
      const input=event.target?.closest?.('#rodCatalogSearch,#reelCatalogSearch');
      if(!input||event.__ftDebounced)return;
      event.stopImmediatePropagation();
      const prev=timers.get(input);if(prev)clearTimeout(prev);
      timers.set(input,setTimeout(()=>{const next=new Event('input',{bubbles:true});next.__ftDebounced=true;input.dispatchEvent(next)},160));
    },true);
  }

  function removeOwnedStorage(){
    try{
      for(const key of OWNED_STORAGE_KEYS)localStorage.removeItem(key);
      for(let i=localStorage.length-1;i>=0;i--){
        const key=localStorage.key(i);
        if(key&&OWNED_STORAGE_PREFIXES.some(prefix=>key.startsWith(prefix)))localStorage.removeItem(key);
      }
      return true;
    }catch(error){
      console.warn('FISH TARGET local data removal failed',error);
      return false;
    }
  }

  function requestOwnedStorageRemoval(){
    const ok=globalThis.confirm('この端末に保存したFISH TARGETのプラン、MY TACKLE、お気に入り、履歴、チェックリスト、利用イベント、魚写真キャッシュを削除します。元に戻せません。削除しますか？');
    if(!ok)return;
    if(!removeOwnedStorage()){
      globalThis.alert?.('端末内データを削除できませんでした。ブラウザのサイトデータ設定を確認してください。');
      return;
    }
    globalThis.alert?.('この端末のFISH TARGET保存データを削除しました。');
    location.reload();
  }

  function ensurePrivacyPanel(){
    if($('#privacyPanelV26'))return;
    const grid=$('#home #grid');if(!grid)return;
    const panel=document.createElement('details');
    panel.id='privacyPanelV26';panel.className='privacyPanelV26';
    panel.innerHTML=`<summary><span><b>データとプライバシー</b><small>端末保存と外部通信</small></span><em>確認 ›</em></summary><div class="privacyBodyV26"><p><strong>端末内に保存：</strong>保存プラン、MY TACKLE、お気に入り・最近見た魚、チェックリスト、アプリ内の利用イベントは、この端末のブラウザ/PWAストレージに保存します。外部Analyticsサービスへ送信しません。</p><p><strong>魚のオンライン写真：</strong>オンライン写真が有効な場合はWikipedia / Wikimediaへ画像候補を問い合わせます。アプリの認証情報やCookieは送信せず、画像にはリファラーを付けません。ただし通常のWeb通信と同様、接続元IPなどは接続先から見える場合があります。</p><p><strong>FIELD LIVE：</strong>現在の公開設定ではOFFです。天候・海況APIへの自動送信は行いません。</p><button class="privacyDeleteV26" id="privacyDeleteV26" type="button">この端末のFISH TARGETデータを削除</button><small class="privacyDeleteNoteV26">FISH TARGETが所有する保存キーと魚写真キャッシュだけを削除します。他のサイトやアプリの保存データは削除しません。</small></div>`;
    grid.insertAdjacentElement('afterend',panel);
    $('#privacyDeleteV26')?.addEventListener('click',requestOwnedStorageRemoval);
  }

  function tagFishCards(){
    $$('#grid .fish:not(.discoveryCardV26)').forEach(card=>{
      card.classList.add('discoveryCardV26');
      const art=$('.art',card);if(art)art.classList.add('discoveryArtV26');
      const name=card.dataset.fish||$('h3',card)?.textContent||'';
      if(art&&!art.getAttribute('aria-label'))art.setAttribute('aria-label',`${name}のイメージ`);
    });
  }

  function syncShell(){
    ensureTabBar();ensureResultRail();polishTackleSheet();installCatalogSearchDebounce();ensurePrivacyPanel();tagFishCards();simplifyDynamicCopy();
    const current=$('.view.on')?.id;
    document.body.classList.toggle('resultOpenV26',current==='result'||current==='fieldmode');
    document.body.classList.toggle('savedOpenV26',current==='saved');
    if(current==='home'||current==='saved')syncTabs(current);
  }

  let syncQueued=false;
  const scheduleSync=()=>{if(syncQueued)return;syncQueued=true;requestAnimationFrame(()=>{syncQueued=false;syncShell()})};
  const mo=new MutationObserver(scheduleSync);
  mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
  syncShell();
  globalThis.FISH_TARGET_PRIVACY_CONTROLS=Object.freeze({version:'PRIVACY-RC-1',ownedStorageKeys:OWNED_STORAGE_KEYS,ownedStoragePrefixes:OWNED_STORAGE_PREFIXES});
})();
