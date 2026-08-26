(()=>{
  const THEMES=Object.freeze({
    'ブリ・ワラサ':{body:'#6f8f91',accent:'#d6b44b',detail:'#355b62',outline:'#25434a',bg1:'#f1f8f5',bg2:'#dcece8'},
    'カンパチ':{body:'#8f8d7d',accent:'#c89537',detail:'#504a3d',outline:'#373a36',bg1:'#f8f5eb',bg2:'#eee4ca'},
    'サワラ':{body:'#78989f',accent:'#365f69',detail:'#314e57',outline:'#223d45',bg1:'#edf7f7',bg2:'#d7e9ec'},
    'シーバス':{body:'#909b98',accent:'#566a66',detail:'#3d514f',outline:'#263c3d',bg1:'#f2f6f4',bg2:'#dfe8e4'},
    'ヒラメ':{body:'#8c795d',accent:'#5f503b',detail:'#4a3e2f',outline:'#342d25',bg1:'#f7f2e7',bg2:'#eadfc8'},
    'マゴチ':{body:'#8f8365',accent:'#675a40',detail:'#514834',outline:'#393426',bg1:'#f7f4ea',bg2:'#e8e0c9'},
    'アジ':{body:'#899b8f',accent:'#d1b649',detail:'#486359',outline:'#30473f',bg1:'#f3f8ef',bg2:'#e3eed8'},
    'メバル':{body:'#806d5d',accent:'#b8794e',detail:'#544034',outline:'#382e29',bg1:'#f7f0ea',bg2:'#ead9cc'},
    'アオリイカ':{body:'#9b806f',accent:'#d2a38d',detail:'#654c44',outline:'#453532',bg1:'#fbf1ed',bg2:'#efdcd4'},
    'タチウオ':{body:'#a8b7bb',accent:'#5a7f8a',detail:'#496972',outline:'#2f4a52',bg1:'#f3f8fa',bg2:'#dfe9ed'},
    'クロダイ':{body:'#5e6563',accent:'#303938',detail:'#232d2d',outline:'#1b2526',bg1:'#eef2f1',bg2:'#dce2e0'},
    'マダイ':{body:'#d77a6f',accent:'#efb08d',detail:'#8c4e4a',outline:'#683b39',bg1:'#fff2ee',bg2:'#f4d8d1'},
    'シロギス':{body:'#b7a98c',accent:'#d6bd9d',detail:'#756c5d',outline:'#514b41',bg1:'#faf7f0',bg2:'#ede4d4'},
    'カワハギ':{body:'#a69a75',accent:'#615b43',detail:'#5d5740',outline:'#423f32',bg1:'#f8f4e8',bg2:'#e9e1ca'},
    'ブラックバス':{body:'#65775f',accent:'#364b37',detail:'#334532',outline:'#263529',bg1:'#f0f5ed',bg2:'#dce8d6'},
    'ニジマス':{body:'#849895',accent:'#d9858d',detail:'#506d69',outline:'#344d4a',bg1:'#f2f8f6',bg2:'#dfece8'},
    'アユ':{body:'#8d9a7d',accent:'#bf9c4a',detail:'#596451',outline:'#3d493a',bg1:'#f3f7ed',bg2:'#e0ead5'},
    'コイ':{body:'#967651',accent:'#c29155',detail:'#5e4933',outline:'#433525',bg1:'#f8f1e8',bg2:'#ead9c5'},
    'ヤマメ・イワナ':{body:'#6c7766',accent:'#d08255',detail:'#435044',outline:'#303a31',bg1:'#f2f5ee',bg2:'#dfe6d7'}
  });
  const FALLBACK={body:'#789497',accent:'#57a9a0',detail:'#3f6668',outline:'#2d4b4d',bg1:'#f0f7f6',bg2:'#dcebea'};
  let scheduled=false;

  function themeFor(name){return THEMES[name]||FALLBACK}
  function setTheme(el,name){
    if(!el||!name)return;
    const t=themeFor(name);
    el.style.setProperty('--fish-body',t.body);
    el.style.setProperty('--fish-accent',t.accent);
    el.style.setProperty('--fish-detail',t.detail);
    el.style.setProperty('--fish-outline',t.outline);
    el.style.setProperty('--fish-bg1',t.bg1);
    el.style.setProperty('--fish-bg2',t.bg2);
  }
  function enhanceSvg(root){
    root?.querySelectorAll('.speciesSvg').forEach(svg=>svg.classList.add('fieldGuideArt'));
  }
  function syncHome(){
    document.querySelectorAll('#grid .fish[data-fish]').forEach(card=>{
      const name=card.dataset.fish;
      setTheme(card,name);
      card.classList.add('visualFishCard');
      const art=card.querySelector('.art');
      if(art){setTheme(art,name);art.dataset.species=name;enhanceSvg(art)}
      card.querySelector('.difficultyMini')?.classList.add('visualDifficulty');
    });
  }
  function syncResult(){
    const name=document.getElementById('rname')?.textContent?.trim();
    const result=document.getElementById('result');
    if(!result||!name)return;
    result.dataset.visualSpecies=name;
    setTheme(result,name);
    const art=document.getElementById('tart');
    if(art){setTheme(art,name);art.dataset.species=name;enhanceSvg(art)}
  }
  function syncTackle(){
    const sheet=document.getElementById('tackleSheet');
    if(sheet)sheet.classList.add('visualTackleSheet');
  }
  function apply(){scheduled=false;syncHome();syncResult();syncTackle()}
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
    const targets=[document.getElementById('grid'),document.getElementById('result'),document.getElementById('tackleSheet')].filter(Boolean);
    if(targets.length){
      const observer=new MutationObserver(schedule);
      targets.forEach(target=>observer.observe(target,{childList:true,subtree:true,characterData:true}));
    }
    setTimeout(apply,250);
    setTimeout(apply,1000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('pageshow',schedule);
  globalThis.FISH_TARGET_VISUAL_PASS=Object.freeze({version:'V23-VISUAL1',species:Object.freeze(Object.keys(THEMES)),themeFor});
})();
