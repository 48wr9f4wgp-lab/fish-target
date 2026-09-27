/* GEAR COMPARE V1. Research-only; never writes MY TACKLE or ranks overall quality. */
(function (root) {
  'use strict';
  const VERSION = 'GEAR-COMPARE-V1';
  const norm = v => String(v ?? '').normalize('NFKC').trim();
  const number = v => v === null || v === undefined || typeof v === 'boolean' || norm(v) === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
  const https = value => { try { const u = new URL(String(value)); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
  const checked = '2026-09-27';
  const urls = {
    legalis: 'https://www.daiwa.com/jp/product/cx5krwk',
    caldia: 'https://www.daiwa.com/jp/product/lsej2uh',
    nasci: 'https://fish.shimano.com/ja-JP/product/reel/hanyouspinning/a075f00003slx0xqac.html',
    stella: 'https://fish.shimano.com/ja-JP/product/reel/hanyouspinning/a075f00003e22p2qaa.html'
  };
  // Exact SKU evidence, not a replacement catalog. Prices are maker JPY list prices EXCLUDING tax.
  // Only the fields below were rechecked. Other fields retain their original catalog verification date.
  const evidence = [
    ['daiwa:reel:legalis:2023:lt4000-cxh','legalis',14600,'4550133162701',99,'1.2-310, 1.5-200, 2-170',null,null],
    ['daiwa:reel:legalis:2023:lt5000-cxh','legalis',15100,'4550133162718',105,'1.5-430, 2-300, 2.5-260',null,null],
    ['daiwa:reel:legalis:2023:lt6000d-h','legalis',16100,'4550133162725',101,'2.5-420, 3-300, 4-220',null,null],
    ['daiwa:reel:caldia:2025:lt4000-cxh','caldia',32300,'4550133442537',99,'1.5-200',null,null],
    ['daiwa:reel:caldia:2025:lt5000-cxh','caldia',33800,'4550133458927',105,'2-300',null,null],
    ['shimano:reel:nasci:unknown:4000xg','nasci',15300,'4969363048165',99,'1-490, 1.5-320, 2-240',51,17],
    ['shimano:reel:nasci:unknown:c5000xg','nasci',16000,'4969363048172',105,'1.5-400, 2-300, 3-200',54,17],
    ['shimano:reel:stella:2022:4000xg','stella',95000,'4969363043962',101,'1-490, 1.5-320, 2-240',52,19],
    ['shimano:reel:stella:2022:c5000xg','stella',98300,'4969363043979',101,'1.5-400, 2-300, 3-200',52,19]
  ].map(([id, source, yen, jan, retrieve, pe, diameter, stroke]) => Object.freeze({
    id, jan, price: Object.freeze({amount:yen,currency:'JPY',basis:'maker_list_ex_tax',checked_at:checked,url:urls[source]}),
    specs:Object.freeze({retrieve_cm:retrieve,pe_capacity_raw:pe,...(diameter === null ? {} : {spool_diameter_mm:diameter,spool_stroke_mm:stroke})}),
    family:'spinning_general',url:urls[source],checked_at:checked
  }));
  const evidenceMap = new Map(evidence.map(e => [e.id,e]));
  const bands = Object.freeze([
    {id:'all',label:'すべての価格帯'},
    {id:'under20',label:'2万円未満',min:0,max:20000},
    {id:'20to40',label:'2万〜4万円未満',min:20000,max:40000},
    {id:'40to70',label:'4万〜7万円未満',min:40000,max:70000},
    {id:'over70',label:'7万円以上',min:70000,max:Infinity},
    {id:'unknown',label:'価格未確認'}
  ]);
  function capacities(raw) {
    // This input MUST be the typed PE(号-m) field. Never infer PE from mm, lb, nylon or braid lb.
    const s = norm(raw).replace(/[−ー–]/g,'-');
    if (!s || /lb|mm|ナイロン|フロロ|ポンド/i.test(s)) return [];
    const pairs = [...s.matchAll(/(?:^|[\s,/_、;])(?:PE\s*)?(\d+(?:\.\d+)?)\s*(?:号)?\s*-\s*(\d+(?:\.\d+)?)\s*m?/gi)];
    const found = new Map();
    for (const [,a,b] of pairs) {
      const gauge=Number(a),metres=Number(b);
      if (!(gauge>0&&gauge<=20&&metres>0&&metres<=10000)) continue;
      if(found.has(gauge)&&found.get(gauge)!==metres)return []; // conflicting published capacities stay unknown
      found.set(gauge,metres);
    }
    return [...found].map(([pe,m])=>({pe,m}));
  }
  function capacity(p, pe) { return p.capacities.find(c=>c.pe===number(pe))?.m ?? null; }
  function lengthMetres(s) {
    const m = number(s.length_m);
    if (m !== null && m > 0) return {value:m,note:''};
    const raw=norm(s.length_raw),f=raw.match(/^(\d+)\s*(?:ft|')\s*(\d+)?\s*(?:in|")?$/i);
    if (f && Number(f[2]||0)<12) return {value:(Number(f[1])+Number(f[2]||0)/12)*0.3048,note:'原表記から単位換算'};
    // The inherited PoC contains e.g. 9.6 for 9 feet 6 inches. Do NOT silently compare that as decimal feet.
    return {value:null,note:number(s.length_ft)!==null?'長さの単位を再確認（DB表記 '+s.length_ft+'ft）':'長さ未確認'};
  }
  function normalize(product) {
    if (!product || !['rod','reel'].includes(product.category) || !product.product_id || product.source?.source_type==='synthetic' || product.source?.license_status==='synthetic') return null;
    const sourceUrl=https(product.source?.source_url);
    if(!sourceUrl)return null;
    const e=evidenceMap.get(product.product_id);
    const validEvidence=e && (!product.identifiers?.jan || norm(product.identifiers.jan)===e.jan) ? e : null;
    const specs={...product.specs,...validEvidence?.specs};
    const length=product.category==='rod'?lengthMetres(specs):{value:null,note:''};
    const issues=[];
    if(product.generation==='unknown'||!product.generation)issues.push('世代未確認');
    if(e&&!validEvidence)issues.push('JAN不一致：追加根拠を不使用');
    if(length.note)issues.push(length.note);
    return Object.freeze({
      id:product.product_id,maker:product.maker,category:product.category,series:product.series,model:product.model,
      generation:product.generation||'unknown',status:product.status||'unknown',name:product.display_name||product.series+' '+product.model,
      specs:Object.freeze(specs),length_m:length.value,capacities:Object.freeze(capacities(specs.pe_capacity_raw)),
      price:validEvidence?.price||null,family:validEvidence?.family||null,evidence:validEvidence||null,
      source:Object.freeze({...product.source,source_url:sourceUrl}),issues:Object.freeze(issues),
      source_product:product
    });
  }
  function normalizeAll(rows) { return (Array.isArray(rows)?rows:[]).map(normalize).filter(Boolean); }
  function compareValue(p, key, criteria={}) {
    if(key==='price')return p.price?.amount??null;
    if(key==='length_m')return p.length_m;
    if(key==='capacity')return capacity(p,criteria.pe);
    return number(p.specs[key]);
  }
  function requirements(p,c={}) {
    const checks=[];
    const atLeast=(name,actual,min)=>{if(number(min)!==null)checks.push({name,status:actual===null?'unknown':actual>=Number(min)?'pass':'fail',value:actual,requested:Number(min)});};
    const atMost=(name,actual,max)=>{if(number(max)!==null)checks.push({name,status:actual===null?'unknown':actual<=Number(max)?'pass':'fail',value:actual,requested:Number(max)});};
    atMost('価格上限',p.price?.amount??null,c.budget);
    atMost('自重上限',number(p.specs.weight_g),c.weight);
    if(p.category==='reel'){
      if(number(c.pe)!==null&&number(c.metres)!==null)atLeast('指定PEの巻糸量',capacity(p,c.pe),c.metres);
      atLeast('巻取り長さ',number(p.specs.retrieve_cm),c.retrieve);
    } else {
      atLeast('全長下限',p.length_m,c.lengthMin);atMost('全長上限',p.length_m,c.lengthMax);
      if(number(c.lure)!==null){
        const lo=number(p.specs.lure_min_g),hi=number(p.specs.lure_max_g),value=Number(c.lure);
        checks.push({name:'ルアー重量範囲',status:hi!==null&&value>hi||lo!==null&&value<lo?'fail':lo===null||hi===null?'unknown':'pass',value:[lo,hi],requested:value});
      }
    }
    return {checks,status:checks.some(c=>c.status==='fail')?'fail':checks.some(c=>c.status==='unknown')?'unknown':checks.length?'pass':'unset'};
  }
  function validateCriteria(c) {
    const keys=['budget','weight','pe','metres','retrieve','lengthMin','lengthMax','lure'];
    if(keys.some(k=>norm(c[k])!==''&&(number(c[k])===null||number(c[k])<=0)))return '条件は0より大きい数値で入力してください。';
    if(c.category!=='rod' && ((number(c.pe)!==null)!==(number(c.metres)!==null)))return 'PE号数と必要な長さを両方入力してください。';
    if(number(c.lengthMin)!==null&&number(c.lengthMax)!==null&&Number(c.lengthMin)>Number(c.lengthMax))return '全長の下限が上限を超えています。';
    return '';
  }
  function queryNorm(s){return norm(s).toLowerCase().replace(/ダイワ/g,'daiwa').replace(/シマノ/g,'shimano').replace(/アブガルシア/g,'abu garcia').replace(/レガリス/g,'legalis').replace(/カルディア/g,'caldia').replace(/ナスキー/g,'nasci').replace(/ステラ/g,'stella').replace(/ゼノン/g,'zenon');}
  function filter(rows,c={}) {
    const q=queryNorm(c.query).split(/\s+/).filter(Boolean),band=bands.find(b=>b.id===c.band)||bands[0];
    const entries=rows.filter(p=>{
      if(c.category&&p.category!==c.category||c.maker&&p.maker!==c.maker)return false;
      if(c.status&&p.status!==c.status)return false;
      if(q.length&&!q.every(t=>queryNorm(`${p.maker} ${p.series} ${p.model} ${p.generation} ${p.name}`).includes(t)))return false;
      if(band.id==='unknown'&&p.price)return false;
      if(band.min!==undefined&&(!p.price||p.price.amount<band.min||p.price.amount>=band.max))return false;
      const r=requirements(p,c);
      return r.status!=='fail'&&(c.includeUnknown||r.status!=='unknown');
    });
    const key={price:'price',weight:'weight_g',retrieve:'retrieve_cm',length:'length_m'}[c.sort];
    return entries.sort((a,b)=>{
      if(key){const x=compareValue(a,key,c),y=compareValue(b,key,c);if(x===null&&y!==null)return 1;if(x!==null&&y===null)return -1;if(x!==null&&y!==null&&x!==y)return c.sort==='retrieve'?y-x:x-y;}
      // Verified price entries first for initial browsing; never an overall quality rank.
      if(!key&&!!a.evidence!==!!b.evidence)return a.evidence?-1:1;
      return (a.maker+' '+a.series+' '+a.model).localeCompare(b.maker+' '+b.series+' '+b.model,'ja',{numeric:true});
    });
  }
  function similar(base,rows,c={}) {
    if(!base?.family||base.category!=='reel')return [];
    return filter(rows,{...c,category:base.category,query:'',maker:''}).filter(p=>p.id!==base.id&&p.maker!==base.maker&&p.family===base.family).map(p=>{
      const common=base.capacities.map(a=>({pe:a.pe,a:a.m,b:capacity(p,a.pe)})).filter(x=>x.b!==null);
      const pair=number(c.pe)!==null?common.find(x=>x.pe===number(c.pe)):common.sort((a,b)=>Math.abs(a.a-a.b)/a.a-Math.abs(b.a-b.b)/b.a)[0];
      const w=number(p.specs.weight_g),bw=number(base.specs.weight_g),r=number(p.specs.retrieve_cm),br=number(base.specs.retrieve_cm);
      if(!pair||w===null||bw===null||bw<=0||r===null||br===null||br<=0||pair.b/pair.a<0.6||pair.b/pair.a>1.67||w/bw<0.6||w/bw>1.67||r/br<0.75||r/br>1.34)return null;
      return {product:p,distance:Math.abs(w-bw)/bw+Math.abs(r-br)/br+Math.abs(pair.b-pair.a)/pair.a,
        reasons:[`PE${pair.pe}号：${pair.b}m（基準${pair.a}m）`,`自重差 ${w-bw>0?'+':''}${w-bw}g`,`巻取差 ${r-br>0?'+':''}${r-br}cm`]};
    }).filter(Boolean).sort((a,b)=>a.distance-b.distance||a.product.id.localeCompare(b.product.id)).slice(0,6);
  }
  const api=Object.freeze({version:VERSION,number,https,bands,evidence,capacities,capacity,lengthMetres,normalize,normalizeAll,compareValue,requirements,validateCriteria,filter,similar});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root.document)return;
  const d=root.document;
  if(d.documentElement.dataset.publicationBuild==='on'||d.documentElement.dataset.catalogPublication==='on'||d.documentElement.dataset.catalogRuntime==='off')return;
  root.FISH_TARGET_GEAR_COMPARE_ENGINE=api;

  const byId=id=>d.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money=v=>v===null?'未確認':'¥'+Math.round(v).toLocaleString('ja-JP');
  const value=(v,unit='')=>v===null||v===undefined||v===''?'未確認':String(v)+unit;
  const statusName=s=>({current:'確認時は現行',discontinued:'廃番',legacy:'旧モデル',unknown:'状態未確認'}[s]||'状態未確認');
  const state={rows:[],selected:[],category:'reel',loaded:false,loading:false,error:'',limit:24,fromTackle:false};
  let pending=null;
  const sheet=d.createElement('section');sheet.id='gearCompareSheet';sheet.className='gc-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','gcTitle');
  sheet.innerHTML=`<header class="gc-head"><div><small>GEAR COMPARE · 開発検証</small><h1 id="gcTitle">メーカーを跨いで比較</h1><p>価格帯と仕様の違いから、自分の1本・1台を選ぶ。</p></div><button type="button" id="gcClose" aria-label="比較を閉じる">閉じる</button></header>
  <main class="gc-body"><div class="gc-category" role="group" aria-label="比較する道具"><button type="button" data-gc-kind="reel" aria-pressed="true">リール</button><button type="button" data-gc-kind="rod" aria-pressed="false">ロッド</button></div>
  <p class="gc-note">魚の選択・手持ち登録は不要。同じ番手や価格帯でも、同格とは限りません。</p>
  <div class="gc-filters"><label class="gc-wide">製品を探す<input id="gcQuery" type="search" maxlength="120" placeholder="例：レガリス、NASCI、5000"></label><label>メーカー<select id="gcMaker"><option value="">すべて</option></select></label><label>本体価格帯（税別）<select id="gcBand">${bands.map(b=>`<option value="${b.id}">${b.label}</option>`).join('')}</select></label></div>
  <details class="gc-conditions"><summary>詳しい条件・並び順 <small>任意</small></summary><div class="gc-filters"><label>並び順<select id="gcSort"><option value="name">確認済み補足・製品名順</option><option value="price">本体価格の安い順</option><option value="weight">自重の軽い順</option><option value="retrieve">巻取りの長い順</option></select></label><label>製品状態<select id="gcStatus"><option value="">旧モデルも含む</option><option value="current">確認時は現行</option><option value="legacy">旧モデル</option><option value="discontinued">廃番</option><option value="unknown">未確認</option></select></label><label>価格上限（税別・円）<input id="gcBudget" inputmode="decimal" placeholder="例：30000"></label><label>自重上限（g）<input id="gcWeight" inputmode="decimal" placeholder="例：300"></label><label data-gc-for="reel">PE号数<input id="gcPe" inputmode="decimal" placeholder="例：2"></label><label data-gc-for="reel">必要な長さ（m）<input id="gcMetres" inputmode="decimal" placeholder="例：300"></label><label data-gc-for="reel">巻取り下限（cm/回転）<input id="gcRetrieve" inputmode="decimal" placeholder="例：90"></label><label data-gc-for="rod">全長下限（m）<input id="gcLengthMin" inputmode="decimal" placeholder="例：2.7"></label><label data-gc-for="rod">全長上限（m）<input id="gcLengthMax" inputmode="decimal" placeholder="例：3.2"></label><label data-gc-for="rod">投げるルアー（g）<input id="gcLure" inputmode="decimal" placeholder="例：40"></label></div><label class="gc-check"><input type="checkbox" id="gcUnknown">条件の仕様が未確認の製品も含める</label><p class="gc-note">糸巻量は明記されたPE号数だけで照合。最大ドラグは耐久性の点数にせず、ジグ上限とプラグの範囲も混同しません。</p></details>
  <div class="gc-toolbar"><p id="gcCount" role="status" aria-live="polite">読み込み前</p><button type="button" id="gcReset">絞り込み解除</button></div>
  <p id="gcError" class="gc-alert" role="alert" hidden></p><button type="button" id="gcRetry" hidden>再読み込み</button>
  <section class="gc-tray" aria-label="比較する製品"><div class="gc-tray-head"><b id="gcSelectionCount">比較する製品 0/3</b><button type="button" id="gcClear">選択を解除</button></div><div id="gcSelections"></div><button type="button" id="gcGo" disabled>選んだ製品を比較</button></section>
  <section id="gcComparison" class="gc-comparison" hidden tabindex="-1" aria-labelledby="gcCompareTitle"><h2 id="gcCompareTitle">違いを見る</h2><p>左端が基準。＋／−は数値差で、優劣の判定ではありません。</p><label class="gc-check"><input id="gcDifferences" type="checkbox">違う項目だけ表示</label><p class="gc-note">表は左右にスクロールできます。</p><div class="gc-table-scroll" tabindex="0" role="region" aria-label="製品比較表、左右にスクロール"><table id="gcTable"></table></div><div id="gcLimits" class="gc-note"></div></section>
  <section id="gcSimilar" class="gc-similar" hidden aria-labelledby="gcSimilarTitle"><h2 id="gcSimilarTitle">仕様の近い他社候補</h2><p class="gc-note">追加確認した9型番の汎用スピニングから、共通PE容量・自重・巻取りで抽出。検索語・メーカー条件のみ解除し、他の入力条件は維持。同格や用途適合の保証ではありません。</p><div id="gcSimilarRows"></div></section>
  <h2 class="gc-results-title">比較する型番を選ぶ <small>最大3点</small></h2><div id="gcResults" class="gc-results"></div><button type="button" id="gcMore" hidden>さらに24件</button>
  <footer class="gc-foot">価格は確認日のメーカー本体価格（税別）で、実売価格・在庫ではありません。価格帯は性能グレードではありません。剛性・巻き感・感度・防水性を数値から推定しません。比較の選択はメモリ内だけで、再読み込みで解除されます。掲載データは研究用。公開利用の承認は未取得です。</footer></main><nav class="gc-quick-bar" aria-label="比較画面の操作"><button id="gcQuickTop" type="button">検索に戻る</button><button id="gcQuickCompare" type="button" disabled>製品を比較</button></nav>`;
  d.body.appendChild(sheet);
  function criteria(){const get=id=>byId(id).value;return {category:state.category,query:get('gcQuery'),maker:get('gcMaker'),band:get('gcBand'),sort:get('gcSort'),status:get('gcStatus'),budget:get('gcBudget'),weight:get('gcWeight'),pe:state.category==='reel'?get('gcPe'):'',metres:state.category==='reel'?get('gcMetres'):'',retrieve:state.category==='reel'?get('gcRetrieve'):'',lengthMin:state.category==='rod'?get('gcLengthMin'):'',lengthMax:state.category==='rod'?get('gcLengthMax'):'',lure:state.category==='rod'?get('gcLure'):'',includeUnknown:byId('gcUnknown').checked};}
  function message(s){byId('gcError').hidden=!s;byId('gcError').textContent=s;}
  function makers(){const el=byId('gcMaker'),v=el.value;el.innerHTML='<option value="">すべて</option>'+[...new Set(state.rows.filter(p=>p.category===state.category).map(p=>p.maker))].sort().map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');if([...el.options].some(o=>o.value===v))el.value=v;}
  function card(p,extra=''){
    const s=p.specs,selected=state.selected.includes(p.id),r=requirements(p,criteria()),spec=p.category==='reel'?`${value(number(s.weight_g),'g')} · 巻取 ${value(number(s.retrieve_cm),'cm')}`:`${value(p.length_m===null?null:Number(p.length_m.toFixed(2)),'m')} · ${value(number(s.weight_g),'g')} · ルアー ${value(number(s.lure_min_g))}〜${value(number(s.lure_max_g),'g')}`;
    return `<article class="gc-product${selected?' is-selected':''}" data-gc-product="${esc(p.id)}"><div><small>${esc(p.maker)} · ${esc(statusName(p.status))}</small><h3>${esc(p.series)} <span>${esc(p.model)}</span></h3><p class="gc-generation">世代：${esc(p.generation==='unknown'?'未確認':p.generation)}</p><p class="gc-spec">${esc(spec)}</p><strong class="gc-price">${money(p.price?.amount??null)}${p.price?' <small>税別・本体価格</small>':''}</strong><p class="gc-source-date">仕様確認 ${esc(p.source.last_verified||'不明')}${p.evidence?' · 価格/補足 '+p.evidence.checked_at:''}</p>${r.status==='unknown'?'<p class="gc-warn">条件の仕様が未確認</p>':''}${p.issues.length?`<p class="gc-warn">${esc(p.issues.join(' / '))}</p>`:''}${extra}</div><div class="gc-product-actions"><button type="button" data-gc-select="${esc(p.id)}" aria-pressed="${selected}" aria-label="${esc(p.name)}を${selected?'比較から外す':'比較に追加'}">${selected?'選択済み ✓':'比較に追加'}</button>${p.family?`<button type="button" data-gc-similar="${esc(p.id)}">他社の近い仕様</button>`:''}<a href="${esc(p.evidence?.url||p.source.source_url)}" target="_blank" rel="noopener noreferrer">メーカー根拠 ↗</a></div></article>`;
  }
  function fields(){return [['price','本体価格（税別）','円'],['weight_g','自重','g'],...(state.category==='reel'?[['retrieve_cm','巻取り / ハンドル1回転','cm'],['gear_ratio','ギア比',''],['pe_capacity_raw','PE巻糸量（号-m）',''],['spool_diameter_mm','スプール径','mm'],['spool_stroke_mm','ストローク','mm'],['max_drag_kg','最大ドラグ（耐久性ではない）','kg']]:[['length_m','全長','m'],['power','パワー（メーカー表記）',''],['lure_min_g','ルアー下限','g'],['lure_max_g','ルアー上限','g'],['jig_max_g','ジグ上限（別条件）','g'],['line_pe_min','適合PE下限','号'],['line_pe_max','適合PE上限','号'],['pieces','継数','本'],['closed_length_cm','仕舞寸法','cm']]),['requirements','入力条件との照合',''],['source','確認日・根拠','']];}
  function fieldValue(p,key){if(key==='price')return p.price?.amount??null;if(key==='length_m')return p.length_m===null?null:Number(p.length_m.toFixed(3));if(key==='requirements'){const r=requirements(p,criteria());return r.status==='unset'?'条件未指定':r.checks.map(x=>x.name+'：'+({pass:'数値を満たす',fail:'数値を満たさない',unknown:'未確認'}[x.status])).join(' / ');}if(key==='source')return p.source.last_verified||'不明';return p.specs[key]??null;}
  function renderTable(){
    const selected=state.selected.map(id=>state.rows.find(p=>p.id===id)).filter(Boolean),visible=selected.length>=2;
    byId('gcComparison').hidden=!visible;if(!visible)return;
    byId('gcTable').innerHTML=`<caption>メーカー横断 ${state.category==='reel'?'リール':'ロッド'}比較</caption><thead><tr><th scope="col">比較項目</th>${selected.map((p,i)=>`<th scope="col"><small>${i===0?'基準 · ':''}${esc(p.maker)}</small><b>${esc(p.series)}<br>${esc(p.model)}</b><span>${esc(p.generation==='unknown'?'世代未確認':p.generation)}</span></th>`).join('')}</tr></thead><tbody>${fields().filter(([key])=>key==='source'||!byId('gcDifferences').checked||new Set(selected.map(p=>JSON.stringify(fieldValue(p,key)))).size>1).map(([key,label,unit])=>`<tr><th scope="row">${esc(label)}</th>${selected.map((p,i)=>{const v=fieldValue(p,key),base=fieldValue(selected[0],key);if(key==='source')return `<td><a href="${esc(p.source.source_url)}" target="_blank" rel="noopener noreferrer">DB仕様 ${esc(v)}</a>${p.evidence?`<a href="${esc(p.evidence.url)}" target="_blank" rel="noopener noreferrer">価格・補足 ${p.evidence.checked_at}</a>`:''}</td>`;const n=typeof v==='number'?v:null,b=typeof base==='number'?base:null,diff=i&&n!==null&&b!==null?Number((n-b).toFixed(3)):null;return `<td>${esc(key==='price'?money(v):value(v,typeof v==='number'?unit:''))}${diff===null?'':`<small class="gc-delta">基準比 ${diff>0?'+':''}${diff}${esc(unit)}</small>`}</td>`;}).join('')}</tr>`).join('')}</tbody>`;
    byId('gcLimits').textContent='未確認は0や劣位ではありません。'+(state.category==='reel'?'PE換算・剛性・巻き感・高負荷での耐久性は判定していません。':'パワー記号の会社間換算や、竿全体の用途同等判定はしていません。')+' 商品仕様と実際に巻いているラインは別です。';
  }
  function tray(){sheet.querySelector('.gc-tray').classList.toggle('is-empty',!state.selected.length);byId('gcSelectionCount').textContent=state.selected.length?'比較する製品 '+state.selected.length+'/3':'比べたい型番を2〜3点選択';byId('gcGo').disabled=state.selected.length<2;byId('gcQuickCompare').disabled=state.selected.length<2;byId('gcQuickCompare').textContent=state.selected.length+'点を比較';byId('gcSelections').innerHTML=state.selected.map((id,i)=>{const p=state.rows.find(p=>p.id===id);return `<div><span>${i===0?'基準：':''}${esc(p.maker+' '+p.name)}</span><button type="button" data-gc-select="${esc(id)}" aria-label="${esc(p.name)}を比較から外す">外す</button></div>`;}).join('');renderTable();}
  function render(){
    if(state.loading){byId('gcCount').textContent='比較用カタログを読み込み中…';return;}
    const c=criteria(),error=validateCriteria(c);message(state.error||error);byId('gcRetry').hidden=!state.error;
    if(error){byId('gcResults').replaceChildren();byId('gcCount').textContent='入力条件を確認してください';byId('gcMore').hidden=true;return;}
    const filtered=filter(state.rows,c),all=state.rows.filter(p=>p.category===state.category),priced=all.filter(p=>p.price).length;
    byId('gcCount').textContent=`${filtered.length}型番 / ${all.length}型番 · 価格確認 ${priced}型番。全製品網羅ではありません。`;
    byId('gcResults').innerHTML=filtered.length?filtered.slice(0,state.limit).map(p=>card(p)).join(''):'<p class="gc-empty">条件に一致する確認済みデータがありません。未確認を含めるか、条件を緩めてください。</p>';
    byId('gcMore').hidden=filtered.length<=state.limit;tray();
  }
  async function load(){if(state.loaded)return;if(pending)return pending;state.loading=true;state.error='';message('');byId('gcRetry').hidden=true;render();pending=(async()=>{try{const runtime=await root.FISH_TARGET_CATALOG_LOADER.ensureLoaded();state.rows=normalizeAll(runtime.products||[]);state.loaded=true;makers();}catch(e){state.error='比較データを読み込めません。再読み込みできます。手持ちデータは変更していません。';}finally{state.loading=false;pending=null;render();}})();return pending;}
  function open(options={}){
    if(!sheet.hidden)return;
    state.fromTackle=options.fromHistory?Boolean(options.fromTackle):!!byId('tackleSheet')&&!byId('tackleSheet').hidden;
    // Reuse the existing focus/scroll lifecycle, so only one sheet is active.
    sheet.hidden=false;d.body.classList.add('gc-open');root.FISH_TARGET_MODAL_FOCUS?.open(sheet,close);
    void load();
  }
  function close(){if(sheet.hidden)return;sheet.hidden=true;d.body.classList.remove('gc-open');root.FISH_TARGET_MODAL_FOCUS?.close(sheet);if(state.fromTackle&&!root.FISH_TARGET_NAVIGATION?.isRestoring?.())byId('tackleManage')?.click();}
  function select(id){const p=state.rows.find(p=>p.id===id);if(!p||p.category!==state.category)return;if(state.selected.includes(id))state.selected=state.selected.filter(x=>x!==id);else{if(state.selected.length===3){message('比較は最大3点です。1点外してから追加してください。');return;}state.selected.push(id);}byId('gcSimilar').hidden=true;render();}
  function reset(){for(const id of ['gcQuery','gcMaker','gcBudget','gcWeight','gcPe','gcMetres','gcRetrieve','gcLengthMin','gcLengthMax','gcLure','gcStatus'])byId(id).value='';byId('gcBand').value='all';byId('gcSort').value='name';byId('gcUnknown').checked=false;state.limit=24;byId('gcSimilar').hidden=true;render();}
  sheet.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.gcSelect){select(b.dataset.gcSelect);return;}
    if(b.dataset.gcKind){const next=b.dataset.gcKind;if(next===state.category)return;if(state.selected.length&&!root.confirm('道具の種類を変えると比較の選択を解除します。切り替えますか？'))return;state.category=next;state.selected=[];sheet.querySelectorAll('[data-gc-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.gcKind===next)));sheet.querySelectorAll('[data-gc-for]').forEach(x=>x.hidden=x.dataset.gcFor!==next);byId('gcSort').querySelector('[value=retrieve]').disabled=next==='rod';makers();reset();return;}
    if(b.dataset.gcSimilar){const base=state.rows.find(p=>p.id===b.dataset.gcSimilar),matches=similar(base,state.rows,criteria());byId('gcSimilar').hidden=false;byId('gcSimilarRows').innerHTML=`<p>基準：${esc(base.maker+' '+base.name)}</p>`+(matches.length?matches.map(m=>card(m.product,`<p class="gc-match-reasons">${esc(m.reasons.join(' / '))}</p>`)).join(''):'<p>共通仕様を十分確認できる他社候補はありません。番手だけで補いません。</p>');byId('gcSimilar').scrollIntoView({block:'start',behavior:'instant'});}
  });
  sheet.querySelectorAll('[data-gc-for="rod"]').forEach(x=>x.hidden=true);
  for(const id of ['gcQuery','gcMaker','gcBand','gcSort','gcStatus','gcBudget','gcWeight','gcPe','gcMetres','gcRetrieve','gcLengthMin','gcLengthMax','gcLure','gcUnknown'])byId(id).addEventListener(id==='gcQuery'||byId(id).tagName==='INPUT'&&byId(id).type!=='checkbox'?'input':'change',()=>{state.limit=24;byId('gcSimilar').hidden=true;render();});
  byId('gcClose').onclick=close;byId('gcRetry').onclick=()=>void load();byId('gcReset').onclick=reset;byId('gcClear').onclick=()=>{state.selected=[];render();};byId('gcDifferences').onchange=renderTable;byId('gcMore').onclick=()=>{state.limit+=24;render();};byId('gcGo').onclick=()=>{renderTable();byId('gcComparison').scrollIntoView({block:'start',behavior:'instant'});byId('gcComparison').focus({preventScroll:true});};
  byId('gcQuickCompare').onclick=()=>byId('gcGo').click();byId('gcQuickTop').onclick=()=>{sheet.scrollTo({top:0,behavior:'instant'});byId('gcQuery').focus({preventScroll:true});};
  const launch=d.createElement('button');launch.type='button';launch.id='gearCompareLaunch';launch.className='gc-launch';launch.innerHTML='<b>メーカー横断で比較</b><span>リール・ロッドの仕様と価格帯を比べる ›</span>';launch.onclick=()=>open();byId('tackleSheet')?.querySelector('.tackleSheetBody')?.prepend(launch);
  const home=d.createElement('button');home.type='button';home.id='gearCompareHome';home.className='gc-launch gc-home';home.innerHTML='<b>道具をメーカー横断で比べる</b><span>魚種を決めずに、条件・型番から比較 ›</span>';home.onclick=()=>open();byId('home')?.querySelector('.filterPanel')?.after(home);
  root.FISH_TARGET_GEAR_COMPARE=Object.freeze({version:VERSION,open,close,isOpen:()=>!sheet.hidden,selected:()=>state.selected.slice()});
})(typeof globalThis==='object'?globalThis:this);
