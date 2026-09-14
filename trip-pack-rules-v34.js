(()=>{
  const VERSION='TRIP-PACK-RULES-V34';
  const text=value=>String(value??'').trim();
  const item=(id,name,category,priority,reason,extra={})=>Object.freeze({id,name,category,priority,reason,...extra,system:true});
  const unique=items=>{
    const seen=new Set();
    return items.filter(entry=>entry?.id&&!seen.has(entry.id)&&seen.add(entry.id));
  };

  const BASE=Object.freeze([
    item('prep-phone','スマホ','準備','recommended','プラン確認・連絡手段'),
    item('prep-drink','飲み物','準備','recommended','水分補給'),
    item('prep-towel','タオル','準備','optional','手や道具の水分・汚れ対策'),
    item('prep-trash','ゴミ袋','環境','recommended','糸・仕掛け・ゴミを持ち帰る'),
    item('prep-firstaid','救急用品','安全','recommended','小さなケガへの備え',{safetyCritical:true}),
    item('prep-battery','モバイルバッテリー','電源','optional','スマホ・ライトの予備電源')
  ]);

  function selectedOwnedSet(){
    const state=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.();
    return state?.setResult?.myBestSet||null;
  }

  function currentSpecies(plan){
    return globalThis.FISH_TARGET_SPECIES_REGISTRY?.resolve?.(plan?.species_name)||null;
  }

  function planItems(plan,ownedSet){
    if(!plan)return [];
    const req=plan.requirements||{},cast=plan.first_cast||{};
    const rodName=text(ownedSet?.rod?.name)||text(req.rod)||'推奨ロッドを確認';
    const reelName=text(ownedSet?.reel?.name)||text(req.reel)||'推奨リールを確認';
    const result=[
      item('plan-rod',`ロッド · ${rodName}`,'タックル','required',ownedSet?.rod?'今回のMY SETで選択':'この釣法の必要ロッド'),
      item('plan-reel',`リール · ${reelName}`,'タックル','required',ownedSet?.reel?'今回のMY SETで選択':'この釣法の必要リール')
    ];
    if(text(req.line))result.push(item('plan-line',`メインライン · ${text(req.line)}`,'ライン','required','この釣法の基準ライン'));
    if(text(req.leader))result.push(item('plan-leader',`リーダー / ハリス · ${text(req.leader)}`,'ライン','required','この釣法の接続ライン'));
    if(text(req.rig))result.push(item('plan-rig',`仕掛け · ${text(req.rig)}`,'仕掛け','required','この釣法の基本仕掛け'));
    const castLabel=[text(cast.bait),text(cast.size)].filter(Boolean).join(' · ');
    if(castLabel)result.push(item('plan-first-cast',`FIRST CAST · ${castLabel}`,'ルアー / エサ','required','最初に使うもの'));
    if(text(req.rig)||castLabel)result.push(item('plan-spare',`予備の${castLabel?'ルアー / エサ・仕掛け':'仕掛け'}`,'予備','recommended','ロスト・交換に備える'));
    return result;
  }

  function handlingItems(plan){
    if(!plan)return [];
    const req=plan.requirements||{},cast=plan.first_cast||{},species=currentSpecies(plan);
    const method=text(plan.method),bait=text(cast.bait);
    const styles=Array.isArray(species?.styles)?species.styles.map(text):[];
    const tags=Array.isArray(species?.tags)?species.tags.map(text):[];
    const lureLike=styles.includes('lure')||/ルアー|ジグ|エギ|スプーン|ミノー|ワーム|トップ|プラグ/i.test(`${method} ${bait}`);
    const largeGame=tags.some(tag=>/青物|大型|回遊魚/.test(tag))||/ショアジギング|オフショア|船ジギング|キャスティング|泳がせ/i.test(method);
    const result=[];
    if(text(req.line)||text(req.leader)||text(req.rig))result.push(item('handling-line-cutter','ラインカッター / ハサミ','ツール','recommended','結束・仕掛け交換時のライン処理'));
    if(lureLike)result.push(item('handling-pliers','プライヤー','ツール','recommended','フック・リング交換や安全な針外し'));
    if(largeGame)result.push(item('handling-landing','ランディングツール（タモ等）','取り込み','recommended','大型魚を安全に取り込める手段を釣り場に合わせて準備'));
    return result;
  }

  function contextItems(plan){
    if(!plan)return [];
    const result=[];
    const method=text(plan.method);
    const places=Array.isArray(plan.places)?plan.places.map(text).join(' '):'';
    const time=text(plan.first_cast?.time);
    const species=currentSpecies(plan);
    const isBoat=/船|ボート|オフショア/i.test(`${method} ${places}`);
    const isRock=/磯|ロックショア/i.test(`${method} ${places}`);
    const isNight=/夜|ナイト/i.test(time);
    const isDawnDusk=/朝夕|朝|夕|マヅメ|マズメ/i.test(time);

    if(isBoat||isRock){
      result.push(item('safety-lifejacket','ライフジャケット','安全','required',isBoat?'船・ボート系プランの安全装備':'磯系プランの安全装備',{safetyCritical:true}));
    }else if(species?.water==='salt'){
      result.push(item('safety-lifejacket','ライフジャケット','安全','recommended','海辺の釣行前に安全装備を確認',{safetyCritical:true}));
    }
    if(isRock)result.push(item('safety-footwear','滑りにくい履物','安全','recommended','磯・岩場での足元対策',{safetyCritical:true}));
    if(isNight){
      result.push(item('condition-light','ヘッドライト / ライト','安全','required','夜のプランで手元と足元を照らす',{safetyCritical:true}));
      result.push(item('condition-light-spare','ライト用の予備電源','電源','recommended','夜間のライト停止に備える',{safetyCritical:true}));
    }else if(isDawnDusk){
      result.push(item('condition-light','ヘッドライト / ライト','安全','recommended','暗い時間帯にかかる可能性へ備える',{safetyCritical:true}));
    }
    return result;
  }

  function derive(plan,options={}){
    const ownedSet=options.ownedSet===undefined?selectedOwnedSet():options.ownedSet;
    return unique([...planItems(plan,ownedSet),...handlingItems(plan),...contextItems(plan),...BASE]).map(entry=>({...entry}));
  }

  function planKey(plan){
    const id=text(plan?.plan_id);
    return id?`pack:${id}`:'pack:standalone';
  }

  globalThis.FISH_TARGET_TRIP_PACK=Object.freeze({
    version:VERSION,
    priorities:Object.freeze(['required','recommended','optional']),
    base:BASE.map(entry=>({...entry})),
    derive,
    planKey
  });
})();
