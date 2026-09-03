(()=>{
  const VERSION='TACKLE-AUTO-BUILD-V32';
  const OWNED_KEY='fish_target_v17_tackle';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const statusRank=Object.freeze({current:0,unknown:1,discontinued:2,legacy:3});
  const MAX_ALTERNATES=3;
  const compatibilityMeta=Object.freeze({
    ideal:{label:'理想に一致',className:'ideal'},
    good:{label:'かなり合う',className:'good'},
    usable:{label:'使える',className:'usable'},
    poor:{label:'ズレあり',className:'poor'},
    incompatible:{label:'不足あり',className:'incompatible'}
  });
  const gapLabels=Object.freeze({missing_component:'未登録',acceptable_substitution:'代用可',underspec:'不足',overspec:'過剰',incompatible:'不適合'});
  const componentLabels=Object.freeze({rod:'ROD',reel:'REEL',pair:'組み合わせ'});
  let state={status:'idle',plan:null,setResult:null,rods:[],reels:[],rodIndex:0,reelIndex:0,catalogReady:false,error:null};

  const catalogEnabled=()=>document.documentElement.dataset.catalogRuntime!=='off';
  const readOwned=()=>{try{const raw=typeof globalThis.storeGet==='function'?globalThis.storeGet(OWNED_KEY):localStorage.getItem(OWNED_KEY);const value=raw?JSON.parse(raw):{};return {rods:Array.isArray(value.rods)?value.rods:[],reels:Array.isArray(value.reels)?value.reels:[]}}catch{return {rods:[],reels:[]}}};
  const currentPlan=()=>{
    const resolver=globalThis.FISH_TARGET_RESOLVER;
    if(!resolver?.resolveMethods)return null;
    const species=String($('#rname')?.textContent||'').trim();
    const method=String($('#pmethod')?.textContent||'').trim();
    const plans=resolver.resolveMethods(species)||[];
    return plans.find(plan=>String(plan?.method||'').trim()===method)||plans[0]||null;
  };
  const fitLevel=item=>Number.isFinite(Number(item?.fit?.level))?Number(item.fit.level):99;
  const productStatus=item=>String(item?.product?.status||'unknown');
  const rankCategory=(matches,category)=>matches
    .filter(item=>item?.category===category&&!item?.synthetic)
    .sort((a,b)=>{
      const fit=fitLevel(a)-fitLevel(b);if(fit)return fit;
      const status=(statusRank[productStatus(a)]??9)-(statusRank[productStatus(b)]??9);if(status)return status;
      return String(a?.product?.display_name||'').localeCompare(String(b?.product?.display_name||''),'ja');
    });
  const fitLabel=level=>level===0?'適合':level===1?'条件付き':'要確認';
  const fitClass=level=>level===0?'good':level===1?'warn':'bad';
  const sourceLabel=item=>item?.production_eligible?'公開可':'参考データ';
  const haptic=pattern=>{try{navigator.vibrate?.(pattern)}catch{}};
  const compatibleForField=()=>['ideal','good','usable'].includes(state.setResult?.compatibility);

  function handleNextAction(){
    if(compatibleForField()){$('#fieldModeBtn')?.click();return}
    ($('#tackleManage')||$('.v19TackleShortcut'))?.click();
  }

  function ensureUi(){
    const anchor=$('#result .firstCast')||$('#tackleFitCard')||$('#gear');
    const existing=$('#tackleAutoBuildV29');
    if(existing){if(anchor&&existing.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',existing);return}
    if(!anchor)return;
    const section=document.createElement('section');
    section.id='tackleAutoBuildV29';section.className='card tackleAutoBuildV29';section.setAttribute('aria-label','タックル自動構成');
    section.innerHTML=`
      <div class="autoBuildHeadV29">
        <div><span>TACKLE AUTO BUILD</span><strong>STEP 3 · セットを組む</strong><small id="autoBuildPlanV29">理想＋MY TACKLE＋不足を一発判定</small></div>
        <button id="autoBuildRunV29" type="button">組む</button>
      </div>
      <div class="autoBuildStatusV29" id="autoBuildStatusV29" hidden></div>
      <div class="autoBuildResultV29" id="autoBuildResultV29" hidden>
        <div class="autoBuildSetSummaryV31" id="autoBuildSetSummaryV31">
          <article data-set-card="ideal"><span>IDEAL SET</span><b>理想スペック</b><small></small></article>
          <article data-set-card="owned"><span>MY SET</span><b>MY TACKLE未登録</b><small></small></article>
          <article data-set-card="gaps"><span>MISSING</span><b>不足を確認</b><small></small></article>
        </div>
        <details class="autoBuildDetailsV31" id="autoBuildDetailsV31" hidden>
          <summary>商品候補・詳細</summary>
          <div class="autoBuildRailV29" aria-hidden="true"><span>ROD</span><i>›</i><span>REEL</span><i>›</i><span>LINE</span><i>›</i><span>RIG</span></div>
          <div class="autoBuildStagesV29">
            <article class="autoBuildStageV29" data-stage="rod"><div class="autoBuildStageTopV29"><span>01 · ROD</span><button type="button" data-alt="rod">別候補</button></div><b></b><small></small><div class="autoBuildBadgesV29"></div></article>
            <article class="autoBuildStageV29" data-stage="reel"><div class="autoBuildStageTopV29"><span>02 · REEL</span><button type="button" data-alt="reel">別候補</button></div><b></b><small></small><div class="autoBuildBadgesV29"></div></article>
            <article class="autoBuildStageV29" data-stage="line"><div class="autoBuildStageTopV29"><span>03 · LINE</span></div><b></b><small></small></article>
            <article class="autoBuildStageV29" data-stage="rig"><div class="autoBuildStageTopV29"><span>04 · RIG</span></div><b></b><small></small></article>
          </div>
        </details>
        <div class="autoBuildReadyV29" id="autoBuildReadyV31"><span>SET READY</span><small>手持ちは変更しません</small><button id="autoBuildNextV32" type="button">STEP 4 · 現場へ</button></div>
      </div>`;
    anchor.insertAdjacentElement('afterend',section);
    $('#autoBuildRunV29')?.addEventListener('click',run);
    $('#autoBuildNextV32')?.addEventListener('click',handleNextAction);
    $$('[data-alt]',section).forEach(button=>button.addEventListener('click',()=>cycle(button.dataset.alt)));
    syncPlanLabel();
  }

  function syncPlanLabel(){
    const plan=currentPlan();const label=$('#autoBuildPlanV29');
    if(label)label.textContent=plan?`${plan.species_name} · ${plan.method} / 理想＋手持ち＋不足`:'理想＋MY TACKLE＋不足を一発判定';
  }
  function renderIdle(){
    const result=$('#autoBuildResultV29'),status=$('#autoBuildStatusV29'),run=$('#autoBuildRunV29'),details=$('#autoBuildDetailsV31');
    if(result)result.hidden=true;if(details)details.hidden=true;if(status){status.hidden=true;status.textContent=''}
    if(run){run.disabled=false;run.textContent='組む'}
  }
  const stage=name=>$(`.autoBuildStageV29[data-stage="${name}"]`);
  const setCard=name=>$(`[data-set-card="${name}"]`);
  function renderProduct(kind,item,index,total){
    const root=stage(kind);if(!root||!item)return;
    const product=item.product||{},level=fitLevel(item),status=globalThis.FISH_TARGET_CATALOG_RUNTIME?.statusInfo?.(product.status)||globalThis.FISH_TARGET_CATALOG?.statusInfo?.(product.status)||{label:product.status||'状態不明'};
    $('b',root).textContent=product.display_name||`${product.maker||''} ${product.model||''}`.trim();
    $('small',root).textContent=[product.maker,product.series,`${index+1}/${Math.min(total,MAX_ALTERNATES)}候補`].filter(Boolean).join(' · ');
    const badges=$('.autoBuildBadgesV29',root);if(badges)badges.innerHTML=`<span class="${fitClass(level)}">${esc(fitLabel(level))}</span><span>${esc(status.label)}</span><span>${esc(sourceLabel(item))}</span>`;
    const alt=$('[data-alt]',root);if(alt)alt.disabled=Math.min(total,MAX_ALTERNATES)<=1;
  }
  function renderSetSummary(){
    const result=state.setResult;if(!result)return;
    const ideal=result.idealSet,my=result.myBestSet,gaps=result.gaps||[],meta=compatibilityMeta[result.compatibility]||compatibilityMeta.incompatible;
    const idealCard=setCard('ideal'),ownedCard=setCard('owned'),gapCard=setCard('gaps');
    if(idealCard){
      $('b',idealCard).textContent='理想スペック';
      $('small',idealCard).textContent=[ideal?.rod?.raw,ideal?.reel?.raw,ideal?.main_line?.raw,ideal?.leader?.raw,ideal?.terminal?.rig].filter(Boolean).join(' / ')||'推奨条件を確認';
    }
    if(ownedCard){
      ownedCard.dataset.compatibility=meta.className;
      $('b',ownedCard).textContent=my?meta.label:'MY TACKLE未登録';
      $('small',ownedCard).textContent=my?[my.rod?.name||'ROD未登録',my.reel?.name||'REEL未登録'].join(' + '):'登録すると手持ちから最適な組み合わせを選びます。';
    }
    if(gapCard){
      if(!gaps.length){$('b',gapCard).textContent='不足なし';$('small',gapCard).textContent='このセットで進めやすい';}
      else{
        $('b',gapCard).textContent=gaps.map(gap=>componentLabels[gap.component]||gap.component).filter((value,index,array)=>array.indexOf(value)===index).join(' / ');
        $('small',gapCard).textContent=gaps.map(gap=>`${componentLabels[gap.component]||gap.component}: ${gapLabels[gap.type]||gap.type}`).join(' · ');
      }
    }
    const ready=$('#autoBuildReadyV31'),next=$('#autoBuildNextV32');if(ready){
      const okay=compatibleForField();ready.classList.toggle('needsCheckV31',!okay);
      $('span',ready).textContent=okay?'SET READY':'CHECK GAPS';
      $('small',ready).textContent=okay?'手持ちは変更しません':'不足を直してから現場へ';
      if(next){next.textContent=okay?'STEP 4 · 現場へ':my?'MY TACKLEを編集':'MY TACKLEを追加';next.dataset.next=okay?'field':'tackle'}
    }
  }
  function renderBuild(){
    const plan=state.plan,result=$('#autoBuildResultV29'),status=$('#autoBuildStatusV29'),run=$('#autoBuildRunV29'),details=$('#autoBuildDetailsV31');
    if(!plan||!state.setResult)return;
    renderSetSummary();
    if(state.catalogReady&&state.rods.length&&state.reels.length){
      const rod=state.rods[state.rodIndex],reel=state.reels[state.reelIndex];
      renderProduct('rod',rod,state.rodIndex,state.rods.length);renderProduct('reel',reel,state.reelIndex,state.reels.length);
      const line=stage('line'),rig=stage('rig');
      if(line){$('b',line).textContent=plan.requirements?.line||'推奨ラインを確認';$('small',line).textContent=plan.requirements?.leader?`リーダー / ハリス: ${plan.requirements.leader}`:'リーダー / ハリスは釣法条件に合わせる'}
      if(rig){$('b',rig).textContent=plan.requirements?.rig||'仕掛けを確認';$('small',rig).textContent=`FIRST CAST: ${plan.first_cast?.bait||'-'} ${plan.first_cast?.size||''}`.trim()}
      if(details)details.hidden=false;
    }else if(details)details.hidden=true;
    if(result){result.hidden=false;result.classList.remove('assemblingV29');void result.offsetWidth;result.classList.add('assemblingV29')}
    if(status){status.hidden=false;status.textContent=state.catalogReady?'セット判定完了 · 商品候補あり':'セット判定完了'}
    if(run){run.disabled=false;run.textContent='組み直す'}
    haptic([8,16,8]);
  }

  async function run(){
    ensureUi();if(state.status==='loading')return;
    const plan=currentPlan(),setResolver=globalThis.FISH_TARGET_TACKLE_SET_RESOLVER,resolver=globalThis.FISH_TARGET_RESOLVER,loader=globalThis.FISH_TARGET_CATALOG_LOADER;
    const status=$('#autoBuildStatusV29');
    if(!plan||!setResolver?.resolvePlan){state={...state,status:'error',error:'set-resolver-unavailable'};if(status){status.hidden=false;status.textContent='セット判定を取得できません。'}return}
    const setResult=setResolver.resolvePlan(plan,readOwned());
    if(!setResult){state={...state,status:'error',error:'set-resolution-failed'};if(status){status.hidden=false;status.textContent='セットを構成できませんでした。'}return}
    state={status:'loading',plan,setResult,rods:[],reels:[],rodIndex:0,reelIndex:0,catalogReady:false,error:null};
    const runButton=$('#autoBuildRunV29'),result=$('#autoBuildResultV29');
    if(runButton){runButton.disabled=true;runButton.textContent='構成中…'}if(status){status.hidden=false;status.textContent='理想セットとMY TACKLEを照合中…'}if(result)result.hidden=true;
    if(catalogEnabled()&&loader?.ensureLoaded&&resolver?.matchCatalog){
      try{
        const catalog=await loader.ensureLoaded();
        const matches=resolver.matchCatalog(plan.plan_id,'default',{catalog,includeResearch:true,includeSynthetic:false});
        const rods=rankCategory(matches,'rod'),reels=rankCategory(matches,'reel');
        state={...state,rods,reels,catalogReady:Boolean(rods.length&&reels.length)};
      }catch(error){state={...state,error:`catalog:${String(error?.message||error)}`}}
    }
    state={...state,status:'ready'};renderBuild();
  }
  function cycle(kind){
    if(state.status!=='ready'||!state.catalogReady)return;
    if(kind==='rod'&&state.rods.length)state.rodIndex=(state.rodIndex+1)%Math.min(MAX_ALTERNATES,state.rods.length);
    if(kind==='reel'&&state.reels.length)state.reelIndex=(state.reelIndex+1)%Math.min(MAX_ALTERNATES,state.reels.length);
    renderBuild();
  }
  function resetForPlanChange(){state={status:'idle',plan:null,setResult:null,rods:[],reels:[],rodIndex:0,reelIndex:0,catalogReady:false,error:null};ensureUi();syncPlanLabel();renderIdle()}

  ensureUi();
  const watch=selector=>{const el=$(selector);if(el)new MutationObserver(resetForPlanChange).observe(el,{childList:true,subtree:true,characterData:true})};
  watch('#rname');watch('#pmethod');
  globalThis.FISH_TARGET_TACKLE_AUTO_BUILD=Object.freeze({version:VERSION,currentPlan,run,cycle,readOwned,getState:()=>({...state,rods:state.rods.slice(),reels:state.reels.slice()})});
})();