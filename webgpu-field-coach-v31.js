(()=>{
  const VERSION='WEBGPU-FIELD-COACH-V31';
  const MODEL='onnx-community/LFM2.5-350M-ONNX';
  const TRANSFORMERS_URL='https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
  const $=(selector,root=document)=>root.querySelector(selector);
  const clean=value=>String(value??'').trim();
  const supported=()=>Boolean(navigator.gpu);
  let enginePromise=null;
  let ready=false;

  function currentPlan(){
    const auto=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.();
    if(auto?.plan)return auto.plan;
    const resolver=globalThis.FISH_TARGET_RESOLVER;
    const species=clean($('#rname')?.textContent);
    const method=clean($('#pmethod')?.textContent);
    if(!resolver?.resolveMethods||!species)return null;
    const plans=resolver.resolveMethods(species)||[];
    return plans.find(plan=>clean(plan?.method)===method)||plans[0]||null;
  }

  function selectedTackle(){
    const state=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.();
    if(state?.status!=='ready')return {rod:null,reel:null};
    const productName=entry=>{
      const p=entry?.product;
      return p?clean(p.display_name||[p.maker,p.model].filter(Boolean).join(' ')):null;
    };
    return {
      rod:productName(state.rods?.[state.rodIndex]),
      reel:productName(state.reels?.[state.reelIndex])
    };
  }

  function facts(){
    const plan=currentPlan();
    if(!plan)return null;
    return {
      species:clean(plan.species_name||$('#rname')?.textContent),
      method:clean(plan.method||$('#pmethod')?.textContent),
      requirements:{
        rod:clean(plan.requirements?.rod),
        reel:clean(plan.requirements?.reel),
        line:clean(plan.requirements?.line),
        leader:clean(plan.requirements?.leader),
        rig:clean(plan.requirements?.rig)
      },
      first_cast:{
        bait:clean(plan.first_cast?.bait),
        size:clean(plan.first_cast?.size),
        action:clean(plan.first_cast?.action)
      },
      selected_tackle:selectedTackle()
    };
  }

  function systemPrompt(){
    return [
      'あなたは釣りアプリの説明係です。判断係ではありません。',
      '与えられたFACTSだけを使って、日本語で現場向けに最大3文で説明してください。',
      '新しい数値、商品、魚種、釣法、条件を追加しないでください。',
      '計算、適合判定、安全判定、商品選択をしないでください。',
      'FACTSにない情報を推測しないでください。',
      '箇条書き番号や見出しを付けず、プレーンテキストだけを返してください。'
    ].join('\n');
  }

  function numberSet(value){
    return new Set((String(value).match(/\d+(?:\.\d+)?/g)||[]));
  }

  function guardOutput(raw,sourceFacts){
    let text=clean(raw)
      .replace(/<think>[\s\S]*?<\/think>/gi,'')
      .replaceAll(String.fromCharCode(96,96,96),'')
      .trim();
    if(!text)throw new Error('empty-output');

    const allowed=numberSet(JSON.stringify(sourceFacts));
    for(const token of numberSet(text)){
      if(!allowed.has(token))throw new Error('invented-number:'+token);
    }

    const chunks=text
      .replace(/([。！？])/g,'$1\n')
      .split(/\n+/)
      .map(x=>x.trim())
      .filter(Boolean)
      .slice(0,3);

    if(!chunks.length)throw new Error('empty-output');
    return chunks.join('\n').slice(0,280);
  }

  function fallbackText(sourceFacts){
    const lines=[];
    if(sourceFacts.species||sourceFacts.method){
      lines.push([sourceFacts.species,sourceFacts.method].filter(Boolean).join(' · '));
    }
    const cast=sourceFacts.first_cast||{};
    if(cast.bait||cast.size)lines.push('最初は '+[cast.bait,cast.size].filter(Boolean).join(' ')+'から開始。');
    if(cast.action)lines.push(cast.action);
    return lines.slice(0,3).join('\n')||'既存の推奨表示を確認してください。';
  }

  function progressLabel(event){
    const file=clean(event?.file).split('/').pop();
    const pct=Number(event?.progress);
    if(Number.isFinite(pct)&&pct>=0)return 'AIモデルを準備中 · '+Math.round(pct)+'%'+(file?' · '+file:'');
    if(event?.status==='ready')return 'AIモデル準備完了';
    return 'AIモデルを準備中'+(file?' · '+file:'');
  }

  async function getEngine(onProgress){
    if(enginePromise)return enginePromise;

    enginePromise=(async()=>{
      const test=globalThis.FISH_TARGET_WEBGPU_COACH_TEST_BACKEND;
      if(test){
        await test.load?.(onProgress);
        ready=true;
        return test;
      }

      if(!supported())throw new Error('webgpu-unavailable');
      const {pipeline,env}=await import(TRANSFORMERS_URL);
      env.allowLocalModels=false;
      env.allowRemoteModels=true;
      env.useBrowserCache=true;
      env.useWasmCache=true;
      env.cacheKey='fish-target-transformers-v31';

      const generator=await pipeline('text-generation',MODEL,{
        device:'webgpu',
        dtype:'q4f16',
        progress_callback:onProgress
      });
      ready=true;
      return {
        async generate(messages){
          const output=await generator(messages,{
            max_new_tokens:96,
            do_sample:false,
            repetition_penalty:1.05
          });
          const generated=output?.[0]?.generated_text;
          if(Array.isArray(generated))return clean(generated.at(-1)?.content);
          return clean(generated);
        }
      };
    })().catch(error=>{
      enginePromise=null;
      ready=false;
      throw error;
    });

    return enginePromise;
  }

  function ensureUi(){
    if($('#webgpuFieldCoachV31')||!supported())return;
    const anchor=$('#tackleAutoBuildV29')||$('#tackleFitCard')||$('#gear');
    if(!anchor)return;
    const section=document.createElement('section');
    section.id='webgpuFieldCoachV31';
    section.className='card webgpuFieldCoachV31';
    section.setAttribute('aria-label','ブラウザ内ローカルAIフィールドコーチ');
    section.innerHTML=
      '<div class="webgpuCoachHeadV31">'+
        '<div><span>LOCAL AI · WEBGPU</span><strong>FIELD COACH</strong><small>LFM2.5 350M · Safari内で端末処理</small></div>'+
        '<button id="webgpuCoachRunV31" type="button">説明する</button>'+
      '</div>'+
      '<div id="webgpuCoachStatusV31" class="webgpuCoachStatusV31">初回だけAIモデルを取得します。取得後はブラウザキャッシュから再利用します。</div>'+
      '<div id="webgpuCoachAnswerV31" class="webgpuCoachAnswerV31" hidden></div>';
    anchor.insertAdjacentElement('afterend',section);
    $('#webgpuCoachRunV31')?.addEventListener('click',run);
  }

  function setBusy(busy){
    const button=$('#webgpuCoachRunV31');
    if(!button)return;
    button.disabled=busy;
    button.textContent=busy?(ready?'生成中…':'準備中…'):'説明する';
  }

  async function run(){
    ensureUi();
    const sourceFacts=facts();
    const status=$('#webgpuCoachStatusV31');
    const answer=$('#webgpuCoachAnswerV31');
    if(!sourceFacts){if(status)status.textContent='現在の釣法データを取得できません。';return}

    setBusy(true);
    if(status)status.textContent=ready?'端末内で生成中…':'初回モデルを準備中…';
    try{
      const engine=await getEngine(event=>{
        if(status)status.textContent=progressLabel(event);
      });
      if(status)status.textContent='端末内WebGPUで生成中…';
      const raw=await engine.generate([
        {role:'system',content:systemPrompt()},
        {role:'user',content:'FACTS:\n'+JSON.stringify(sourceFacts)}
      ]);
      const output=guardOutput(raw,sourceFacts);
      if(answer){answer.textContent=output;answer.hidden=false}
      if(status)status.textContent='LOCAL · WebGPU · 通信API不使用';
    }catch(error){
      if(answer){answer.textContent=fallbackText(sourceFacts);answer.hidden=false}
      if(status)status.textContent=navigator.onLine
        ?'ローカルAIを使えなかったため、既存データから簡易表示しました。'
        :'モデル未準備またはキャッシュ不足のため、既存データから簡易表示しました。';
      console.warn('WebGPU FIELD COACH failed',error);
    }finally{
      setBusy(false);
    }
  }

  ensureUi();
  const target=$('#rname');
  if(target)new MutationObserver(ensureUi).observe(target,{childList:true,subtree:true,characterData:true});

  globalThis.FISH_TARGET_WEBGPU_FIELD_COACH=Object.freeze({
    version:VERSION,
    model:MODEL,
    supported,
    facts,
    guardOutput,
    fallbackText,
    run
  });
})();