(()=>{
  const STORE_KEY='fish_target_v9_checklists';
  const CONFIG_KEY='__quick_pack_v28_config';
  const CHECKED_KEY='__quick_pack_v28_checked';
  const LEGACY_ACTIVE_KEY='pack:active';
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
  const PRIORITY_LABEL=Object.freeze({required:'必須',recommended:'推奨',optional:'任意'});
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalizeName=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
  let editMode=false;
  let returnFocus=null;
  const SAVE_FAILURE='保存できません。ブラウザの空き容量・サイトデータ設定を確認してください。';

  const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const readStore=()=>{try{const value=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');return isRecord(value)?value:{}}catch{return{}}};
  const setSaveStatus=message=>{if(typeof document==='undefined')return;const el=document.getElementById('quickPackSaveStatusV30');if(!el)return;el.textContent=message||'';el.hidden=!message};
  const writeStore=store=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(store));setSaveStatus('');return true}catch(error){console.warn('quick pack save failed',error);setSaveStatus(SAVE_FAILURE);return false}};
  const cloneDefaults=()=>DEFAULTS.map(item=>({...item,priority:'optional',reason:'自分用の標準リスト',system:false}));
  const normalizeEditable=item=>item&&item.id&&item.name?{id:String(item.id),name:String(item.name),priority:'optional',reason:'自分で追加・編集した項目',system:false}:null;

  function currentPlan(){
    const fromAuto=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.currentPlan?.();
    if(fromAuto?.plan_id)return fromAuto;
    const species=String($('#rname')?.textContent||'').trim(),method=String($('#pmethod')?.textContent||'').trim();
    if(!species)return null;
    const plans=globalThis.FISH_TARGET_METHOD_REGISTRY?.plansForSpecies?.(species)||[];
    return plans.find(plan=>String(plan?.method||'').trim()===method)||plans[0]||null;
  }
  const activeKey=()=>globalThis.FISH_TARGET_TRIP_PACK?.planKey?.(currentPlan())||LEGACY_ACTIVE_KEY;
  const contextualConfig=()=>globalThis.FISH_TARGET_TRIP_PACK?.derive?.(currentPlan())||[];
  const getEditableConfig=()=>{
    const store=readStore(),config=store[CONFIG_KEY];
    return Array.isArray(config)?config.map(normalizeEditable).filter(Boolean):cloneDefaults();
  };
  const mergeConfig=(contextual,editable)=>{
    const out=[],ids=new Set(),names=new Set();
    for(const raw of [...contextual,...editable]){
      if(!raw?.id||!raw?.name)continue;
      const id=String(raw.id),name=String(raw.name),nameKey=normalizeName(name);
      if(ids.has(id)||names.has(nameKey))continue;
      ids.add(id);names.add(nameKey);
      out.push({id,name,category:String(raw.category||''),priority:PRIORITY_LABEL[raw.priority]?raw.priority:'optional',reason:String(raw.reason||''),system:raw.system===true,safetyCritical:raw.safetyCritical===true});
    }
    return out;
  };
  const getConfig=()=>mergeConfig(contextualConfig(),getEditableConfig());
  const saveConfig=config=>{const store=readStore();store[CONFIG_KEY]=config.map(item=>({id:String(item.id),name:String(item.name)}));return writeStore(store)};
  const getChecked=()=>{
    const store=readStore(),all=isRecord(store[CHECKED_KEY])?store[CHECKED_KEY]:{},key=activeKey();
    const list=all[key]??(key==='pack:standalone'?all[LEGACY_ACTIVE_KEY]:null);
    return new Set(Array.isArray(list)?list:[]);
  };
  const saveChecked=checked=>{const store=readStore();const all=isRecord(store[CHECKED_KEY])?store[CHECKED_KEY]:{};all[activeKey()]=[...checked];store[CHECKED_KEY]=all;return writeStore(store)};
  const clearChecks=()=>{const store=readStore();const all=isRecord(store[CHECKED_KEY])?store[CHECKED_KEY]:{};delete all[activeKey()];store[CHECKED_KEY]=all;return writeStore(store)};
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
    overlay.id='packStandaloneV30';overlay.className='packStandaloneV30 tripReadyV34';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','持ち物');
    overlay.innerHTML=`
      <div class="packStandaloneTopV30">
        <div><span>TRIP READY</span><h2>持ち物</h2><p id="tripPackContextV34">忘れ物をまとめて確認</p></div>
        <button id="packStandaloneCloseV30" type="button" aria-label="持ち物を閉じる">×</button>
      </div>
      <section id="quickPackV28" class="quickPackV28 card" aria-label="持ち物チェックリスト">
        <div class="quickPackHeadV28">
          <div><strong>今回のチェックリスト</strong><small>必須を先に確認 · 自分用項目も追加できる</small></div>
          <div class="quickPackHeadActionsV28"><span id="quickPackCountV28">0/0</span><button id="quickPackEditV28" type="button" aria-expanded="false">編集</button></div>
        </div>
        <div class="quickPackSaveStatusV30" id="quickPackSaveStatusV30" role="status" aria-live="polite" hidden></div>
        <div class="quickPackListV28" id="quickPackListV28"></div>
        <div class="quickPackEditorV28" id="quickPackEditorV28" hidden>
          <form id="quickPackAddFormV28"><input id="quickPackAddInputV28" maxlength="24" autocomplete="off" placeholder="自分用の持ち物を追加" aria-label="持ち物を追加"><button type="submit">追加</button></form>
          <div class="quickPackEditorActionsV28"><button class="quickPackClearV28" id="quickPackClearV28" type="button">今回のチェック解除</button><button class="quickPackResetV28" id="quickPackResetV28" type="button">自分用リストを標準に戻す</button></div>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    $('#packStandaloneCloseV30')?.addEventListener('click',close);
    $('#quickPackEditV28')?.addEventListener('click',()=>{editMode=!editMode;render()});
    $('#quickPackAddFormV28')?.addEventListener('submit',event=>{
      event.preventDefault();const input=$('#quickPackAddInputV28');const name=String(input?.value||'').trim();if(!name)return;
      const config=getEditableConfig();if(config.some(item=>normalizeName(item.name)===normalizeName(name))){input.value='';return}
      config.push({id:`custom-${Date.now().toString(36)}`,name});if(!saveConfig(config))return;input.value='';render();pulse($('#quickPackV28'));
    });
    $('#quickPackClearV28')?.addEventListener('click',()=>{if(clearChecks()){render();pulse($('#quickPackV28'))}});
    $('#quickPackResetV28')?.addEventListener('click',()=>{
      const store=readStore();store[CONFIG_KEY]=DEFAULTS.map(item=>({...item}));if(writeStore(store)){render();pulse($('#quickPackV28'))}
    });
  }

  function render(){
    ensureUi();const root=$('#quickPackV28');if(!root)return;
    const plan=currentPlan(),context=$('#tripPackContextV34');
    if(context)context.textContent=plan?`${plan.species_name} · ${plan.method}の準備`:'忘れ物をまとめて確認';
    const config=getConfig(),checked=getChecked(),list=$('#quickPackListV28');
    for(const id of [...checked])if(!config.some(item=>item.id===id))checked.delete(id);
    const rank={required:0,recommended:1,optional:2};
    const ordered=config.slice().sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9));
    list.innerHTML=ordered.map(item=>{
      const id=escapeHtml(item.id),name=escapeHtml(item.name),priority=escapeHtml(PRIORITY_LABEL[item.priority]||'任意'),reason=escapeHtml(item.reason||''),category=escapeHtml(item.category||'');
      const meta=[category,reason].filter(Boolean).join(' · ');
      return `<div class="quickPackRowV28 tripPackRowV34 priority-${item.priority}${item.safetyCritical?' safetyCriticalV34':''}" data-id="${id}"><label class="quickPackItemV28"><input type="checkbox" ${checked.has(item.id)?'checked':''}><span class="quickPackCheckV28"></span><span class="tripPackTextV34"><b>${name}</b><small>${meta}</small></span><em class="tripPackPriorityV34">${priority}</em></label><button class="quickPackDeleteV28" type="button" aria-label="${name}を削除" ${editMode&&!item.system?'':'hidden'}>×</button></div>`
    }).join('');
    $$('.quickPackRowV28',list).forEach(row=>{
      const input=$('input',row),id=row.dataset.id;
      input.addEventListener('change',()=>{
        const wanted=input.checked,next=getChecked();wanted?next.add(id):next.delete(id);
        if(!saveChecked(next)){input.checked=!wanted;render();return}
        pulse(row);haptic(wanted?8:5);updateProgress(config,next);
      });
      $('.quickPackDeleteV28',row)?.addEventListener('click',()=>{
        const nextConfig=getEditableConfig().filter(item=>item.id!==id),next=getChecked();next.delete(id);
        if(saveConfig(nextConfig)&&saveChecked(next))render();
      });
    });
    const editor=$('#quickPackEditorV28');editor.hidden=!editMode;
    const edit=$('#quickPackEditV28');edit.textContent=editMode?'完了':'編集';edit.setAttribute('aria-expanded',String(editMode));
    root.classList.toggle('editing',editMode);updateProgress(config,checked);
  }

  function updateProgress(config,checked){
    const required=config.filter(item=>item.priority==='required'),requiredDone=required.filter(item=>checked.has(item.id)).length;
    const allDone=config.filter(item=>checked.has(item.id)).length,total=config.length,el=$('#quickPackCountV28'),root=$('#quickPackV28');
    if(el)el.textContent=required.length?`必須 ${requiredDone}/${required.length}`:`${allDone}/${total}`;
    const ready=required.length>0&&requiredDone===required.length;
    root?.classList.toggle('ready',ready);root?.classList.toggle('tripRequiredPendingV34',required.length>0&&!ready);
    if(ready&&!root?.dataset.readyAnnounced){root.dataset.readyAnnounced='1';pulse(root,'quickPackReadyPulseV28');haptic([10,20,10]);if(typeof globalThis.toast==='function')globalThis.toast('TRIP READY · 必須チェック完了 ✓')}
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
  const observeTarget=selector=>{const el=$(selector);if(el)new MutationObserver(()=>{playPlanEffect();if(!$('#packStandaloneV30')?.hidden)render()}).observe(el,{childList:true,subtree:true,characterData:true})};
  ensureUi();render();observeTarget('#rname');observeTarget('#pmethod');
  const tabObserver=new MutationObserver(()=>{ensureTab();if(!$('#packStandaloneV30')?.hidden)syncPackTab(true)});tabObserver.observe(document.body,{childList:true,subtree:true});
  globalThis.FISH_TARGET_QUICK_PACK=Object.freeze({version:'TRIP-READY-V34',defaults:DEFAULTS.map(item=>({...item})),render,open,close,clearChecks,currentPlan,getConfig,getChecked});
})();
