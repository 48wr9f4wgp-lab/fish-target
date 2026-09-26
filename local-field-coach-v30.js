(()=>{
  const VERSION='LOCAL-FIELD-COACH-V30';
  const HANDLER='fishTargetLocalLLM';
  const REQUEST_TIMEOUT_MS=8000;
  const pending=new Map();
  const $=(selector,root=document)=>root.querySelector(selector);
  const text=value=>String(value??'').trim();
  const nativeHandler=()=>globalThis.webkit?.messageHandlers?.[HANDLER]||null;
  const nativeAvailable=()=>Boolean(nativeHandler()?.postMessage);

  function currentPlan(){
    const auto=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.();
    if(auto?.plan)return auto.plan;
    const resolver=globalThis.FISH_TARGET_RESOLVER;
    const species=text($('#rname')?.textContent);
    const method=text($('#pmethod')?.textContent);
    if(!resolver?.resolveMethods||!species)return null;
    const plans=resolver.resolveMethods(species)||[];
    return plans.find(plan=>text(plan?.method)===method)||plans[0]||null;
  }

  function selectedTackle(){
    const state=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.();
    if(state?.status!=='ready')return {rod:null,reel:null};
    const rod=state.rods?.[state.rodIndex]?.product;
    const reel=state.reels?.[state.reelIndex]?.product;
    const label=product=>product?text(product.display_name||[product.maker,product.model].filter(Boolean).join(' ')):null;
    return {rod:label(rod),reel:label(reel)};
  }

  function buildPayload(){
    const plan=currentPlan();
    if(!plan)return null;
    const tackle=selectedTackle();
    return {
      schema:1,
      task:'render_field_coach',
      language:'ja',
      request_id:'ft-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
      facts:{
        species:text(plan.species_name||$('#rname')?.textContent),
        method:text(plan.method||$('#pmethod')?.textContent),
        requirements:{
          rod:text(plan.requirements?.rod),
          reel:text(plan.requirements?.reel),
          line:text(plan.requirements?.line),
          leader:text(plan.requirements?.leader),
          rig:text(plan.requirements?.rig)
        },
        first_cast:{
          bait:text(plan.first_cast?.bait),
          size:text(plan.first_cast?.size),
          action:text(plan.first_cast?.action)
        },
        selected_tackle:tackle
      },
      rules:{
        max_sentences:3,
        use_only_facts:true,
        do_not_calculate:true,
        do_not_select_products:true,
        do_not_invent_numbers:true,
        plain_text_only:true
      }
    };
  }

  function ensureUi(){
    if($('#localFieldCoachV30')||!nativeAvailable())return;
    const anchor=$('#tackleAutoBuildV29')||$('#tackleFitCard')||$('#gear');
    if(!anchor)return;
    const section=document.createElement('section');
    section.id='localFieldCoachV30';
    section.className='card localFieldCoachV30';
    section.setAttribute('aria-label','オフラインAIフィールドコーチ');
    section.innerHTML='<div class="localCoachHeadV30"><div><span>OFFLINE AI</span><strong>FIELD COACH</strong><small>端末内モデルで結果を3行に要約</small></div><button id="localCoachRunV30" type="button">説明する</button></div><div id="localCoachStatusV30" class="localCoachStatusV30">通信せず、確定済みの釣法データだけを文章化します。</div><div id="localCoachAnswerV30" class="localCoachAnswerV30" hidden></div>';
    anchor.insertAdjacentElement('afterend',section);
    $('#localCoachRunV30')?.addEventListener('click',run);
  }

  function setBusy(busy){
    const button=$('#localCoachRunV30');
    if(!button)return;
    button.disabled=busy;
    button.textContent=busy?'生成中…':'説明する';
  }

  function settle(requestId,result){
    const item=pending.get(requestId);
    if(!item)return;
    clearTimeout(item.timer);
    pending.delete(requestId);
    item.resolve(result);
  }

  function requestNative(payload){
    return new Promise((resolve,reject)=>{
      const handler=nativeHandler();
      if(!handler?.postMessage){reject(new Error('native-llm-unavailable'));return}
      const timer=setTimeout(()=>{
        pending.delete(payload.request_id);
        reject(new Error('native-llm-timeout'));
      },REQUEST_TIMEOUT_MS);
      pending.set(payload.request_id,{resolve,reject,timer});
      handler.postMessage(payload);
    });
  }

  function fallbackText(payload){
    const f=payload?.facts||{};
    const cast=f.first_cast||{};
    const bits=[];
    if(f.species||f.method)bits.push([f.species,f.method].filter(Boolean).join(' · '));
    if(cast.bait||cast.size)bits.push('最初は '+[cast.bait,cast.size].filter(Boolean).join(' ')+' から開始。');
    if(cast.action)bits.push(cast.action);
    return bits.slice(0,3).join('\n')||'既存の推奨表示を確認してください。';
  }

  async function run(){
    ensureUi();
    const payload=buildPayload();
    const status=$('#localCoachStatusV30'),answer=$('#localCoachAnswerV30');
    if(!payload){if(status)status.textContent='現在の釣法データを取得できません。';return}
    setBusy(true);
    if(status)status.textContent='端末内モデルで生成中…';
    try{
      const result=await requestNative(payload);
      const output=text(result?.text);
      if(!output)throw new Error('empty-local-llm-output');
      if(answer){answer.textContent=output;answer.hidden=false}
      if(status)status.textContent='OFFLINE · 端末内生成';
    }catch(error){
      if(answer){answer.textContent=fallbackText(payload);answer.hidden=false}
      if(status)status.textContent='AI生成に失敗したため、既存データから簡易表示しました。';
      console.warn('Local FIELD COACH failed',error);
    }finally{
      setBusy(false);
    }
  }

  function resolve(requestId,result){settle(requestId,result||{})}
  function reject(requestId,message){settle(requestId,{text:'',error:text(message)||'native-error'})}

  const start=()=>{
    ensureUi();
    const target=$('#rname');
    if(target)new MutationObserver(()=>{if(nativeAvailable())ensureUi()}).observe(target,{childList:true,subtree:true,characterData:true});
  };
  start();

  globalThis.FISH_TARGET_LOCAL_FIELD_COACH=Object.freeze({
    version:VERSION,
    nativeAvailable,
    buildPayload,
    run,
    resolve,
    reject
  });
})();