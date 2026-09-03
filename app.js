
const $=id=>document.getElementById(id);
const FEATURES=Object.freeze({fieldLive:typeof document!=='undefined'&&document.documentElement.dataset.fieldLive==='on'});
const LIVE={place:null,weather:null,marine:null,hourly:null,marineHourly:null,marineMessage:'',loading:false};
let waterFilter='all',styleFilter='all',difficultyFilter='all',cur=null,from='home';
const seasonNow=(()=>{const m=new Date().getMonth()+1;return [3,4,5].includes(m)?'春':[6,7,8].includes(m)?'夏':[9,10,11].includes(m)?'秋':'冬'})();
function currentDaypart(){const h=new Date().getHours();if(h>=4&&h<=8)return '朝';if(h>=9&&h<=15)return '昼';if(h>=16&&h<=19)return '夕';return '夜'}
let state={place:'おすすめ',season:seasonNow,goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false};
const MEMORY_STORE={};
const FISHING_SPOTS=[
 {id:'shimoda',name:'伊豆・下田',lat:34.6833,lon:138.9667,jma:'D6'},
 {id:'yokohama',name:'横浜',lat:35.45,lon:139.65,jma:'QS'},
 {id:'tokyo',name:'東京湾・東京',lat:35.65,lon:139.7667,jma:'TK'},
 {id:'niigata',name:'新潟西港',lat:37.9333,lon:139.0667,jma:'S6'},
 {id:'kobe',name:'神戸',lat:34.6833,lon:135.1833,jma:'KB'},
 {id:'naha',name:'那覇',lat:26.2167,lon:127.6667,jma:'NH'}
];
function weatherLabel(code){if(code===0)return '快晴';if([1,2,3].includes(code))return '晴れ/曇り';if([45,48].includes(code))return '霧';if((code>=51&&code<=67)||(code>=80&&code<=82))return '雨';if(code>=71&&code<=77)return '雪';if(code>=95)return '雷';return '天候コード '+code}
function windBucket(speed,gust){if(speed>=8||gust>=12)return '強い';if(speed<3&&gust<6)return '弱い';return '普通'}
function fieldStatus(speed,gust,rain,wave){
 const w=Number.isFinite(+wave)?+wave:0;
 if(speed>=10||gust>=15||rain>=10||w>=2)return ['見合わせ検討','danger'];
 if(speed>=7||gust>=11||rain>=5||w>=1.2)return ['要注意','warn'];
 if(speed<5&&gust<9&&rain<2&&(w===0||w<0.8))return ['操作しやすい','good'];
 return ['標準','neutral'];
}
function jmaUrl(code){return code?`https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?S_HILO=on&stn=${encodeURIComponent(code)}`:'https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php'}
function kmBetween(a,b,c,d){const R=6371,toR=x=>x*Math.PI/180,dp=toR(c-a),dl=toR(d-b),q=Math.sin(dp/2)**2+Math.cos(toR(a))*Math.cos(toR(c))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function daypartAt(t){const h=+(String(t).match(/T(\d\d)/)?.[1]||12);if(h>=4&&h<=8)return '朝';if(h>=9&&h<=15)return '昼';if(h>=16&&h<=19)return '夕';return '夜'}
function daypartFits(p,d){const t=p?.time||'';return (d==='朝'&&t.includes('朝'))||(d==='夕'&&t.includes('夕'))||(d==='夜'&&t.includes('夜'))||(d==='昼'&&t.includes('昼'))||(t.includes('朝夕')&&(d==='朝'||d==='夕'))}
function nearestMarineWave(time){const h=LIVE.marineHourly;if(!h?.time?.length)return null;const i=h.time.indexOf(time);return i>=0?h.wave_height?.[i]??null:null}
function windowStatus(speed,gust,rain,wave){const [label,klass]=fieldStatus(+speed||0,+gust||0,+rain||0,wave);return {label,klass,rank:klass==='danger'?3:klass==='warn'?2:klass==='neutral'?1:0}}
function bestLiveWindow(p){const h=LIVE.hourly;if(!h?.time?.length||!p)return null;const idx=[0,2,4,6].filter(i=>i<h.time.length),rows=idx.map(i=>{const wave=nearestMarineWave(h.time[i]),st=windowStatus(h.wind_speed_10m?.[i],h.wind_gusts_10m?.[i],h.precipitation?.[i],wave),dp=daypartAt(h.time[i]),fit=daypartFits(p,dp);return {i,time:h.time[i],wave,st,dp,fit}});const c=rows.filter(x=>x.st.rank<3).sort((a,b)=>(a.st.rank-b.st.rank)||((b.fit?1:0)-(a.fit?1:0)));return c[0]||rows.sort((a,b)=>a.st.rank-b.st.rank)[0]||null}
function autoRotationIndex(p){const list=rotationFor(p);if(!list.length||p.style==='bait')return 0;const m=cur?.water==='salt'?LIVE.marine:null,strong=state.wind==='強い'||(+m?.wave||0)>=1.2||(+m?.current||0)>=2,weak=state.wind==='弱い'&&(+m?.wave||0)<0.8;const terms=x=>`${x.when||''} ${x.range||''} ${x.action||''} ${x.name||''}`;if(strong){let i=list.findIndex(x=>/遠投|飛距離|深い|底|沖|メタル|バイブ|フロート|重|大型/.test(terms(x)));if(i>0)return i;return Math.min(2,list.length-1)}if(weak){let i=list.findIndex(x=>/自然|弱い|スロー|小型|食い渋り|クリア|フォール/.test(terms(x)));if(i>0)return i}return 0}
function livePackExtras(){const a=[],w=LIVE.weather,m=cur?.water==='salt'?LIVE.marine:null;if(w&&(+w.precipitation||0)>=1)a.push('レインウェア');if(state.wind==='強い'||(+m?.current||0)>=2)a.push('重めの予備');if((+m?.wave||0)>=1.2)a.push('安全装備再確認');return a}
function renderAutoAdjust(p){if(!$('autoAdjust'))return;const r=currentRotation(p),best=bestLiveWindow(p),w=LIVE.weather,m=cur?.water==='salt'?LIVE.marine:null;let mode='BASE',gear='基準規格',reasons=[];if(w){const [label]=fieldStatus(+w.wind||0,+w.gust||0,+w.precipitation||0,m?.wave);mode=label;$('autoAdjustUpdated').textContent=`${LIVE.place?.name||''} · ${w.time||'現在'} の条件を反映`;reasons.push(`風 ${w.wind??'-'}m/s・突風 ${w.gust??'-'}m/s`);if((+w.precipitation||0)>=1)reasons.push(`雨 ${w.precipitation}mm`);if(state.wind==='強い')gear='重量は上限寄り / ライン管理優先';else if(m&&((+m.current||0)>=2||(+m.wave||0)>=1.2))gear='底取り・安定性を優先';else gear='基準規格で開始';if(m?.wave!=null)reasons.push(`波 ${m.wave}m`);if(m?.current!=null)reasons.push(`流れ ${m.current}km/h`)}else{$('autoAdjustUpdated').textContent='FIELD LIVE未取得 · 魚種/季節/時刻の基準プラン';reasons.push('地点未取得のため基準値')}$('autoMode').textContent=mode;$('autoCast').textContent=`${r.name} / ${dynamicSize(r.size)}`;$('autoGearAdjust').textContent=gear;const extras=livePackExtras();$('autoPackAdjust').textContent=extras.length?extras.join(' + '):'標準PACK';$('autoPackAdjust').classList.toggle('livePack',extras.length>0);$('autoWindow').textContent=best?`${String(best.time).slice(11,16)} · ${best.dp} / ${best.st.label}`:'FIELD LIVE取得後に表示';$('autoReason').textContent=`${state.rotationManual?'FIRST CASTは手動選択を優先。':'FIRST CASTはライブ条件から自動選択。'} ${reasons.join(' / ')}。潮・水色は現時点では手動補正。`;$('autoReset').hidden=!state.rotationManual}
async function fetchWeather(place){
 LIVE.loading=true;LIVE.marineMessage='';document.querySelector('.fieldLive')?.classList.add('loading');
 try{
  const u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',place.lat);u.searchParams.set('longitude',place.lon);u.searchParams.set('current','temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m');u.searchParams.set('hourly','temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m');u.searchParams.set('forecast_hours','8');u.searchParams.set('wind_speed_unit','ms');u.searchParams.set('timezone','auto');
  const weatherPromise=fetch(u).then(async r=>{if(!r.ok)throw new Error('weather '+r.status);return r.json()});
  let marinePromise=Promise.resolve(null);
  if(cur?.water==='salt'){
   const m=new URL('https://marine-api.open-meteo.com/v1/marine');m.searchParams.set('latitude',place.lat);m.searchParams.set('longitude',place.lon);m.searchParams.set('current','wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction,sea_level_height_msl');m.searchParams.set('hourly','wave_height,sea_surface_temperature,ocean_current_velocity,sea_level_height_msl');m.searchParams.set('forecast_hours','8');m.searchParams.set('timezone','auto');m.searchParams.set('cell_selection','sea');
   marinePromise=fetch(m).then(async r=>{if(!r.ok)throw new Error('marine '+r.status);return r.json()}).catch(e=>{console.warn(e);return null});
  }
  const [d,md]=await Promise.all([weatherPromise,marinePromise]),c=d.current||{};
  LIVE.place=place;LIVE.weather={temperature:c.temperature_2m,precipitation:c.precipitation,code:c.weather_code,wind:c.wind_speed_10m,gust:c.wind_gusts_10m,direction:c.wind_direction_10m,time:c.time};LIVE.hourly=d.hourly||null;LIVE.marine=null;LIVE.marineHourly=null;
  if(md){const dist=kmBetween(place.lat,place.lon,+md.latitude,+md.longitude);if(dist<=30){const mc=md.current||{};LIVE.marine={wave:mc.wave_height,sst:mc.sea_surface_temperature,current:mc.ocean_current_velocity,currentDir:mc.ocean_current_direction,level:mc.sea_level_height_msl,time:mc.time,gridKm:dist};LIVE.marineHourly=md.hourly||null;LIVE.marineMessage=`海況は最寄り海グリッド（約${dist.toFixed(0)}km）からのモデル推定。沿岸では誤差が大きい場合がある。`;}else{LIVE.marineMessage=`指定地点から海況モデルの海グリッドまで約${dist.toFixed(0)}kmあるため、海況値は表示しない。港名など海沿いの地点で再検索して。`;}}
  else if(cur?.water==='salt')LIVE.marineMessage='海況モデルを取得できなかった。天候だけ反映中。';
  else LIVE.marineMessage='淡水ターゲットのため海況モデルは使わない。';
  state.wind=windBucket(+c.wind_speed_10m||0,+c.wind_gusts_10m||0);state.refined=true;if(!state.rotationManual&&cur)state.rotation=autoRotationIndex(basePlan());track('weather_live',{place:place.name,wind:LIVE.weather.wind,gust:LIVE.weather.gust,marine:!!LIVE.marine});renderResult();toast('現在条件をFIRST CASTへ反映した');
 }catch(e){console.error(e);toast('天候を取得できなかった')}finally{LIVE.loading=false;document.querySelector('.fieldLive')?.classList.remove('loading');renderFieldLive()}
}
async function searchSpot(){const q=$('spotQuery').value.trim();if(q.length<2){toast('2文字以上で検索して');return}LIVE.loading=true;document.querySelector('.fieldLive')?.classList.add('loading');$('spotResults').innerHTML='<div class="weatherEmpty">検索中…</div>';try{const u=new URL('https://geocoding-api.open-meteo.com/v1/search');u.searchParams.set('name',q);u.searchParams.set('count','5');u.searchParams.set('language','ja');u.searchParams.set('format','json');u.searchParams.set('countryCode','JP');const r=await fetch(u);if(!r.ok)throw new Error('geo '+r.status);const d=await r.json(),a=d.results||[];$('spotResults').innerHTML=a.length?a.map((x,i)=>`<button class="spotResult" data-i="${i}"><b>${x.name}</b><span>${[x.admin1,x.admin2].filter(Boolean).join(' / ')}</span></button>`).join(''):'<div class="weatherEmpty">候補が見つからんかった。</div>';$('spotResults').querySelectorAll('.spotResult').forEach(b=>b.onclick=()=>{const x=a[+b.dataset.i];$('spotResults').innerHTML='';fetchWeather({id:'custom',name:x.name,lat:x.latitude,lon:x.longitude,jma:null})})}catch(e){console.error(e);$('spotResults').innerHTML='<div class="weatherEmpty">地点検索に失敗した。</div>'}finally{LIVE.loading=false;document.querySelector('.fieldLive')?.classList.remove('loading')}}
function renderWeatherWindows(){const box=$('fieldWindow'),out=$('weatherWindows'),h=LIVE.hourly;if(!box||!out||!h?.time?.length||!cur){if(box)box.hidden=true;return}const idx=[0,2,4,6].filter(i=>i<h.time.length),p=basePlan(),rows=idx.map(i=>{const wave=nearestMarineWave(h.time[i]),st=windowStatus(h.wind_speed_10m?.[i],h.wind_gusts_10m?.[i],h.precipitation?.[i],wave),dp=daypartAt(h.time[i]),fit=daypartFits(p,dp);return {i,time:h.time[i],wave,st,dp,fit}});const candidates=rows.filter(x=>x.st.rank<3).sort((a,b)=>(a.st.rank-b.st.rank)||((b.fit?1:0)-(a.fit?1:0))),best=candidates[0];out.innerHTML=rows.map(x=>`<div class="weatherWindow ${x===best?'best ':''}${x.st.klass}"><div class="wt">${String(x.time).slice(11,16)} · ${x.dp}</div><div class="ws">${x.st.label}</div><div class="wd">風 ${h.wind_speed_10m?.[x.i]??'-'}m/s<br>突風 ${h.wind_gusts_10m?.[x.i]??'-'}m/s · 雨 ${h.precipitation?.[x.i]??'-'}mm${x.wave!=null?`<br>波 ${x.wave}m`:''}</div><span class="fishTime">基本時間帯 ${x.fit?'○':'—'}</span></div>`).join('');box.hidden=false}
function renderFieldLive(){if(!$('spotPresets'))return;$('spotPresets').innerHTML=FISHING_SPOTS.map(x=>`<button class="${LIVE.place?.id===x.id?'on':''}" data-id="${x.id}">${x.name}</button>`).join('');$('spotPresets').querySelectorAll('button').forEach(b=>b.onclick=()=>{const x=FISHING_SPOTS.find(s=>s.id===b.dataset.id);fetchWeather(x)});const w=LIVE.weather,p=LIVE.place,m=cur?.water==='salt'?LIVE.marine:null;if(!w||!p){$('weatherEmpty').hidden=false;$('weatherGrid').hidden=true;$('marineGrid').hidden=true;$('marineNote').hidden=true;$('fieldWindow').hidden=true;$('fieldUpdated').textContent='釣行地を選んで取得';$('fieldFit').textContent='FIELD STATUS · 未取得';$('fieldFit').className='fitBadge';$('fieldSafety').className='fieldSafety';$('fieldSafety').textContent='';$('jmaTideLink').href='https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php';return}$('weatherEmpty').hidden=true;$('weatherGrid').hidden=false;$('wxPlace').textContent=p.name;$('wxCode').textContent=weatherLabel(+w.code);$('wxTemp').textContent=`${w.temperature ?? '-'}℃`;$('wxWind').textContent=`${w.wind ?? '-'} m/s`;$('wxGust').textContent=`${w.gust ?? '-'} m/s`;$('wxRain').textContent=`${w.precipitation ?? '-'} mm`;$('fieldUpdated').textContent=`取得 ${w.time||'現在'} · 風を自動反映`;if(m){$('marineGrid').hidden=false;$('seaWave').textContent=m.wave!=null?`${m.wave} m`:'-';$('seaTemp').textContent=m.sst!=null?`${m.sst}℃`:'-';$('seaCurrent').textContent=m.current!=null?`${m.current} km/h${m.currentDir!=null?` / ${Math.round(m.currentDir)}°`:''}`:'-';$('seaLevel').textContent=m.level!=null?`${m.level} m`:'-'}else $('marineGrid').hidden=true;const marineMsg=cur?.water==='salt'?(LIVE.marineMessage||''):'';$('marineNote').hidden=!marineMsg;$('marineNote').textContent=marineMsg;const [label,klass]=fieldStatus(+w.wind||0,+w.gust||0,+w.precipitation||0,m?.wave);$('fieldFit').textContent=`FIELD STATUS · ${label}`;$('fieldFit').className='fitBadge '+klass;const fs=$('fieldSafety');if(klass==='danger'){fs.className='fieldSafety danger';fs.textContent='現在条件は厳しい。特に堤防・磯・サーフでは現地の波・立入状況を確認し、釣行見合わせも検討。'}else if(klass==='warn'){fs.className='fieldSafety warn';fs.textContent='風・突風・雨・波のどれかが操作を難しくする水準。軽い仕掛けより安定性を優先し、安全余裕を取る。'}else{fs.className='fieldSafety on';fs.textContent='気象・海況モデル上は極端な条件ではない。ただし安全判定ではないので、現地の波・足場・立入情報を優先。'}renderWeatherWindows();$('jmaTideLink').href=jmaUrl(p.jma);$('tideOfficial').querySelector('small').textContent=p.jma?`${p.name}に対応する気象庁の天文潮位予測。実測潮位ではない。`:'最寄り観測地点は未自動特定。気象庁一覧から確認。'}

function storeGet(k){try{return localStorage.getItem(k)}catch{return Object.prototype.hasOwnProperty.call(MEMORY_STORE,k)?MEMORY_STORE[k]:null}}
function storeSet(k,v){try{localStorage.setItem(k,v);return true}catch{MEMORY_STORE[k]=String(v);return false}}

const ROTATIONS={
'ショアジギング':[
{name:'メタルジグ',size:'40〜80g',color:'シルバー系',range:'中層〜ボトム',action:'ワンピッチ',when:'まず広く探る'},
{name:'シンキングペンシル',size:'30〜60g',color:'ベイト系',range:'表層〜中層',action:'速巻き＋フォール',when:'表層反応・ベイトが見える'},
{name:'ミノー',size:'12〜16cm',color:'ナチュラル',range:'表層',action:'ただ巻き',when:'朝夕の高活性'}],
'ジギング':[
{name:'メタルジグ',size:'100〜200g',color:'シルバー/ブルー',range:'中層〜ボトム',action:'ワンピッチ',when:'船長指示の層を刻む'},
{name:'セミロングジグ',size:'120〜220g',color:'シルバー',range:'中層〜ボトム',action:'ロングジャーク',when:'大きく見せたい'},
{name:'ショートジグ',size:'80〜160g',color:'グロー/ゼブラ',range:'ボトム',action:'細かいピッチ',when:'ベイトが小さい'}],
'ブレードジギング':[
{name:'ブレードジグ',size:'30〜60g',color:'シルバー',range:'表層〜中層',action:'高速ただ巻き',when:'基準'},
{name:'メタルジグ',size:'30〜50g',color:'ブルピン',range:'中層',action:'速巻き',when:'飛距離優先'},
{name:'ミノー',size:'10〜14cm',color:'ベイト系',range:'表層',action:'高速巻き',when:'浅いレンジに浮く'}],
'ルアーシーバス':[
{name:'ミノー',size:'9〜14cm',color:'ベイト系',range:'表層〜中層',action:'ドリフト',when:'まず流れを見る'},
{name:'シンキングペンシル',size:'8〜12cm',color:'クリア/ベイト',range:'表層〜中層',action:'スロー巻き',when:'弱い波動で見せる'},
{name:'バイブレーション',size:'15〜28g',color:'シルバー/チャート',range:'中層〜底',action:'ただ巻き',when:'深い・速い流れ'}],
'サーフルアー':[
{name:'ジグヘッド＋ワーム',size:'20〜30g / 4inch',color:'ナチュラル/ピンク',range:'底から0.5〜1m',action:'スロー巻き',when:'基準'},
{name:'ヘビーシンペン',size:'25〜40g',color:'ベイト系',range:'底〜中層',action:'ただ巻き',when:'自然に見せたい'},
{name:'メタルジグ',size:'30〜50g',color:'シルバー',range:'中層〜底',action:'巻き＋フォール',when:'沖を広く探る'}],
'ワームゲーム':[
{name:'シャッドワーム',size:'3〜5inch / 14〜30g',color:'ゴールド/ナチュラル',range:'ボトム',action:'リフト&フォール',when:'基準'},
{name:'メタルジグ',size:'20〜40g',color:'シルバー',range:'ボトム',action:'小さくリフト',when:'遠投して探す'},
{name:'グラブ/カーリーテール',size:'3〜4inch',color:'チャート/茶',range:'ボトム',action:'ゆっくり巻く',when:'波動を強める'}],
'サビキ釣り':[
{name:'サビキ仕掛け',size:'4〜8号目安',color:'白/ピンク皮',range:'群れのタナ',action:'コマセ同調',when:'基準'},
{name:'小針サビキ',size:'3〜5号',color:'白/ケイムラ',range:'表層〜中層',action:'小さく誘う',when:'豆アジ・食い渋り'},
{name:'大きめサビキ',size:'7〜10号',color:'ピンク/魚皮',range:'中層〜底',action:'ゆっくり誘う',when:'良型狙い'}],
'メバリング':[
{name:'ジグヘッド＋ワーム',size:'1〜2g / 1.5〜2inch',color:'クリア/グロー',range:'表層〜中層',action:'超スロー巻き',when:'基準'},
{name:'小型プラグ',size:'3〜5cm',color:'クリア',range:'表層',action:'ただ巻き',when:'表層に浮く'},
{name:'フロートリグ',size:'5〜12g前後',color:'ナチュラル',range:'表層〜中層',action:'遠投スロー',when:'沖の潮目'}],
'エギング':[
{name:'エギ',size:'3〜3.5号',color:'ピンク/オレンジ',range:'中層〜底',action:'しゃくり→フォール',when:'基準'},
{name:'エギ',size:'2.5〜3号',color:'ナチュラル',range:'表層〜中層',action:'小さくしゃくる',when:'秋の小型・高活性'},
{name:'エギ',size:'3.5号',color:'ケイムラ/ダーク',range:'底',action:'長めフォール',when:'大型・低活性'}],
'テンヤ釣り':[
{name:'テンヤ＋キビナゴ',size:'2〜6号',color:'グロー',range:'表層〜中層',action:'スロー巻き＋誘い',when:'基準'},
{name:'ワインド',size:'1/2〜3/4oz',color:'グロー/白',range:'中層',action:'ダート',when:'高活性'},
{name:'メタルジグ',size:'20〜40g',color:'ゼブラグロー',range:'中層〜底',action:'フォール主体',when:'深いレンジ'}],
'フカセ釣り':[
{name:'オキアミ',size:'チヌ針1〜3号',color:'自然色',range:'中層〜底',action:'撒き餌同調',when:'基準'},
{name:'練り餌',size:'針に合わせる',color:'黄/赤系',range:'底寄り',action:'同調',when:'餌取り対策'},
{name:'コーン',size:'1〜3粒',color:'黄',range:'底',action:'止め気味',when:'選択的に狙う'}],
'遠投カゴ釣り':[
{name:'オキアミ',size:'マダイ針8〜11号',color:'自然色',range:'中層〜底',action:'タナを合わせる',when:'基準'},
{name:'オキアミ＋撒き餌',size:'ハリス4〜6号目安',color:'自然色',range:'回遊層',action:'定点投入',when:'群れを寄せる'},
{name:'大型付け餌',size:'大粒',color:'自然色',range:'底寄り',action:'長めに待つ',when:'大型狙い'}],
'投げ釣り':[
{name:'ジャリメ',size:'キス針6〜9号',color:'自然色',range:'ボトム',action:'ゆっくりサビく',when:'基準'},
{name:'青イソメ',size:'小さめ',color:'自然色',range:'ボトム',action:'サビく',when:'餌持ち優先'},
{name:'多針仕掛け',size:'5〜7本針',color:'発光玉は控えめ',range:'ボトム',action:'当たり距離を維持',when:'群れを見つけた'}],
'胴突き釣り':[
{name:'アサリ',size:'ハゲ針4〜6号',color:'自然色',range:'ボトム',action:'叩く→止める',when:'基準'},
{name:'青イソメ',size:'小さめ',color:'自然色',range:'ボトム',action:'止める時間を長く',when:'堤防で手軽に'},
{name:'アサリ',size:'小さめ',color:'自然色',range:'ボトム',action:'たるませ',when:'食い渋り'}],
'ワーム':[
{name:'ストレートワーム',size:'3〜5inch',color:'グリパン',range:'ボトム〜カバー',action:'ズル引き/シェイク',when:'基準'},
{name:'シャッドテール',size:'3〜4inch',color:'ワカサギ系',range:'中層',action:'ただ巻き',when:'魚を探す'},
{name:'ノーシンカー',size:'4〜5inch',color:'ナチュラル',range:'表層〜中層',action:'フォール',when:'プレッシャーが高い'}],
'スプーン':[
{name:'スプーン',size:'1〜2g',color:'金/銀',range:'表層〜中層',action:'一定速',when:'まず活性を見る'},
{name:'スプーン',size:'2〜4g',color:'地味色',range:'中層〜底',action:'遅め',when:'反応が落ちた'},
{name:'小型ミノー',size:'4〜6cm',color:'ベイト系',range:'中層',action:'トゥイッチ',when:'リアクション'}],
'友釣り':[{name:'オトリ鮎',size:'現地サイズに合わせる',color:'自然色',range:'流れの筋',action:'自然に泳がせる',when:'基準'}],
'ぶっ込み釣り':[
{name:'練り餌/コーン',size:'コイ針10〜15号',color:'自然色',range:'ボトム',action:'待ち',when:'基準'},
{name:'パン',size:'一口大',color:'自然色',range:'表層',action:'浮かせる',when:'魚が見える'},
{name:'コーン',size:'2〜4粒',color:'黄',range:'ボトム',action:'長めに待つ',when:'小魚を避ける'}],
'渓流ルアー':[
{name:'シンキングミノー',size:'4〜6cm',color:'ヤマメ/アユ系',range:'中層',action:'トゥイッチ',when:'基準'},
{name:'スプーン',size:'3〜7g',color:'金/銀',range:'中層〜底',action:'ドリフト',when:'深い淵'},
{name:'スピナー',size:'3〜5g',color:'銀/黒',range:'中層',action:'ただ巻き',when:'流れが緩い'}],
'泳がせ釣り':[{name:'活きイワシ/アジ',size:'現地ベイトに合わせる',color:'自然色',range:'底から0.5〜1m',action:'食い込み待ち',when:'基準'}],
'船サビキ/コマセ釣り':[{name:'アミコマセ＋仕掛け',size:'船宿指定',color:'自然色',range:'指示ダナ',action:'コマセ同調',when:'基準'}],
'ティップラン':[{name:'ティップランエギ',size:'30〜50g前後',color:'紫/オレンジ',range:'底〜中層',action:'しゃくり→静止',when:'基準'}],
'船テンヤ':[{name:'タチウオテンヤ＋イワシ',size:'船宿指定',color:'グロー',range:'指示ダナ',action:'誘い→止め',when:'基準'}],
'タイラバ':[
{name:'タイラバ',size:'60〜150g前後',color:'オレンジ/赤',range:'底〜中層',action:'等速巻き',when:'基準'},
{name:'タイラバ',size:'同重量',color:'黒/緑',range:'底',action:'遅め',when:'濁り・低活性'},
{name:'タイラバ',size:'軽め',color:'赤/金',range:'底〜中層',action:'速め',when:'潮が緩い'}],
'船カワハギ':[{name:'アサリ',size:'専用3本針',color:'自然色',range:'ボトム',action:'叩く→止める',when:'基準'}]
};

const SPECIES_ROTATIONS={
'サワラ':{'ショアジギング':[
{name:'ブレード付きジグ',size:'30〜50g',color:'シルバー/チャート',range:'中層〜表層',action:'高速ただ巻き',when:'基準'},
{name:'メタルジグ',size:'30〜50g',color:'シルバー系',range:'表層〜ボトム',action:'ただ巻き＋軽いダート',when:'広く探る'},
{name:'ミノー',size:'10〜14cm',color:'ベイト系',range:'表層〜中層',action:'ただ巻き/ジャーク',when:'魚が浮く'}
]}
};

function speciesArt(f){
 const n=typeof f==='string'?f:(f?.name||'');
 const eye=`<circle class="eyeWhite" cx="48" cy="40" r="4"/><circle class="eye" cx="48" cy="40" r="1.6"/>`;
 const base=(extra='',body='M18 50c18-24 52-35 91-30 24 3 43 12 54 25l25-14-8 23 8 21-28-11c-15 14-39 20-66 18-37-3-63-13-76-32Z')=>`<svg class="speciesSvg" viewBox="0 0 190 100" aria-hidden="true"><path fill="currentColor" d="${body}"/>${eye}${extra}</svg>`;
 if(n==='ブリ・ワラサ') return base(`<path class="stripe" d="M38 51c34-3 71-2 112 5-30 7-78 8-112-5Z"/><path class="detail" d="M88 22 105 8l14 18"/>`);
 if(n==='カンパチ') return base(`<path class="stripe" d="M35 30 57 47 48 64 30 47Z"/><path class="detail" d="M83 22 101 8l16 17"/>`);
 if(n==='サワラ') return base(Array.from({length:9},(_,i)=>`<circle class="spot" cx="${70+i*9}" cy="${34+(i%2)*18}" r="3"/>`).join(''),'M14 49c20-18 54-28 96-26 27 1 45 9 57 20l21-10-7 18 7 17-24-8c-20 14-53 21-88 16-31-4-52-13-62-27Z');
 if(n==='シーバス') return base(`<path class="detail" d="M28 58c34 8 77 10 119 0"/><path class="detail" d="M83 23 103 9l13 18"/>`,'M16 50c22-24 56-33 96-27 27 4 43 14 53 25l23-10-8 20 8 16-24-7c-18 13-46 18-78 13-35-5-58-15-70-30Z');
 if(n==='ヒラメ') return `<svg class="speciesSvg" viewBox="0 0 190 100"><path fill="currentColor" d="M20 52c25-32 71-42 118-20l32-12-11 24 11 22-31-9c-43 27-93 24-119-5Z"/><circle class="eyeWhite" cx="48" cy="38" r="4"/><circle class="eye" cx="48" cy="38" r="1.6"/><circle class="eyeWhite" cx="60" cy="43" r="3.4"/><circle class="eye" cx="60" cy="43" r="1.3"/>${[80,100,121].map((x,i)=>`<circle class="spot" cx="${x}" cy="${42+i*8}" r="5"/>`).join('')}</svg>`;
 if(n==='マゴチ') return base(`<path class="detail" d="M21 46c14-8 24-11 42-11M32 57c13 5 25 6 36 4"/>`,'M12 48c13-17 41-24 88-22 35 2 55 9 67 19l22-9-8 17 7 13-25-5c-24 10-58 15-100 10-26-3-43-11-51-23Z');
 if(n==='アジ') return base(`<path class="detail" d="M124 34c-3 12-2 23 2 34"/><path class="detail" d="M84 25 96 13l10 15"/>`,'M18 50c22-26 54-34 88-25 22 6 37 17 47 26l30-10-10 18 9 16-31-8c-15 11-37 16-61 13-34-4-58-14-72-30Z');
 if(n==='メバル') return base(`<path class="detail" d="M78 24 84 8l9 17 9-17 8 19"/><path class="detail" d="M31 61c12 4 22 4 32 1"/>`,'M17 51c16-30 50-42 89-31 25 7 41 20 50 31l27-12-8 22 8 17-29-9c-16 14-40 21-65 17-36-5-61-17-72-35Z');
 if(n==='アオリイカ') return `<svg class="speciesSvg" viewBox="0 0 180 105"><path fill="currentColor" d="M91 11c25 6 37 31 30 54-6 17-20 25-30 28-10-3-24-11-30-28-7-23 5-48 30-54Z"/><path class="light" fill="currentColor" d="M68 30 43 45l22 5m50-20 24 15-21 5"/><circle class="eyeWhite" cx="73" cy="57" r="3.5"/><circle class="eyeWhite" cx="109" cy="57" r="3.5"/><path class="detail" d="M78 91c-2 8-6 11-11 10m17-9c0 7-2 11-6 11m14-11c0 8 2 11 6 11m7-12c1 8 6 11 11 10"/></svg>`;
 if(n==='タチウオ') return `<svg class="speciesSvg" viewBox="0 0 190 90"><path fill="currentColor" d="M10 44c37-34 79 21 120-13 18-15 32-9 47 1-24-3-32 21-53 24-40 5-74-31-114 5 7-5 8-10 0-17Z"/><circle class="eyeWhite" cx="166" cy="38" r="3.5"/><circle class="eye" cx="166" cy="38" r="1.4"/><path class="detail" d="M31 49c34-7 68 12 98 1"/></svg>`;
 if(n==='クロダイ') return base(`<path class="detail" d="M66 24 72 7l11 16 10-16 7 18"/><path class="stripe" d="M72 26h7v48h-7zm18-4h7v55h-7zm19 2h7v49h-7z"/>`,'M18 50c18-31 58-42 99-29 20 6 34 17 43 28l26-12-9 22 9 18-27-9c-13 12-35 21-59 20-42-2-70-16-82-38Z');
 if(n==='マダイ') return base(`<circle class="spot" cx="82" cy="43" r="3"/><circle class="spot" cx="103" cy="52" r="3"/><path class="detail" d="M67 24 76 8l9 16 11-16 7 18"/>`,'M18 50c18-31 58-42 99-29 20 6 34 17 43 28l26-12-9 22 9 18-27-9c-13 12-35 21-59 20-42-2-70-16-82-38Z');
 if(n==='シロギス') return base(`<path class="detail" d="M24 53c44 7 89 7 136 1"/>`,'M13 50c20-15 55-22 102-20 24 1 42 7 52 16l22-8-7 15 7 13-24-6c-22 9-57 13-100 9-28-3-45-9-52-19Z');
 if(n==='カワハギ') return `<svg class="speciesSvg" viewBox="0 0 190 100"><path fill="currentColor" d="M28 51c10-34 36-48 70-42 30 5 46 23 50 43l33-11-12 21 12 17-35-8c-10 18-31 26-55 23-36-5-58-20-63-43Z"/><circle class="eyeWhite" cx="57" cy="34" r="4"/><circle class="eye" cx="57" cy="34" r="1.5"/><path class="detail" d="M73 13 78 1l8 15"/><path class="stripe" d="M76 18h8v62h-8zm22 0h8v65h-8z"/></svg>`;
 if(n==='ブラックバス') return base(`<path class="detail" d="M21 51c15 5 31 6 47 2M82 24 101 10l15 17"/><path class="stripe" d="M63 35c18 7 36 12 58 13-20 9-40 11-59 7Z"/>`,'M14 50c24-28 62-36 101-25 25 7 40 19 49 30l25-9-9 18 8 15-28-6c-15 12-40 17-70 12-39-6-65-17-76-35Z');
 if(n==='ニジマス') return base(`${[67,83,99,116,132].map((x,i)=>`<circle class="spot" cx="${x}" cy="${32+(i%2)*24}" r="2.5"/>`).join('')}<path class="stripe" d="M45 51c30-3 64-2 100 5-31 8-67 7-100-5Z"/>`,'M15 50c22-24 57-34 98-27 24 4 41 14 51 25l25-10-8 20 8 16-26-7c-17 13-44 19-76 14-37-5-61-16-72-31Z');
 if(n==='アユ') return base(`<path class="detail" d="M84 24 101 9l14 18"/><circle class="spot" cx="66" cy="51" r="4"/>`,'M13 50c22-20 56-29 100-24 26 3 43 12 53 23l23-9-7 17 7 14-25-6c-20 11-51 16-87 12-33-4-54-13-64-27Z');
 if(n==='コイ') return base(`<path class="detail" d="M28 53c8 1 17 0 25-3M25 48l-9 5m11-1-9 10"/><path class="detail" d="M83 24 101 10l16 18"/>`,'M13 50c20-29 59-39 103-27 23 6 38 18 47 29l26-10-9 20 8 16-29-8c-16 12-42 18-72 13-40-6-65-18-74-33Z');
 if(n==='ヤマメ・イワナ') return base(`${[67,84,101,118,135].map(x=>`<ellipse class="spot" cx="${x}" cy="50" rx="4" ry="8"/>`).join('')}<path class="detail" d="M84 24 100 9l14 18"/>`,'M15 50c22-24 57-34 98-27 24 4 41 14 51 25l25-10-8 20 8 16-26-7c-17 13-44 19-76 14-37-5-61-16-72-31Z');
 return base();
}
function art(shape){return speciesArt({name:'',shape})}
function track(name,props={}){try{const k='fish_target_v9_events';let a=JSON.parse(storeGet(k)||'[]');a.push({name,props,ts:Date.now()});storeSet(k,JSON.stringify(a.slice(-120)))}catch{}}
function show(v){['home','result','saved'].forEach(x=>$(x).classList.remove('on'));$(v).classList.add('on');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));if(v==='saved')renderSaved();scrollTo({top:0,behavior:'smooth'})}
function toast(t){$('toast').textContent=t;$('toast').classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.remove('on'),1500)}
function basePlan(){let p={...cur},o=O[cur.name]?.[state.place];if(o)Object.assign(p,o);if(state.goal==='大物狙い'){p.rod+='（強め優先）';p.leader+='（上限寄り）'}return p}
function timeFit(p){const d=currentDaypart(),t=p.time||'';if((d==='朝'&&t.includes('朝'))||(d==='夕'&&t.includes('夕'))||(d==='夜'&&t.includes('夜'))||(d==='昼'&&t.includes('昼')))return '高い';if(t.includes('朝夕')&&(d==='朝'||d==='夕'))return '高い';return '標準'}
function dynamicColor(base,p){if(p.style==='bait')return base||p.color||'自然色';if(state.clarity==='濁り')return 'チャート / ゴールド寄り';if(state.clarity==='澄み')return 'ナチュラル / シルバー寄り';return base||p.color||'基準色'}
function dynamicSize(base){const s=base||'基準サイズ';const p=cur?basePlan():null;const m=cur?.water==='salt'?LIVE.marine:null;const rough=!!m&&((+m.wave||0)>=1.2||(+m.current||0)>=2);const gramOrOz=/\d(?:[^\d]{0,8})?(?:g\b|oz\b)/i.test(s);const weightedGo=!!p&&/テンヤ/.test(p.method||'')&&/\d+(?:\.\d+)?\s*(?:〜|～|~|-)?\s*\d*(?:\.\d+)?\s*号/.test(s);if(!gramOrOz&&!weightedGo)return s;if(state.wind==='強い'||rough)return s+'（重量は上限寄り）';if(state.wind==='弱い'&&!rough)return s+'（軽量側も可）';return s}
function conditionAdvice(p){const bits=[];if(!state.refined)bits.push('風・潮・水色は未入力なので初期値のまま');if(state.wind==='強い')bits.push('風が強いなら飛距離とライン管理を優先し、危険な立ち位置を避ける');if(LIVE.marine?.wave>=1.2)bits.push('波が高めなので岸釣りではルアー操作より安全余裕を優先');if(LIVE.marine?.current>=2)bits.push('流れが強めなので底取りしやすい重さを優先');if(state.tide==='止まり気味')bits.push('潮が緩いなら地形変化・流れ込み・明暗など変化へ絞る');else bits.push('潮が動く想定なら潮目・ヨレ・払い出しを優先');if(state.clarity==='濁り')bits.push('濁りでは視認性と波動を少し強める');if(state.clarity==='澄み')bits.push('澄み潮では自然色と弱めの見せ方から入る');return bits.join('。')+'。'}
function difficultyBucket(f){if(f.difficulty==='上級')return 'advanced';if((f.difficulty||'').includes('初心者')||(f.difficulty||'').startsWith('初'))return 'easy';return 'mid'}
function renderFilters(){const defs=[['waterFilters',[['all','すべて'],['salt','海'],['fresh','淡水']],waterFilter,'water'],['styleFilters',[['all','全部'],['lure','ルアー'],['bait','エサ']],styleFilter,'style'],['difficultyFilters',[['all','全部'],['easy','初〜初心者'],['mid','中級'],['advanced','上級']],difficultyFilter,'difficulty']];defs.forEach(([id,vals,current,key])=>{$(id).innerHTML=vals.map(([v,l])=>`<button class="${current===v?'on':''}" data-v="${v}">${l}</button>`).join('');$(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{if(key==='water')waterFilter=b.dataset.v;if(key==='style')styleFilter=b.dataset.v;if(key==='difficulty')difficultyFilter=b.dataset.v;track('filter_change',{key,value:b.dataset.v});renderFilters();renderHome()})})}
function renderHome(){const q=$('q').value.trim().toLowerCase();$('clearSearch').classList.toggle('on',!!q);const a=F.filter(f=>{const core=(f.name+' '+f.tags.join(' ')+' '+(f.syn||[]).join(' ')).toLowerCase(),method=(f.method||'').toLowerCase(),match=!q||core.includes(q)||(q.length>=3&&method.includes(q));return (waterFilter==='all'||f.water===waterFilter)&&(styleFilter==='all'||f.style===styleFilter)&&(difficultyFilter==='all'||difficultyBucket(f)===difficultyFilter)&&match});$('count').textContent=`${a.length}種`;$('grid').innerHTML=a.length?a.map(f=>`<button class="fish ${f.water==='fresh'?'fresh':''}" data-fish="${f.name}" data-i="${F.indexOf(f)}"><div class="art">${speciesArt(f)}</div><div class="info"><div class="tags">${f.tags.join(' ・ ')}</div><div class="name">${f.name}</div><span class="methodSmall">おすすめ：${f.method}</span><div class="difficultyMini">${f.difficulty||''}</div></div></button>`).join(''):'<div class="empty">該当する魚がないで。検索語かフィルターを変えてみて。</div>';$('grid').querySelectorAll('.fish').forEach(b=>b.onclick=()=>openFish(F[+b.dataset.i]))}
function rotationFor(p){const list=SPECIES_ROTATIONS[cur?.name]?.[p.method]||ROTATIONS[p.method]||[{name:p.bait||'基準',size:p.size||'基準',color:p.color||'基準色',range:p.range||'状況次第',action:p.baitAction||p.action||'基本操作',when:'基準'}];return list}
function currentRotation(p){const list=rotationFor(p);const idx=Math.max(0,Math.min(state.rotation,list.length-1));return list[idx]}
function setManualRotation(index){state.rotation=index;state.rotationManual=true}
function restoreAutoRotation(){state.rotationManual=false;state.rotation=autoRotationIndex(basePlan())}
function switchText(p){if(p.style==='bait'||['フカセ釣り','遠投カゴ釣り','投げ釣り','胴突き釣り','友釣り','ぶっ込み釣り','泳がせ釣り','船サビキ/コマセ釣り','船テンヤ','船カワハギ'].includes(p.method))return '反応が無ければ、まずタナ・投入点を変える → 次に餌や仕掛けを替える。餌だけを延々交換するより「魚がいる層」を先に探す。';return '10〜15投反応が無ければ、まずレンジ → 速度 → ルアー種類 → 色の順で変更。同じ場所・同じ操作の固定化を避ける。'}
function choice(id,vals,key){$(id).innerHTML=vals.map(v=>`<button class="${state[key]===v?'on':''}" data-v="${v}">${v}</button>`).join('');$(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{state[key]=b.dataset.v;if(['wind','tide','clarity'].includes(key))state.refined=true;if(key==='place'){state.rotation=0;state.rotationManual=false}track('condition_change',{key,value:b.dataset.v,fish:cur?.name});renderResult()})}
function openFish(f,restore){cur=f;state=restore?{...{place:'おすすめ',season:seasonNow,goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false},...restore}:{place:'おすすめ',season:seasonNow,goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false};from=$('saved').classList.contains('on')?'saved':'home';track('fish_open',{fish:f.name});renderResult();show('result')}
function renderRotation(p){const list=rotationFor(p);if(state.rotation>=list.length)state.rotation=0;const r=currentRotation(p);$('firstBait').textContent=r.name;$('firstSize').textContent=dynamicSize(r.size);$('firstColor').textContent=dynamicColor(r.color,p);$('firstRange').textContent=r.range;$('firstAction').textContent=r.action;$('rotation').innerHTML=list.map((x,i)=>`<button class="${state.rotation===i?'on':''}" data-i="${i}">${x.name}<small>${x.when}</small></button>`).join('');$('rotation').querySelectorAll('button').forEach(b=>b.onclick=()=>{setManualRotation(+b.dataset.i);track('rotation_select',{fish:cur.name,method:p.method,index:state.rotation});renderResult()});$('firstCastKicker').textContent=state.rotationManual?'最初の1投 · MANUAL':'最初の1投 · AUTO';$('firstCastKicker').classList.toggle('manual',state.rotationManual);$('switchRule').textContent=switchText(p)}
function evidenceRows(p){const override=O[cur.name]?.[state.place];const manual=state.refined?`${state.wind} / ${state.tide} / ${state.clarity}`:'未入力（初期値）';return [
['魚種→釣法',`<strong>${cur.name}</strong>の基準プランとして ${p.method} を設定`],
['釣り場',override?`<strong>${state.place}</strong>に合わせて釣法・タックルを切り替え`:`${state.place==='おすすめ'?'基準ポイント':state.place}向けの基準構成`],
['季節',`<strong>${state.season}</strong>：${cur.season[state.season]}`],
['端末時刻',`${currentDaypart()} / 時刻相性：<strong>${timeFit(p)}</strong>`],
['任意条件',manual],
['FIELD LIVE',LIVE.weather?`${LIVE.place.name} / 風 ${LIVE.weather.wind}m/s / 突風 ${LIVE.weather.gust}m/s${LIVE.marine?.wave!=null?` / 波 ${LIVE.marine.wave}m`:''}`:'未取得']
]}

function planKey(p){return [cur?.name||'',p.method,state.place,state.goal].join('|')}
function checklistStore(){try{return JSON.parse(storeGet('fish_target_v9_checklists')||'{}')}catch{return{}}}
function checklistItems(p){const r=currentRotation(p),items=[
{id:'rod',level:'必須',name:'ロッド',detail:p.rod},
{id:'reel',level:'必須',name:'リール',detail:p.reel},
{id:'line',level:'必須',name:'メインライン',detail:p.line},
{id:'leader',level:'必須',name:'リーダー / ハリス',detail:p.leader},
{id:'rig',level:'必須',name:'仕掛け',detail:p.rig},
{id:'first',level:'必須',name:'FIRST CAST / 餌',detail:`${r.name} · ${dynamicSize(r.size)} · ${dynamicColor(r.color,p)}`},
{id:'spare',level:'推奨',name:'予備',detail:p.style==='bait'?'仕掛け2〜3組 + 予備餌':'ローテーション候補を2種類以上'},
{id:'safe',level:'必須',name:'安全装備',detail:'釣り場に適したライフジャケット等'}];
if(LIVE.weather&&(+LIVE.weather.precipitation||0)>=1)items.push({id:'rain',level:'LIVE',name:'レインウェア',detail:`現在降水 ${LIVE.weather.precipitation}mm。濡れ・低体温対策を追加`});
if(state.wind==='強い'||(cur?.water==='salt'&&(+LIVE.marine?.current||0)>=2))items.push({id:'heavy',level:'LIVE',name:'重めの予備',detail:'風・流れ対策。使用規格の上限内で底取り/飛距離を確保'});
return items}
function renderChecklist(p){const key=planKey(p),store=checklistStore(),checked=new Set(store[key]||[]),items=checklistItems(p);$('shoppingCount').textContent=`${checked.size}/${items.length}`;$('shoppingList').innerHTML=items.map(x=>`<label class="shopItem"><input type="checkbox" data-id="${x.id}" ${checked.has(x.id)?'checked':''}><span class="shopCheck"></span><span class="shopText"><b>${x.name}<em>${x.level}</em></b><small>${x.detail}</small></span></label>`).join('');$('shoppingList').querySelectorAll('input').forEach(i=>i.onchange=()=>{const s=checklistStore(),a=new Set(s[key]||[]);i.checked?a.add(i.dataset.id):a.delete(i.dataset.id);s[key]=[...a];storeSet('fish_target_v9_checklists',JSON.stringify(s));$('shoppingCount').textContent=`${a.size}/${items.length}`;track('checklist_toggle',{fish:cur.name,method:p.method,item:i.dataset.id,checked:i.checked})})}

const RIG_COMPONENTS=[
 {keys:['メインライン','道糸','PE','ライン','天上糸','水中糸','力糸'],type:'line',label:'ライン',role:'リールから仕掛けへ力と情報を伝える。太さ・素材は釣法と対象魚に合わせる。'},
 {keys:['リーダー','ハリス','幹糸','捨て糸'],type:'leader',label:'リーダー / ハリス',role:'擦れ・魚の歯・食い込みに対応する先糸。結束強度と長さが重要。'},
 {keys:['サルカン','スイベル','スナップ','リング','鼻カン'],type:'swivel',label:'接続パーツ',role:'仕掛け同士を確実に接続し、交換性や糸ヨレ対策を担う。'},
 {keys:['ウキ'],type:'float',label:'ウキ',role:'アタリを可視化し、仕掛けを狙うタナへ保持する。'},
 {keys:['カゴ','ビシ','コマセ'],type:'cage',label:'カゴ / コマセ',role:'撒き餌を狙う層へ届け、魚を仕掛け周辺へ寄せる。'},
 {keys:['オモリ','天秤','シンカー'],type:'sinker',label:'オモリ',role:'仕掛けを沈め、底取りや飛距離を安定させる。重さは潮・水深・風へ合わせる。'},
 {keys:['サビキ','胴突き','多針仕掛け','仕掛け'],type:'rig',label:'仕掛け本体',role:'複数の針や枝スを含む完成仕掛け。対象魚のサイズへ針号数を合わせる。'},
 {keys:['テンヤ'],type:'tenya',label:'テンヤ',role:'オモリと針を一体化した仕掛け。餌を固定し、狙うレンジを操作する。'},
 {keys:['タイラバ'],type:'lure',label:'タイラバ',role:'着底から一定速度で巻き上げ、ヘッド・ネクタイの動きでマダイを誘う。'},
 {keys:['エギ'],type:'lure',label:'エギ',role:'イカ用の疑似餌。しゃくりで動かし、フォール中に抱かせる。'},
 {keys:['メタルジグ','ヘビージグ','ジグ'],type:'lure',label:'メタルジグ',role:'金属製ルアー。飛距離や沈下速度を活かし、広いレンジを探る。'},
 {keys:['ジグヘッド'],type:'jighead',label:'ジグヘッド',role:'オモリ付きフック。ワームをセットして底取りとレンジ操作を行う。'},
 {keys:['ワーム','シャッドワーム'],type:'worm',label:'ワーム',role:'柔らかい疑似餌。泳ぎ・波動・フォールで食わせる。'},
 {keys:['活き餌','活きイワシ','アジ','オトリ'],type:'bait',label:'活き餌',role:'生きた餌の動きで対象魚を誘う。弱らせない投入とタナ管理が重要。'},
 {keys:['針','チヌ針','マダイ針','掛け針','フック'],type:'hook',label:'針',role:'魚を掛ける最終パーツ。対象魚と餌サイズに合う号数を選ぶ。'}
];
function rigMeta(token){const t=token.trim();for(const x of RIG_COMPONENTS){if(x.keys.some(k=>t.includes(k)))return {...x,token:t}}return {type:'part',label:'仕掛けパーツ',role:'この釣法を構成する接続パーツ。順番と結束を確認してセットする。',token:t}}
function rigIcon(type){const common='viewBox="0 0 24 24" fill="none" aria-hidden="true"';if(type==='line'||type==='leader')return `<svg ${common}><path d="M4 5c7 0 9 14 16 14M4 19c7 0 9-14 16-14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;if(type==='swivel')return `<svg ${common}><circle cx="8" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 12h0" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`;if(type==='float')return `<svg ${common}><path d="M12 3v5m0 8v5" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="4" ry="5" stroke="currentColor" stroke-width="1.8"/></svg>`;if(type==='cage')return `<svg ${common}><path d="M7 6h10l-1 12H8L7 6Z" stroke="currentColor" stroke-width="1.8"/><path d="M9 9h6M9 12h6M9 15h6" stroke="currentColor" stroke-width="1.4"/></svg>`;if(type==='sinker')return `<svg ${common}><path d="m12 3 6 9-6 9-6-9 6-9Z" stroke="currentColor" stroke-width="1.8"/></svg>`;if(type==='hook')return `<svg ${common}><path d="M12 3v11c0 5-7 5-7 0 0-2 1-3 3-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m8 10-2 1 2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;if(type==='lure'||type==='tenya'||type==='jighead')return `<svg ${common}><path d="M4 12c4-5 10-6 16-2-3 6-9 8-16 2Z" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="11" r="1" fill="currentColor"/><path d="M17 13c1 3 2 5 4 6" stroke="currentColor" stroke-width="1.5"/></svg>`;if(type==='worm'||type==='bait')return `<svg ${common}><path d="M4 14c3-7 7 5 10-2s5-2 6 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;if(type==='rig')return `<svg ${common}><path d="M12 3v18M12 8 6 12m6 2 6 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/></svg>`;return `<svg ${common}><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.5"/></svg>`}
function renderRigDiagram(p){const tokens=(p.rig||'').split('→').map(x=>x.trim()).filter(Boolean),items=tokens.map(rigMeta);$('rigDiagram').innerHTML=items.map((x,i)=>`<button type="button" class="rigStep ${i===0?'on':''}" data-i="${i}"><span class="rigIcon">${rigIcon(x.type)}</span><span class="rigLabel"><b>${x.token}</b><small>${x.label}</small></span><span class="rigOrder">${i+1}</span></button>`).join('');const setHelp=i=>{const x=items[i]||items[0];if(!x){$('rigHelp').innerHTML='<span>仕掛けデータなし</span>';return}$('rigHelp').innerHTML=`<strong>${x.token} · ${x.label}</strong><span>${x.role}</span>`;$('rigDiagram').querySelectorAll('.rigStep').forEach((b,j)=>b.classList.toggle('on',j===i))};$('rigDiagram').querySelectorAll('.rigStep').forEach(b=>b.onclick=()=>{setHelp(+b.dataset.i);track('rig_part_open',{fish:cur.name,method:p.method,part:items[+b.dataset.i]?.token})});setHelp(0);$('rig').innerHTML=tokens.map((x,i,a)=>`<span class="node">${x}</span>${i<a.length-1?'<span class="arr">→</span>':''}`).join('')}
function renderResult(){const p=basePlan();$('meta').textContent=(cur.water==='salt'?'SALT WATER':'FRESH WATER')+' / '+(p.style==='lure'?'LURE':'BAIT');$('rname').textContent=cur.name;$('sub').textContent=cur.tags.join(' ・ ');$('tart').innerHTML=speciesArt(cur);$('pmethod').textContent=p.method;$('why').textContent=p.why;$('difficultyBadge').textContent=cur.difficulty||'標準';$('planPlace').textContent=state.place==='おすすめ'?'推奨ポイント':state.place;$('planSeason').textContent=state.season;$('planTime').textContent=p.time||'時間帯は状況次第';choice('places',['おすすめ',...cur.places],'place');choice('seasons',['春','夏','秋','冬'],'season');choice('goals',['標準','大物狙い'],'goal');choice('winds',['弱い','普通','強い'],'wind');choice('tides',['動いている','止まり気味'],'tide');choice('waters',['澄み','普通','濁り'],'clarity');$('refineSummary').textContent=state.refined?`${state.wind} / ${state.tide} / ${state.clarity}`:'未入力';renderRotation(p);$('autoSeason').textContent=state.season;$('autoTime').textContent=currentDaypart();$('timeFit').textContent=timeFit(p);$('autoRange').textContent=currentRotation(p).range||p.range||'状況次第';$('autoAdvice').textContent=`${state.season}の基本：${cur.season[state.season]} 今の端末時刻は「${currentDaypart()}」。${timeFit(p)==='高い'?'魚種の基本時間帯と噛み合いやすい。':'時間帯だけで決めず、潮・ベイト・地形を優先。'} ${conditionAdvice(p)}${LIVE.weather?` 現在風 ${LIVE.weather.wind}m/s・突風 ${LIVE.weather.gust}m/sを反映済み。`:''}`;renderFieldLive();renderAutoAdjust(p);$('evidence').innerHTML=evidenceRows(p).map(([k,v])=>`<div class="evidenceRow"><div class="evidenceKey">${k}</div><div class="evidenceVal">${v}</div></div>`).join('');$('gear').innerHTML=[['ロッド',p.rod],['リール',p.reel],['ライン',p.line],['リーダー/ハリス',p.leader]].map(x=>`<div class="gearItem"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');renderRigDiagram(p);$('steps').innerHTML=(p.steps||[]).map((x,i)=>`<div class="step"><span class="num">${i+1}</span><span class="st">${x}</span></div>`).join('');$('seasonTip').innerHTML=`<b>${state.season}：</b>${cur.season[state.season]}`;$('mistakes').innerHTML=(cur.mistakes||['同じ条件に固執しない']).map(x=>`<li>${x}</li>`).join('');renderProducts(p)}
function renderProducts(p){
 const tackle=productsForPlan(p),field=fieldProductsForPlan(p);
 $('productsSection').style.display=(tackle.length||field.length)?'block':'none';$('productMethod').textContent=p.method;
 $('products').innerHTML=tackle.length?tackle.map((x,i)=>`<a class="product ${i===0?'bestProduct':''}" href="${x.url}" target="_blank" rel="noopener"><div><div class="pTop"><span class="brandChip">${x.brand}</span><span class="tierChip">${x.tier}</span><span class="brandChip">${x.type}</span><span class="rankChip">${x.rank}</span></div><strong>${x.name}</strong><p>${x.fit}</p><div class="productMeta">メーカー公式ページ確認済 · 2026-08-23</div></div><span class="arrow">›</span></a>`).join(''):'<div class="productEmpty">この釣法はまず規格を優先。特定のロッド/リールは未固定。</div>';
 $('fieldProducts').innerHTML=field.length?field.map((x,i)=>`<a class="product fieldProduct ${i===0?'bestProduct':''}" href="${x.url}" target="_blank" rel="noopener"><div><div class="pTop"><span class="brandChip">${x.brand}</span><span class="tierChip">${x.type}</span><span class="rankChip">${x.role}</span></div><strong>${x.name}</strong><p>${x.fit}</p><div class="fieldSpec">基準：${x.spec}</div><div class="productMeta">メーカー公式ページ確認済 · 2026-08-23</div></div><span class="arrow">›</span></a>`).join(''):'<div class="productEmpty">実在ルアー/仕掛けは順次検証中。現時点は上の規格・FIRST CASTを優先。</div>';
 $('productVerified').innerHTML=`<strong>${p.method}：</strong>本体 ${tackle.length}候補 / ルアー・仕掛け ${field.length}候補。価格・在庫・店頭販売状況はライブ取得していない。`;
 renderChecklist(p)
}
function savedData(){try{let a=JSON.parse(storeGet('fish_target_v9')||'null');if(Array.isArray(a))return a;const old=JSON.parse(storeGet('fish_target_v8')||storeGet('fish_target_v7')||storeGet('fish_target_v6')||storeGet('fish_target_v5')||'[]');if(Array.isArray(old)&&old.length){storeSet('fish_target_v9',JSON.stringify(old));return old}return []}catch{return[]}}
function renderSaved(){const a=savedData();$('savedList').innerHTML=a.length?'':'<div class="empty">まだ保存はないで。診断結果から保存できる。</div>';a.forEach((s,i)=>{const d=document.createElement('div');d.className='saveRow';d.innerHTML=`<button class="op"><strong>${s.fish}</strong><span>${s.place} ・ ${s.season} ・ ${s.goal}</span></button><button class="del" aria-label="削除">×</button>`;d.querySelector('.op').onclick=()=>{const f=F.find(x=>x.name===s.fish);if(f)openFish(f,s)};d.querySelector('.del').onclick=()=>{storeSet('fish_target_v9',JSON.stringify(savedData().filter((_,j)=>j!==i)));renderSaved();toast('削除した')};$('savedList').appendChild(d)})}

const renderRotationCore=renderRotation;
renderRotation=function(p){const out=renderRotationCore(p);const reset=$('autoReset');if(reset)reset.hidden=!state.rotationManual;return out};
if(!FEATURES.fieldLive){
  renderAutoAdjust=()=>{};
  renderFieldLive=()=>{};
  fetchWeather=async()=>{};
  searchSpot=async()=>{};
  const evidenceRowsCore=evidenceRows;
  evidenceRows=p=>evidenceRowsCore(p).filter(([key])=>key!=='FIELD LIVE');
}

if($('spotSearchBtn')){$('spotSearchBtn').onclick=searchSpot;$('spotQuery').addEventListener('keydown',e=>{if(e.key==='Enter')searchSpot()})}
if($('autoReset'))$('autoReset').onclick=()=>{if(!cur)return;restoreAutoRotation();renderResult();toast('FIRST CASTをAUTOに戻した')};
renderFieldLive();
renderFilters();
['ヒラメ','アジ','ブリ・ワラサ','アオリイカ','シーバス','マダイ'].forEach(n=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>openFish(F.find(f=>f.name===n));$('quick').appendChild(b)});
$('q').addEventListener('input',renderHome);$('clearSearch').onclick=()=>{$('q').value='';renderHome();$('q').focus()};$('back').onclick=()=>show(from);
$('save').onclick=()=>{if(!cur)return;let a=savedData(),x={fish:cur.name,...state};a=a.filter(y=>!(y.fish===x.fish&&y.place===x.place&&y.season===x.season&&y.goal===x.goal));a.unshift(x);storeSet('fish_target_v9',JSON.stringify(a.slice(0,20)));track('plan_save',{fish:cur.name});toast('プランを保存した')};
$('copy').onclick=async()=>{const p=basePlan(),r=currentRotation(p);const t=`【${cur.name}】\n釣法：${p.method}\n釣り場：${state.place}\n季節：${state.season}\n最初の1投：${r.name} / ${dynamicSize(r.size)} / ${dynamicColor(r.color,p)}\nレンジ：${r.range}\n操作：${r.action}\nロッド：${p.rod}\nリール：${p.reel}\nライン：${p.line}\nリーダー：${p.leader}\n仕掛け：${p.rig}\n条件補正：${conditionAdvice(p)}`;try{await navigator.clipboard.writeText(t);track('plan_copy',{fish:cur.name});toast('一覧をコピーした')}catch{toast('コピーできなかった')}};
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>show(b.dataset.v));
renderHome();

