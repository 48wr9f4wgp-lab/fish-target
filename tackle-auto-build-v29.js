(()=>{
  const VERSION='TACKLE-AUTO-BUILD-V29';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const statusRank=Object.freeze({current:0,unknown:1,discontinued:2,legacy:3});
  const MAX_ALTERNATES=3;
  let state={status:'idle',plan:null,rods:[],reels:[],rodIndex:0,reelIndex:0,error:null};

  const catalogEnabled=()=>document.documentElement.dataset.catalogRuntime!=='off';
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

  function ensureUi(){
    if($('#tackleAutoBuildV29'))return;
    const anchor=$('#tackleFitCard')||$('#gear');
    if(!anchor)return;
    const section=document.createElement('section');
    section.id='tackleAutoBuildV29';section.className='card tackleAutoBuildV29';section.setAttribute('aria-label','タックル自動構成');
    section.innerHTML=`
      <div class="autoBuildHeadV29">
        <div><span>TACKLE AUTO BUILD</span><strong>おすすめセットを組む</strong><small id="autoBuildPlanV29">魚と釣法から自動構成</small></div>
        <button id="autoBuildRunV29" type="button">AUTO BUILD</button>
      </div>
      <div class="autoBuildStatusV29" id="autoBuildStatusV29">タップするとCatalogを読み込み、適合度と現行性から候補を組みます。</div>
      <div class="autoBuildResultV29" id="autoBuildResultV29" hidden>
        <div class="autoBuildRailV29" aria-hidden="true"><span>ROD</span><i>›</i><span>REEL</span><i>›</i><span>LINE</span><i>›</i><span>RIG</span></div>
        <div class="autoBuildStagesV29">
          <article class="autoBuildStageV29" data-stage="rod"><div class="autoBuildStageTopV29"><span>01 · ROD</span><button type="button" data-alt="rod">別候補</button></div><b></b><small></small><div class="autoBuildBadgesV29"></div></article>
          <article class="autoBuildStageV29" data-stage="reel"><div class="autoBuildStageTopV29"><span>02 · REEL</span><button type="button" data-alt="reel">別候補</button></div><b></b><small></small><div class="autoBuildBadgesV29"></div></article>
          <article class="autoBuildStageV29" data-stage="line"><div class="autoBuildStageTopV29"><span>03 · LINE</span></div><b></b><small></small></article>
          <article class="autoBuildStageV29" data-stage="rig"><div class="autoBuildStageTopV29"><span>04 · RIG</span></div><b></b><small></small></article>
        </div>
        <div class="autoBuildReadyV29"><span>SET READY</span><small>価格・在庫・所有状況は判定外。MY TACKLEには自動登録しません。</small></div>
      </div>`;
    anchor.insertAdjacentElement('afterend',section);
    $('#autoBuildRunV29')?.addEventListener('click',run);
    $$('[data-alt]',section).forEach(button=>button.addEventListener('click',()=>cycle(button.dataset.alt)));
    syncPlanLabel();
    if(!catalogEnabled())renderUnavailable();
  }

  function syncPlanLabel(){
    const plan=currentPlan();const label=$('#autoBuildPlanV29');
    if(label)label.textContent=plan?`${plan.species_name} · ${plan.method}`:'魚と釣法から自動構成';
  }
  function renderUnavailable(){
    const run=$('#autoBuildRunV29'),status=$('#autoBuildStatusV29');
    if(run){run.disabled=true;run.textContent='CATALOG OFF'}
    if(status)status.textContent='公開ビルドでは商品Catalogを配信していないため、自動構成は利用できません。必須タックル表示と手入力MY TACKLEは利用できます。';
  }
  function renderIdle(){
    const result=$('#autoBuildResultV29'),status=$('#autoBuildStatusV29'),run=$('#autoBuildRunV29');
    if(result)result.hidden=true;
    if(run&&!catalogEnabled()){renderUnavailable();return}
    if(run){run.disabled=false;run.textContent='AUTO BUILD'}
    if(status)status.textContent='タップするとCatalogを読み込み、適合度と現行性から候補を組みます。';
  }
  const stage=(name)=>$(`.autoBuildStageV29[data-stage="${name}"]`);
  function renderProduct(kind,item,index,total){
    const root=stage(kind);if(!root||!item)return;
    const product=item.product||{},level=fitLevel(item),status=globalThis.FISH_TARGET_CATALOG_RUNTIME?.statusInfo?.(product.status)||{label:product.status||'状態不明'};
    $('b',root).textContent=product.display_name||`${product.maker||''} ${product.model||''}`.trim();
    $('small',root).textContent=[product.maker,product.series,`${index+1}/${Math.min(total,MAX_ALTERNATES)}候補`].filter(Boolean).join(' · ');
    const badges=$('.autoBuildBadgesV29',root);if(badges)badges.innerHTML=`<span class="${fitClass(level)}">${esc(fitLabel(level))}</span><span>${esc(status.label)}</span><span>${esc(sourceLabel(item))}</span>`;
    const alt=$('[data-alt]',root);if(alt)alt.disabled=Math.min(total,MAX_ALTERNATES)<=1;
  }
  function renderBuild(){
    const plan=state.plan,result=$('#autoBuildResultV29'),status=$('#autoBuildStatusV29'),run=$('#autoBuildRunV29');
    if(!plan||!state.rods.length||!state.reels.length)return;
    const rod=state.rods[state.rodIndex],reel=state.reels[state.reelIndex];
    renderProduct('rod',rod,state.rodIndex,state.rods.length);renderProduct('reel',reel,state.reelIndex,state.reels.length);
    const line=stage('line'),rig=stage('rig');
    if(line){$('b',line).textContent=plan.requirements?.line||'推奨ラインを確認';$('small',line).textContent=plan.requirements?.leader?`リーダー / ハリス: ${plan.requirements.leader}`:'リーダー / ハリスは釣法条件に合わせる'}
    if(rig){$('b',rig).textContent=plan.requirements?.rig||'仕掛けを確認';$('small',rig).textContent=`FIRST CAST: ${plan.first_cast?.bait||'-'} ${plan.first_cast?.size||''}`.trim()}
    if(result){result.hidden=false;result.classList.remove('assemblingV29');void result.offsetWidth;result.classList.add('assemblingV29')}
    if(status)status.textContent=`${plan.species_name} · ${plan.method} の候補を構成しました。`;
    if(run){run.disabled=false;run.textContent='再構成'}
    haptic([8,16,8]);
  }

  async function run(){
    ensureUi();if(!catalogEnabled()){renderUnavailable();return}
    if(state.status==='loading')return;
    const plan=currentPlan(),loader=globalThis.FISH_TARGET_CATALOG_LOADER,resolver=globalThis.FISH_TARGET_RESOLVER;
    if(!plan||!loader?.ensureLoaded||!resolver?.matchCatalog){state={...state,status:'error',error:'resolver-unavailable'};const status=$('#autoBuildStatusV29');if(status)status.textContent='自動構成に必要なプラン情報を取得できません。';return}
    state={status:'loading',plan,rods:[],reels:[],rodIndex:0,reelIndex:0,error:null};
    const runButton=$('#autoBuildRunV29'),status=$('#autoBuildStatusV29'),result=$('#autoBuildResultV29');
    if(runButton){runButton.disabled=true;runButton.textContent='構成中…'}if(status)status.textContent='Catalogを読み込み中…';if(result)result.hidden=true;
    try{
      const catalog=await loader.ensureLoaded();
      const matches=resolver.matchCatalog(plan.plan_id,{catalog,includeResearch:true,includeSynthetic:false});
      const rods=rankCategory(matches,'rod'),reels=rankCategory(matches,'reel');
      if(!rods.length||!reels.length)throw new Error('matching-catalog-candidate-missing');
      state={status:'ready',plan,rods,reels,rodIndex:0,reelIndex:0,error:null};renderBuild();
    }catch(error){
      state={...state,status:'error',error:String(error?.message||error)};
      if(runButton){runButton.disabled=false;runButton.textContent='再試行'}
      if(status)status.textContent='候補を構成できませんでした。必須タックル表示とMY TACKLEはそのまま利用できます。';
    }
  }
  function cycle(kind){
    if(state.status!=='ready')return;
    if(kind==='rod'&&state.rods.length){state.rodIndex=(state.rodIndex+1)%Math.min(MAX_ALTERNATES,state.rods.length)}
    if(kind==='reel'&&state.reels.length){state.reelIndex=(state.reelIndex+1)%Math.min(MAX_ALTERNATES,state.reels.length)}
    renderBuild();
  }
  function resetForPlanChange(){state={status:'idle',plan:null,rods:[],reels:[],rodIndex:0,reelIndex:0,error:null};syncPlanLabel();renderIdle()}

  ensureUi();
  const watch=selector=>{const el=$(selector);if(el)new MutationObserver(resetForPlanChange).observe(el,{childList:true,subtree:true,characterData:true})};
  watch('#rname');watch('#pmethod');
  globalThis.FISH_TARGET_TACKLE_AUTO_BUILD=Object.freeze({version:VERSION,currentPlan,run,cycle,getState:()=>({...state,rods:state.rods.slice(),reels:state.reels.slice()})});
})();