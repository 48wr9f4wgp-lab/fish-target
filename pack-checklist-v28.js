(()=>{
  const STORE_KEY='fish_target_v9_checklists';
  const CONFIG_KEY='__quick_pack_v28_config';
  const CHECKED_KEY='__quick_pack_v28_checked';
  const ACTIVE_KEY='pack:active';
  const DEFAULTS=Object.freeze([
    {id:'sun',name:'日焼け止め'},
    {id:'bug',name:'虫除け'},
    {id:'drink',name:'飲み物'},
    {id:'towel',name:'タオル'},
    {id:'battery',name:'モバイルバッテリー'},
    {id:'light',name:'ヘッドライト / ライト'},
    {id:'trash',name:'ゴミ袋'},
    {id:'firstaid',name:'救急用品'}
  ]);
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let editMode=false;
  let returnFocus=null;

  const readStore=()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}catch{return{}}};
  const writeStore=store=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(store));return true}catch(error){console.warn('quick pack save failed',error);return false}};
  const cloneDefaults=()=>DEFAULTS.map(item=>({...item}));
  const getConfig=()=>{
    const store=readStore();
    const config=store[CONFIG_KEY];
    return Array.isArray(config)?config.filter(item=>item&&item.id&&item.name).map(item=>({id:String(item.id),name:String(item.name)})):cloneDefaults();
  };
  const saveConfig=config=>{const store=readStore();store[CONFIG_KEY]=config;writeStore(store)};
  const getChecked=()=>{const store=readStore();const all=store[CHECKED_KEY]||{};const list=all[ACTIVE_KEY];return new Set(Array.isArray(list)?list:[])};
  const saveChecked=checked=>{const store=readStore();const all=store[CHECKED_KEY]&&typeof store[CHECKED_KEY]==='object'?store[CHECKED_KEY]:{};all[ACTIVE_KEY]=[...checked];store[CHECKED_KEY]=all;writeStore(store)};
  const clearChecks=()=>{const store=readStore();store[CHECKED_KEY]={};writeStore(store)};
  const pulse=(el,klass='quickPackPulseV28')=>{if(!el)return;el.classList.remove(klass);void el.offsetWidth;el.classList.add(klass);setTimeout(()=>el.classList.remove(klass),360)};
  const haptic=pattern=>{try{navigator.vibrate?.(pattern)}catch{}};

  function syncPackTab(active){
    $$('#appTabBarV26 button').forEach(button=>button.classList.toggle('on',active&&button.dataset.appTab==='pack'));
    if(active)return;
    const current=$('.view.on')?.id;
    const fallback=current==='saved'?'saved':current==='home'?'home':null;
    if(fallback){const button=$(`#appTabBarV26 button[data-app-tab="${fallback}"]`);if(button)button.classList.add('on')}
  }

  function ensureTab(){
    const bar=$('#appTabBarV26');
    if(!bar||$('#appPackTabV30'))return;
    const button=document.createElement('button');
    button.id='appPackTabV30';button.dataset.appTab='pack';button.type='button';
    button.innerHTML='<span class="tabIcon">✓</span><b>持ち物</b>';
    button.addEventListener('click',event=>{event.stopPropagation();open()});
    bar.appendChild(button);
  }

  function ensureUi(){
    ensureTab();
    if($('#packStandaloneV30'))return;
    const overlay=document.createElement('section');
    overlay.id='packStandaloneV30';overlay.className='packStandaloneV30';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','持ち物');
    overlay.innerHTML=`
      <div class="packStandaloneTopV30">
        <div><span>PACK LIST</span><h2>持ち物</h2><p>釣行フローとは別に、忘れ物だけ管理</p></div>
        <button id="packStandaloneCloseV30" type="button" aria-label="持ち物を閉じる">×</button>
      </div>
      <section id="quickPackV28" class="quickPackV28 card" aria-label="持ち物チェックリスト">
        <div class="quickPackHeadV28">
          <div><strong>チェックリスト</strong><small>必要な物だけ自由に編集</small></div>
          <div class="quickPackHeadActionsV28"><span id="quickPackCountV28">0/0</span><button id="quickPackEditV28" type="button" aria-expanded="false">編集</button></div>
        </div>
        <div class="quickPackListV28" id="quickPackListV28"></div>
        <div class="quickPackEditorV28" id="quickPackEditorV28" hidden>
          <form id="quickPackAddFormV28"><input id="quickPackAddInputV28" maxlength="24" autocomplete="off" placeholder="持ち物を追加" aria-label="持ち物を追加"><button type="submit">追加</button></form>
          <div class="quickPackEditorActionsV28"><button class="quickPackClearV28" id="quickPackClearV28" type="button">チェック解除</button><button class="quickPackResetV28" id="quickPackResetV28" type="button">標準に戻す</button></div>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    $('#packStandaloneCloseV30')?.addEventListener('click',close);
    $('#quickPackEditV28')?.addEventListener('click',()=>{editMode=!editMode;render()});
    $('#quickPackAddFormV28')?.addEventListener('submit',event=>{
      event.preventDefault();const input=$('#quickPackAddInputV28');const name=String(input?.value||'').trim();if(!name)return;
      const config=getConfig();if(config.some(item=>item.name===name)){input.value='';return}
      config.push({id:`custom-${Date.now().toString(36)}`,name});saveConfig(config);input.value='';render();pulse($('#quickPackV28'));
    });
    $('#quickPackClearV28')?.addEventListener('click',()=>{clearChecks();render();pulse($('#quickPackV28'))});
    $('#quickPackResetV28')?.addEventListener('click',()=>{
      const store=readStore();store[CONFIG_KEY]=cloneDefaults();store[CHECKED_KEY]={};writeStore(store);render();pulse($('#quickPackV28'));
    });
  }

  function render(){
    ensureUi();const root=$('#quickPackV28');if(!root)return;
    const config=getConfig(),checked=getChecked(),list=$('#quickPackListV28');
    for(const id of [...checked])if(!config.some(item=>item.id===id))checked.delete(id);
    list.innerHTML=config.map(item=>{const id=escapeHtml(item.id),name=escapeHtml(item.name);return `<div class="quickPackRowV28" data-id="${id}"><label class="quickPackItemV28"><input type="checkbox" ${checked.has(item.id)?'checked':''}><span class="quickPackCheckV28"></span><span>${name}</span></label><button class="quickPackDeleteV28" type="button" aria-label="${name}を削除" ${editMode?'':'hidden'}>×</button></div>`}).join('');
    $$('.quickPackRowV28',list).forEach(row=>{
      const input=$('input',row),id=row.dataset.id;
      input.addEventListener('change',()=>{
        const next=getChecked();input.checked?next.add(id):next.delete(id);saveChecked(next);pulse(row);haptic(input.checked?8:5);updateProgress(config,next);
      });
      $('.quickPackDeleteV28',row)?.addEventListener('click',()=>{
        const nextConfig=getConfig().filter(item=>item.id!==id);saveConfig(nextConfig);const next=getChecked();next.delete(id);saveChecked(next);render();
      });
    });
    const editor=$('#quickPackEditorV28');editor.hidden=!editMode;
    const edit=$('#quickPackEditV28');edit.textContent=editMode?'完了':'編集';edit.setAttribute('aria-expanded',String(editMode));
    root.classList.toggle('editing',editMode);updateProgress(config,checked);
  }

  function updateProgress(config,checked){
    const count=config.filter(item=>checked.has(item.id)).length,total=config.length,el=$('#quickPackCountV28'),root=$('#quickPackV28');
    if(el)el.textContent=`${count}/${total}`;const ready=total>0&&count===total;root?.classList.toggle('ready',ready);
    if(ready&&!root?.dataset.readyAnnounced){root.dataset.readyAnnounced='1';pulse(root,'quickPackReadyPulseV28');haptic([10,20,10]);if(typeof globalThis.toast==='function')globalThis.toast('持ち物 READY ✓')}
    if(!ready&&root)delete root.dataset.readyAnnounced;
  }

  function open(){
    ensureUi();render();const overlay=$('#packStandaloneV30');if(!overlay)return;
    returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    overlay.hidden=false;document.body.classList.add('packOpenV30');syncPackTab(true);$('#packStandaloneCloseV30')?.focus();
  }

  function close(){
    const overlay=$('#packStandaloneV30');if(!overlay||overlay.hidden)return;
    overlay.hidden=true;document.body.classList.remove('packOpenV30');syncPackTab(false);returnFocus?.focus?.();returnFocus=null;
  }

  function playPlanEffect(){
    const cast=$('.firstCast');if(cast){cast.classList.remove('gameFeelCastV28');void cast.offsetWidth;cast.classList.add('gameFeelCastV28');setTimeout(()=>cast.classList.remove('gameFeelCastV28'),520)}
    $$('.gearItem').forEach((item,index)=>{item.style.setProperty('--gf-order',index);item.classList.remove('gameFeelGearV28');void item.offsetWidth;item.classList.add('gameFeelGearV28');setTimeout(()=>item.classList.remove('gameFeelGearV28'),650)});
  }

  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#packStandaloneV30')?.hidden)close()});
  const observeTarget=selector=>{const el=$(selector);if(el)new MutationObserver(playPlanEffect).observe(el,{childList:true,subtree:true,characterData:true})};
  ensureUi();render();observeTarget('#rname');observeTarget('#pmethod');
  const tabObserver=new MutationObserver(()=>{ensureTab();if(!$('#packStandaloneV30')?.hidden)syncPackTab(true)});tabObserver.observe(document.body,{childList:true,subtree:true});
  globalThis.FISH_TARGET_QUICK_PACK=Object.freeze({version:'PACK-STANDALONE-V30',defaults:DEFAULTS.map(item=>({...item})),render,open,close,clearChecks});
})();