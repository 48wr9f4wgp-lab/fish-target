(()=>{
  const KEY='fish_target_v17_tackle';
  const POWER=['UL','L','ML','M','MH','H','XH'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nums=s=>(String(s||'').match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  const range=s=>{const n=nums(s);return n.length?{min:n[0],max:n[1]??n[0]}:null};
  const tokenValue=s=>{const t=String(s||'').trim();if(t.includes('/')){const [a,b]=t.split('/').map(Number);return b?a/b:NaN}return +t};
  const unitRange=(s,unit)=>{const text=String(s||''),n='(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)',between='(?:〜|～|~|-)';let m=text.match(new RegExp(`${n}\\s*${between}\\s*${n}\\s*${unit}`,'i'));if(m)return {min:tokenValue(m[1]),max:tokenValue(m[2])};m=text.match(new RegExp(`${n}\\s*${unit}`,'i'));if(m){const v=tokenValue(m[1]);return {min:v,max:v}}return null};
  const weightRange=s=>{const g=unitRange(s,'g\\b');if(g)return g;const oz=unitRange(s,'oz\\b');return oz?{min:oz.min*28.3495,max:oz.max*28.3495}:null};
  const distance=(v,r)=>v<r.min?r.min-v:v>r.max?v-r.max:0;
  const fmtRange=(r,suffix='')=>r?(r.min===r.max?`${round(r.min)}${suffix}`:`${round(r.min)}〜${round(r.max)}${suffix}`):'未判定';
  const round=v=>Math.round(v*10)/10;
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const x=raw?JSON.parse(raw):{};return {rods:Array.isArray(x.rods)?x.rods:[],reels:Array.isArray(x.reels)?x.reels:[]}}catch{return {rods:[],reels:[]}}};
  const powerRange=s=>{
    const tail=String(s||'').split('/').slice(1).join('/').trim().toUpperCase();
    if(!tail||/^\d/.test(tail))return null;
    const hits=POWER.filter(p=>new RegExp(`(^|[^A-Z])${p}([^A-Z]|$)`).test(tail));
    if(!hits.length)return null;
    const ranks=hits.map(p=>POWER.indexOf(p));
    return {min:Math.min(...ranks),max:Math.max(...ranks)};
  };
  const reelRange=s=>{
    const n=nums(s).filter(v=>v>=500&&v<=30000);
    return n.length?{min:n[0],max:n[1]??n[0]}:null;
  };
  const dedicatedCastingIntent=p=>/(投げ専用|投げ用リール|遠投リール|投げ・遠投)/.test(String(p?.reel||''));
  const dragIntent=p=>{const s=String(p?.reel||'');if(/ドラグ(?:付き|あり)/.test(s))return 'drag';if(/ドラグ(?:レス|なし)/.test(s))return 'no-drag';return null};
  const lineOptions=s=>String(s||'').split(/\s*\/\s*/).map(part=>{
    const type=/\bPE\b/i.test(part)?'PE':/ナイロン/.test(part)?'ナイロン':/フロロ/.test(part)?'フロロ':null;
    if(!type)return null;
    const no=unitRange(part,'号');if(no)return {type,unit:'号',range:no};
    const lb=unitRange(part,'lb\\b');if(lb)return {type,unit:'lb',range:lb};
    return {type,unit:null,range:null};
  }).filter(Boolean);
  const mark=l=>l===0?'○':l===1?'△':'×';
  const levelText=(l,ok,warn,bad)=>l===0?ok:l===1?warn:bad;

  function rodDetails(rod,p,r){
    if(!rod)return [];
    const out=[];
    const targetLen=/ft/i.test(p.rod||'')?range(p.rod?.match(/[^/]+/)?.[0]||p.rod):null;
    if(targetLen){
      if(+rod.length){const d=distance(+rod.length,targetLen),level=d===0?0:d<=1?1:2;out.push({name:'長さ',level,owned:`${rod.length}ft`,target:fmtRange(targetLen,'ft'),note:levelText(level,'推奨範囲内',`${d.toFixed(1)}ft差。立ち位置・飛距離を確認`,'推奨長から差が大きい')})}
      else out.push({name:'長さ',level:1,owned:'未入力',target:fmtRange(targetLen,'ft'),note:'長さ未入力のため要確認'});
    }
    const targetPower=powerRange(p.rod);
    if(targetPower){
      if(rod.power){
        const pr=POWER.indexOf(rod.power),d=distance(pr,targetPower),level=d===0?0:d<=1?1:2;
        const target=`${POWER[targetPower.min]}${targetPower.min===targetPower.max?'':`〜${POWER[targetPower.max]}`}`;
        const direction=pr>targetPower.max?'強め':pr<targetPower.min?'弱め':'範囲内';
        out.push({name:'パワー',level,owned:rod.power,target,note:levelText(level,'推奨範囲内',`推奨より1段${direction}`,'推奨パワーとの差が大きい')});
      }else out.push({name:'パワー',level:1,owned:'未入力',target:`${POWER[targetPower.min]}${targetPower.min===targetPower.max?'':`〜${POWER[targetPower.max]}`}`,note:'パワー未入力のため要確認'});
    }
    if(p.style!=='bait'){
      const castRange=weightRange(r?.size||p.size);
      if(castRange){
        if(+rod.maxLure){
          const level=+rod.maxLure>=castRange.max?0:+rod.maxLure>=castRange.min?1:2;
          out.push({name:'ルアー上限',level,owned:`MAX ${rod.maxLure}g`,target:fmtRange(castRange,'g'),note:levelText(level,'FIRST CAST上限まで対応','軽い側は対応。重い側は超える','FIRST CAST下限にも届かない')});
        }else out.push({name:'ルアー上限',level:1,owned:'未入力',target:fmtRange(castRange,'g'),note:'重量上限未入力のため要確認'});
      }
    }
    return out;
  }

  function reelDetails(reel,p){
    if(!reel)return [];
    const out=[];
    const target=reelRange(p.reel);
    if(target){
      if(+reel.size){const d=distance(+reel.size,target),level=d===0?0:d<=1000?1:2;out.push({name:'番手',level,owned:`${reel.size}番`,target:fmtRange(target,'番'),note:levelText(level,'推奨範囲内','1クラス差。糸巻量・重量を確認','推奨番手から差が大きい')})}
      else out.push({name:'番手',level:1,owned:reel.reelSizeRaw?`SIZE ${reel.reelSizeRaw}`:'未入力',target:fmtRange(target,'番'),note:'一般スピニング番手ではないため直接比較しない'});
    }
    if(dedicatedCastingIntent(p)){
      const known=String(reel.applicationRaw||'');const level=known?(/投げ|遠投/.test(known)?0:2):1;
      out.push({name:'リール種別',level,owned:known||'不明',target:'投げ・遠投専用',note:levelText(level,'専用用途が一致','商品種別が未登録のため要確認','投げ・遠投専用ではない')});
    }
    const drag=dragIntent(p);
    if(drag){
      const known=String(reel.dragTypeRaw||''),ok=drag==='drag'?/あり|付き/.test(known):/なし|レス/.test(known),level=known?(ok?0:2):1;
      out.push({name:'ドラグ種別',level,owned:known||'不明',target:drag==='drag'?'ドラグあり':'ドラグなし',note:levelText(level,'指定と一致','商品仕様が未登録のため要確認','指定と異なる')});
    }
    const options=lineOptions(p.line);
    if(options.length){
      const matched=reel.lineType?options.find(x=>x.type===reel.lineType):null;
      const allowed=[...new Set(options.map(x=>x.type))].join(' / ');
      if(reel.lineType)out.push({name:'ライン種',level:matched?0:1,owned:reel.lineType,target:allowed,note:matched?'推奨候補と一致':'推奨候補とは異なる'});
      else out.push({name:'ライン種',level:1,owned:'未入力',target:allowed,note:'ライン種類未入力のため要確認'});
      if(matched?.unit==='号'){
        if(+reel.lineNo){const d=distance(+reel.lineNo,matched.range),level=d===0?0:d<=0.5?1:2;out.push({name:'ライン号数',level,owned:`${reel.lineNo}号`,target:fmtRange(matched.range,'号'),note:levelText(level,'推奨範囲内','0.5号以内の差。飛距離/強度を確認','推奨号数との差が大きい')})}
        else out.push({name:'ライン号数',level:1,owned:'未入力',target:fmtRange(matched.range,'号'),note:'号数未入力のため要確認'});
      }else if(matched?.unit==='lb'){
        out.push({name:'ライン強度',level:1,owned:'MY TACKLEは号数入力',target:fmtRange(matched.range,'lb'),note:'lb表記は号数へ自動換算せず、実ラインの強度表示で確認'});
      }
    }
    return out;
  }

  const score=rows=>rows.length?Math.max(...rows.map(x=>x.level)):1;
  function bestRod(rods,p,r){return rods.map(x=>({item:x,rows:rodDetails(x,p,r)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null}
  function bestReel(reels,p){return reels.map(x=>({item:x,rows:reelDetails(x,p)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null}

  function render(){
    const body=document.getElementById('tackleFitBody');
    if(!body||typeof cur==='undefined'||!cur)return;
    const db=read();
    if(!db.rods.length&&!db.reels.length)return;
    const p=typeof basePlan==='function'?basePlan():cur;
    const r=typeof currentRotation==='function'?currentRotation(p):null;
    const rod=bestRod(db.rods,p,r),reel=bestReel(db.reels,p);
    const rows=[...(rod?.rows||[]),...(reel?.rows||[])];
    if(!rows.length)return;
    const hard=rows.filter(x=>x.level===2),soft=rows.filter(x=>x.level===1);
    const decision=hard.length?{klass:'bad',title:'買い足し候補あり',text:`${[...new Set(hard.map(x=>['長さ','パワー','ルアー上限'].includes(x.name)?'ロッド':'リール/ライン'))].join('・')}を優先して見直す`}:
      soft.length?{klass:'warn',title:'買い足し必須ではない',text:`△ ${soft.map(x=>x.name).join('・')}を確認してから使う`}:
      {klass:'good',title:'買い足し不要',text:'入力済み主要スペックは推奨範囲内'};
    const existing=document.getElementById('fitBreakdown');if(existing)existing.remove();
    body.insertAdjacentHTML('beforeend',`<div class="fitBreakdown" id="fitBreakdown"><div class="fitBreakdownHead"><b>判定の内訳</b><span>○ 推奨内 / △ 要確認 / × 差が大きい</span></div><div class="fitRows">${rows.map(x=>`<div class="fitCheckRow level${x.level}"><span class="name">${esc(x.name)}</span><span class="mark">${mark(x.level)}</span><div class="detail"><b>${esc(x.owned)} → 推奨 ${esc(x.target)}</b><small>${esc(x.note)}</small></div></div>`).join('')}</div><div class="buyDecision ${decision.klass}"><span>NEXT BUY</span><b>${esc(decision.title)} · ${esc(decision.text)}</b></div></div>`);
  }

  render();
  if(typeof renderResult==='function'){
    const prev=renderResult;
    renderResult=function(...args){const out=prev.apply(this,args);render();return out};
  }
})();