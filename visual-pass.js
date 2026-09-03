(()=>{
  const THEMES=Object.freeze({
    'ブリ・ワラサ':{top:'#355963',mid:'#799a9b',belly:'#e9efdf',accent:'#d9bb51',detail:'#365b61',outline:'#263f46',bg1:'#f4faf8',bg2:'#dcece8'},
    'カンパチ':{top:'#4c5351',mid:'#929080',belly:'#efe7cf',accent:'#d3a040',detail:'#4c4639',outline:'#343935',bg1:'#faf7ee',bg2:'#eee4ca'},
    'サワラ':{top:'#345660',mid:'#7ea0a6',belly:'#e5eeee',accent:'#365f69',detail:'#314e57',outline:'#213b43',bg1:'#f1f9f9',bg2:'#d7e9ec'},
    'シーバス':{top:'#455b59',mid:'#929e9b',belly:'#edf0e7',accent:'#657873',detail:'#3d514f',outline:'#263c3d',bg1:'#f5f8f6',bg2:'#dfe8e4'},
    'ヒラメ':{top:'#4f422f',mid:'#8e795c',belly:'#c9ad7e',accent:'#5d4b35',detail:'#46392a',outline:'#31291f',bg1:'#faf6ed',bg2:'#eadfc8'},
    'マゴチ':{top:'#514b35',mid:'#918467',belly:'#c6b997',accent:'#6b5d41',detail:'#514834',outline:'#393426',bg1:'#faf7ef',bg2:'#e8e0c9'},
    'アジ':{top:'#526b67',mid:'#91a69a',belly:'#f0f1d9',accent:'#d9bd4d',detail:'#486359',outline:'#30473f',bg1:'#f6faf2',bg2:'#e3eed8'},
    'メバル':{top:'#493a31',mid:'#846f5f',belly:'#c58e67',accent:'#b8794e',detail:'#544034',outline:'#382e29',bg1:'#faf3ed',bg2:'#ead9cc'},
    'アオリイカ':{top:'#684d43',mid:'#a68473',belly:'#ead3c6',accent:'#d6a68f',detail:'#654c44',outline:'#453532',bg1:'#fdf5f1',bg2:'#efdcd4'},
    'タチウオ':{top:'#52717b',mid:'#a9bbc0',belly:'#f5fafb',accent:'#628995',detail:'#496972',outline:'#2f4a52',bg1:'#f6fbfc',bg2:'#dfe9ed'},
    'クロダイ':{top:'#252c2c',mid:'#5e6865',belly:'#aeb3a7',accent:'#333d3b',detail:'#232d2d',outline:'#1b2526',bg1:'#f2f5f4',bg2:'#dce2e0'},
    'マダイ':{top:'#9b4f4a',mid:'#db8174',belly:'#f2c8af',accent:'#f0b18d',detail:'#8c4e4a',outline:'#683b39',bg1:'#fff5f1',bg2:'#f4d8d1'},
    'シロギス':{top:'#7d745f',mid:'#b9aa8d',belly:'#f1eadb',accent:'#d6bd9d',detail:'#756c5d',outline:'#514b41',bg1:'#fcfaf5',bg2:'#ede4d4'},
    'カワハギ':{top:'#676145',mid:'#a79a75',belly:'#d4c7a0',accent:'#635d45',detail:'#5d5740',outline:'#423f32',bg1:'#faf7ee',bg2:'#e9e1ca'},
    'ブラックバス':{top:'#304236',mid:'#687a61',belly:'#b6bea4',accent:'#364b37',detail:'#334532',outline:'#263529',bg1:'#f4f8f2',bg2:'#dce8d6'},
    'ニジマス':{top:'#415f5a',mid:'#889d99',belly:'#e9ded8',accent:'#da8990',detail:'#506d69',outline:'#344d4a',bg1:'#f5faf8',bg2:'#dfece8'},
    'アユ':{top:'#4f5b49',mid:'#8f9d80',belly:'#e6e5c9',accent:'#c2a04d',detail:'#596451',outline:'#3d493a',bg1:'#f6f9f2',bg2:'#e0ead5'},
    'コイ':{top:'#5c442e',mid:'#9a7953',belly:'#d5b17b',accent:'#c49559',detail:'#5e4933',outline:'#433525',bg1:'#faf5ee',bg2:'#ead9c5'},
    'ヤマメ・イワナ':{top:'#39463b',mid:'#6f7b69',belly:'#c6b18d',accent:'#d08357',detail:'#435044',outline:'#303a31',bg1:'#f5f7f2',bg2:'#dfe6d7'}
  });
  const FALLBACK={top:'#405e62',mid:'#7e9a9c',belly:'#e7eeee',accent:'#57a9a0',detail:'#3f6668',outline:'#2d4b4d',bg1:'#f4f9f8',bg2:'#dcebea'};
  let scheduled=false;
  let gradientSerial=0;

  function themeFor(name){return THEMES[name]||FALLBACK}
  function setTheme(el,name){
    if(!el||!name)return;
    const t=themeFor(name);
    el.style.setProperty('--fish-body',t.mid);
    el.style.setProperty('--fish-accent',t.accent);
    el.style.setProperty('--fish-detail',t.detail);
    el.style.setProperty('--fish-outline',t.outline);
    el.style.setProperty('--fish-bg1',t.bg1);
    el.style.setProperty('--fish-bg2',t.bg2);
  }
  function escapeId(value){return String(value||'fish').replace(/[^A-Za-z0-9_-]/g,'')||'fish'}
  function dimensionalizeSvg(svg,name){
    if(!svg||svg.dataset.realistic==='1')return;
    svg.dataset.realistic='1';
    svg.classList.add('fieldGuideArt','fieldGuideArtReal');
    const t=themeFor(name);
    const body=svg.querySelector('path[fill="currentColor"]');
    if(!body)return;
    const ns='http://www.w3.org/2000/svg';
    const key=`fishGrad-${escapeId(name)}-${gradientSerial++}`;
    const shineId=`${key}-shine`,clipId=`${key}-clip`;
    const defs=document.createElementNS(ns,'defs');
    const grad=document.createElementNS(ns,'linearGradient');
    grad.id=key;grad.setAttribute('x1','0');grad.setAttribute('y1','0');grad.setAttribute('x2','0');grad.setAttribute('y2','1');
    [[0,t.top],[.42,t.mid],[.72,t.belly],[1,'#fbfcf8']].forEach(([offset,color])=>{const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',String(offset));stop.setAttribute('stop-color',color);grad.appendChild(stop)});
    const shine=document.createElementNS(ns,'radialGradient');shine.id=shineId;shine.setAttribute('cx','42%');shine.setAttribute('cy','34%');shine.setAttribute('r','62%');
    [['0','#ffffff','0.72'],['.42','#ffffff','0.18'],['1','#ffffff','0']].forEach(([offset,color,opacity])=>{const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);stop.setAttribute('stop-opacity',opacity);shine.appendChild(stop)});
    const clip=document.createElementNS(ns,'clipPath');clip.id=clipId;
    const clipPath=document.createElementNS(ns,'path');clipPath.setAttribute('d',body.getAttribute('d')||'');clip.appendChild(clipPath);
    defs.append(grad,shine,clip);svg.insertBefore(defs,svg.firstChild);
    body.setAttribute('fill',`url(#${key})`);body.setAttribute('stroke',t.outline);body.setAttribute('stroke-width','1.4');body.setAttribute('stroke-linejoin','round');
    const sheen=document.createElementNS(ns,'ellipse');sheen.setAttribute('cx','92');sheen.setAttribute('cy','38');sheen.setAttribute('rx','70');sheen.setAttribute('ry','22');sheen.setAttribute('fill',`url(#${shineId})`);sheen.setAttribute('clip-path',`url(#${clipId})`);sheen.setAttribute('pointer-events','none');
    const belly=document.createElementNS(ns,'path');belly.setAttribute('d','M18 60 C55 82 126 88 171 62 C134 79 67 82 27 64 Z');belly.setAttribute('fill','#ffffff');belly.setAttribute('opacity',name==='ヒラメ'||name==='マゴチ'?'0.07':'0.18');belly.setAttribute('clip-path',`url(#${clipId})`);belly.setAttribute('pointer-events','none');
    body.insertAdjacentElement('afterend',sheen);sheen.insertAdjacentElement('afterend',belly);
    svg.querySelectorAll('.stripe,.spot').forEach(el=>{el.setAttribute('fill',t.accent);el.style.opacity='.82';el.style.mixBlendMode='multiply'});
    svg.querySelectorAll('.detail').forEach(el=>{el.setAttribute('stroke',t.detail);el.style.opacity='.88'});
    svg.querySelectorAll('.eyeWhite').forEach(el=>{el.setAttribute('fill','#f8fbf7');el.setAttribute('stroke',t.outline)});
    svg.querySelectorAll('.eye').forEach(el=>el.setAttribute('fill','#10191b'));
  }
  function enhanceArt(root,name){
    root?.querySelectorAll('.speciesSvg').forEach(svg=>dimensionalizeSvg(svg,name));
  }

  function copyText(){
    const hero=document.querySelector('.hero > p');
    const title=document.querySelector('.hero h1');
    if(title)title.innerHTML='この魚、<br/>どう釣る？';
    if(hero)hero.textContent='魚を選ぶだけで、釣り方・最初の1投・手持ちタックルの適合まで一気にわかる。';
    const search=document.getElementById('q');if(search)search.placeholder='魚を検索　例：ヒラメ、アジ、青物';
    document.querySelectorAll('#home .head').forEach(head=>{
      const h=head.querySelector('h2'),sub=head.querySelector(':scope > span');
      if(!h)return;
      const text=h.textContent.trim();
      if(text==='人気ターゲット'){h.textContent='人気の魚から選ぶ';if(sub)sub.textContent='タップですぐ診断'}
      if(text==='魚を選ぶ'){h.textContent='釣りたい魚を選ぶ'}
      if(text==='MY TARGETS'){h.textContent='すぐ再開';if(sub)sub.textContent='前回の続き'}
    });
    const filter=document.querySelector('#v19FilterDetails summary span');if(filter)filter.textContent='条件で絞る';
    const filterSmall=document.querySelector('#v19FilterDetails summary small');if(filterSmall)filterSmall.textContent='水域・釣り方・難易度';
    const tackle=document.querySelector('.v19TackleShortcut span');if(tackle)tackle.textContent='手持ちタックル';
    const tackleSmall=document.querySelector('.v19TackleShortcut small');if(tackleSmall)tackleSmall.textContent='登録・編集';
    document.querySelectorAll('.nav button').forEach(button=>{if(button.textContent.trim()==='保存')button.textContent='保存プラン'});

    const result=document.getElementById('result');
    if(result){
      const recommend=result.querySelector('.recommend');if(recommend)recommend.textContent='STEP 1 · 釣り方';
      result.querySelectorAll('.sectionTitle').forEach(h=>{
        const raw=[...h.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
        const small=h.querySelector('small');
        if(raw.includes('3秒プラン')){h.childNodes[0].textContent='まず投げるもの · FIRST CAST';if(small)small.textContent='迷ったら、まずここから始める。'}
        else if(raw==='必須タックル'){h.childNodes[0].textContent='必要なタックル';if(small)small.textContent='この4点を合わせれば基本セットが完成。'}
        else if(raw==='現場では3ステップ'){h.childNodes[0].textContent='現場でやること 3つ';if(small)small.textContent='迷った時は、この順番だけ実行。'}
      });
    }
  }

  function syncHome(){
    document.querySelectorAll('#grid .fish[data-fish]').forEach(card=>{
      const name=card.dataset.fish;
      setTheme(card,name);card.classList.add('visualFishCard');
      const art=card.querySelector('.art');
      if(art){setTheme(art,name);art.dataset.species=name;enhanceArt(art,name)}
      card.querySelector('.difficultyMini')?.classList.add('visualDifficulty');
    });
  }
  function syncResult(){
    const name=document.getElementById('rname')?.textContent?.trim();
    const result=document.getElementById('result');
    if(!result||!name)return;
    result.dataset.visualSpecies=name;setTheme(result,name);
    const art=document.getElementById('tart');
    if(art){setTheme(art,name);art.dataset.species=name;enhanceArt(art,name)}
  }
  function syncTackle(){const sheet=document.getElementById('tackleSheet');if(sheet)sheet.classList.add('visualTackleSheet')}
  function apply(){scheduled=false;copyText();syncHome();syncResult();syncTackle()}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}

  if(typeof renderHome==='function'){
    const previous=renderHome;
    renderHome=function(...args){const out=previous.apply(this,args);schedule();return out};
  }
  if(typeof renderResult==='function'){
    const previous=renderResult;
    renderResult=function(...args){const out=previous.apply(this,args);schedule();return out};
  }

  const start=()=>{
    apply();
    const targets=[document.getElementById('home'),document.getElementById('result'),document.getElementById('tackleSheet')].filter(Boolean);
    if(targets.length){const observer=new MutationObserver(schedule);targets.forEach(target=>observer.observe(target,{childList:true,subtree:true,characterData:true}))}
    setTimeout(apply,250);setTimeout(apply,1000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',schedule);
  globalThis.FISH_TARGET_VISUAL_PASS=Object.freeze({version:'V23-VISUAL2',species:Object.freeze(Object.keys(THEMES)),themeFor});
})();
