(()=>{
  if(globalThis.__FISH_TARGET_ACCURACY__)return;
  globalThis.__FISH_TARGET_ACCURACY__=true;
  if(typeof F==='undefined'||typeof O==='undefined')return;

  const setVersion=()=>{
    document.title='FISH TARGET v20';
    const v=document.querySelector('.version');if(v)v.textContent='V20';
    const rb=document.querySelector('#result .toprow .brand');if(rb)rb.textContent='TARGET GAME PLAN · V20';
  };
  setVersion();

  const sawara=F.find(x=>x.name==='サワラ');
  if(sawara){
    Object.assign(sawara,{
      method:'ショアジギング',
      why:'堤防やサーフからメタルジグやブレード付きジグを遠投し、サゴシ〜サワラの回遊レンジを速度変化で広く探れる。',
      rig:'PE→リーダー→スナップ/リング→メタルジグ',
      bait:'メタルジグ / ブレード付きジグ',
      size:'30〜60g',
      baitAction:'高速ただ巻き / 軽いダート',
      range:'表層〜ボトム',
      action:'速巻き中心',
      steps:['潮目・ベイト・ナブラ周辺へ遠投する','まず速巻きで探り、反応がなければレンジを下げる','当たったレンジと速度を再現し、リーダーの傷を毎回確認する']
    });
  }
  if(O['サワラ']?.['船'])Object.assign(O['サワラ']['船'],{
    style:'lure',method:'ブレードジギング',
    why:'船からベイトの下〜魚のいるレンジへブレードジグを入れ、高速巻きでサワラへリアクションを出しやすい。',
    rod:'6〜7ft / M〜MH',reel:'4000〜5000番 HG〜XG',line:'PE 1.2〜2号',leader:'30〜40lb',
    rig:'PE→リーダー→ブレードジグ',bait:'ブレードジグ',size:'30〜60g',range:'ボトム〜中層',action:'高速ただ巻き',
    steps:['船長指示やベイト反応の下まで沈める','狙うレンジを高速巻きで長く通す','バイト後も慌てて大合わせせず巻きを維持し、取り込み後はリーダーを確認する']
  });

  const aori=F.find(x=>x.name==='アオリイカ');
  if(aori)aori.leader='フロロ 2.5〜3号';

  const tachiuo=F.find(x=>x.name==='タチウオ');
  if(tachiuo){tachiuo.style='bait';tachiuo.size='テンヤ2〜6号目安';}

  if(O['ヒラメ']?.['船'])O['ヒラメ']['船'].style='bait';
  if(O['タチウオ']?.['船'])O['タチウオ']['船'].style='bait';
  if(O['マダイ']?.['船'])O['マダイ']['船'].style='lure';

  const bass=F.find(x=>x.name==='ブラックバス');
  if(bass&&!bass.mistakes.some(x=>x.includes('生体'))){
    bass.mistakes=[...bass.mistakes,'特定外来生物のため、生きたままの運搬・保管などは原則禁止。釣り場・自治体のルールも確認する'];
  }

  if(typeof rotationFor==='function'){
    const originalRotationFor=rotationFor;
    rotationFor=function(p){
      if(typeof cur!=='undefined'&&cur?.name==='サワラ'&&typeof state!=='undefined'&&state.place!=='船'){
        return [
          {name:'ブレード付きジグ',size:'30〜50g',color:'シルバー/チャート',range:'中層〜表層',action:'高速ただ巻き',when:'基準'},
          {name:'メタルジグ',size:'30〜50g',color:'シルバー系',range:'表層〜ボトム',action:'ただ巻き＋軽いダート',when:'広く探る'},
          {name:'ミノー',size:'10〜14cm',color:'ベイト系',range:'表層〜中層',action:'ただ巻き/ジャーク',when:'魚が浮く'}
        ];
      }
      return originalRotationFor(p);
    };
  }

  if(typeof dynamicSize==='function'){
    dynamicSize=function(base){
      const s=base||'基準サイズ';
      const p=typeof basePlan==='function'&&typeof cur!=='undefined'&&cur?basePlan():null;
      const m=typeof LIVE!=='undefined'&&typeof cur!=='undefined'&&cur?.water==='salt'?LIVE.marine:null;
      const rough=!!m&&((+m.wave||0)>=1.2||(+m.current||0)>=2);
      const gramOrOz=/\d(?:[^\d]{0,8})?(?:g\b|oz\b)/i.test(s);
      const weightedGo=!!p&&/テンヤ/.test(p.method||'')&&/\d+(?:\.\d+)?\s*(?:〜|～|~|-)?\s*\d*(?:\.\d+)?\s*号/.test(s);
      if(!gramOrOz&&!weightedGo)return s;
      if((typeof state!=='undefined'&&state.wind==='強い')||rough)return s+'（重量は上限寄り）';
      if(typeof state!=='undefined'&&state.wind==='弱い'&&!rough)return s+'（軽量側も可）';
      return s;
    };
  }

  const syncPlanMeta=()=>{
    if(typeof cur==='undefined'||!cur||typeof basePlan!=='function')return;
    const p=basePlan();
    const el=document.getElementById('meta');
    if(el)el.textContent=(cur.water==='salt'?'SALT WATER':'FRESH WATER')+' / '+(p.style==='lure'?'LURE':'BAIT');
  };

  if(typeof renderResult==='function'){
    const previousRenderResult=renderResult;
    renderResult=function(...args){const out=previousRenderResult.apply(this,args);setVersion();syncPlanMeta();return out};
  }
  if(typeof renderHome==='function')renderHome();
  if(typeof cur!=='undefined'&&cur&&typeof renderResult==='function')renderResult();
})();
