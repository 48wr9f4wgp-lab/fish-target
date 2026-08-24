(()=>{
  const KEY='fish_target_v17_tackle';
  const POWER=['UL','L','ML','M','MH','H','XH'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nums=s=>(String(s||'').match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  const range=s=>{const n=nums(s);return n.length?{min:n[0],max:n[1]??n[0]}:null};
  const distance=(v,r)=>v<r.min?r.min-v:v>r.max?v-r.max:0;
  const fmtRange=(r,suffix='')=>r?(r.min===r.max?`${r.min}${suffix}`:`${r.min}〜${r.max}${suffix}`):'未判定';
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
  const lineSpec=s=>{
    const text=String(s||'');
    const type=/PE/i.test(text)?'PE':/ナイロン/.test(text)?'ナイロン':/フロロ/.test(text)?'フロロ':null;
    const n=nums(text);
    return {type,range:n.length?{min:n[0],max:n[1]??n[0]}:null};
  };
  const mark=l=>l===0?'○':l===1?'△':'×';
  const levelText=(l,ok,warn,bad)=>l===0?ok:l===1?warn:bad;

  function rodDetails(rod,p,r){
    if(!rod)return [];
    const out=[];
    const targetLen=/ft/i.test(p.rod||'')?range(p.rod?.match(/[^/]+/)?.[0]||p.rod):null;
    if(+rod.length&&targetLen){
      const d=distance(+rod.length,targetLen),level=d===0?0:d<=1?1:2;
      out.push({name:'長さ',level,owned:`${rod.length}ft`,target:fmtRange(targetLen,'ft'),note:levelText(level,'推奨範囲内',`${d.toFixed(1)}ft差。立ち位置・飛距離を確認`,'推奨長から差が大きい')});
    }else out.push({name:'長さ',level:1,owned:rod.length?`${rod.length}ft`:'未入力',target:targetLen?fmtRange(targetLen,'ft'):'対象外',note:'入力または推奨値が不足'});
    const targetPower=powerRange(p.rod);
    if(rod.power&&targetPower){
      const pr=POWER.indexOf(rod.power),d=distance(pr,targetPower),level=d===0?0:d<=1?1:2;
      const target=`${POWER[targetPower.min]}${targetPower.min===targetPower.max?'':`〜${POWER[targetPower.max]}`}`;
      const direction=pr>targetPower.max?'強め':pr<targetPower.min?'弱め':'範囲内';
      out.push({name:'パワー',level,owned:rod.power,target,note:levelText(level,'推奨範囲内',`推奨より1段${direction}`,'推奨パワーとの差が大きい')});
    }else out.push({name:'パワー',level:1,owned:rod.power||'未入力',target:targetPower?`${POWER[targetPower.min]}〜${POWER[targetPower.max]}`:'対象外',note:'入力または推奨値が不足'});
    if(p.style!=='bait'){
      const castRange=range(r?.size||p.size);
      if(+rod.maxLure&&castRange){
        const level=+rod.maxLure>=castRange.max?0:+rod.maxLure>=castRange.min?1:2;
        out.push({name:'ルアー上限',level,owned:`MAX ${rod.maxLure}g`,target:fmtRange(castRange,'g'),note:levelText(level,'FIRST CAST上限まで対応','軽い側は対応。重い側は超える','FIRST CAST下限にも届かない')});
      }else out.push({name:'ルアー上限',level:1,owned:rod.maxLure?`MAX ${rod.maxLure}g`:'未入力',target:castRange?fmtRange(castRange,'g'):'対象外',note:'入力またはFIRST CAST重量が不足'});
    }
    return out;
  }

  function reelDetails(reel,p){
    if(!reel)return [];
    const out=[];
    const target=reelRange(p.reel);
    if(+reel.size&&target){
      const d=distance(+reel.size,target),level=d===0?0:d<=1000?1:2;
      out.push({name:'番手',level,owned:`${reel.size}番`,target:fmtRange(target,'番'),note:levelText(level,'推奨範囲内','1クラス差。糸巻量・重量を確認','推奨番手から差が大きい')});
    }else out.push({name:'番手',level:1,owned:reel.size?`${reel.size}番`:'未入力',target:target?fmtRange(target,'番'):'対象外',note:'入力または推奨値が不足'});
    const spec=lineSpec(p.line);
    if(reel.lineType&&spec.type){
      const level=reel.lineType===spec.type?0:1;
      out.push({name:'ライン種',level,owned:reel.lineType,target:spec.type,note:level===0?'推奨と一致':'種類が異なる。用途とショック吸収を確認'});
    }else out.push({name:'ライン種',level:1,owned:reel.lineType||'未入力',target:spec.type||'対象外',note:'入力または推奨値が不足'});
    if(+reel.lineNo&&spec.range){
      const d=distance(+reel.lineNo,spec.range),level=d===0?0:d<=0.5?1:2;
      out.push({name:'ライン号数',level,owned:`${reel.lineNo}号`,target:fmtRange(spec.range,'号'),note:levelText(level,'推奨範囲内','0.5号以内の差。飛距離/強度を確認','推奨号数との差が大きい')});
    }else out.push({name:'ライン号数',level:1,owned:reel.lineNo?`${reel.lineNo}号`:'未入力',target:spec.range?fmtRange(spec.range,'号'):'対象外',note:'入力または推奨値が不足'});
    return out;
  }

  const score=rows=>rows.length?Math.max(...rows.map(x=>x.level)):1;
  function bestRod(rods,p,r){return rods.map(x=>({item:x,rows:rodDetails(x,p,r)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null}
  function bestReel(reels,p){return reels.map(x=>({item:x,rows:reelDetails(x,p)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null}

  function ensureVersion(){
    document.title='FISH TARGET v18';
    const v=document.querySelector('.version');if(v)v.textContent='V18';
    const rb=document.querySelector('#result .toprow .brand');if(rb)rb.textContent='TARGET GAME PLAN · V18';
  }

  function render(){
    ensureVersion();
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

  ensureVersion();
  render();
  if(typeof renderResult==='function'){
    const prev=renderResult;
    renderResult=function(...args){const out=prev.apply(this,args);render();return out};
  }
})();
