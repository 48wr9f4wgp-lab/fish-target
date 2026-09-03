(()=>{
  const POWER=Object.freeze(['UL','L','ML','M','MH','H','XH','XXH','XXXH']);
  const finite=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
  const text=value=>String(value??'').trim();
  const nums=value=>(text(value).match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  const numericRange=(value,{min=Number.NEGATIVE_INFINITY,max=Number.POSITIVE_INFINITY}={})=>{
    const found=nums(value).filter(v=>v>=min&&v<=max);
    return found.length?Object.freeze({min:found[0],max:found[1]??found[0]}):null;
  };
  const powerRange=value=>{
    const source=text(value).toUpperCase();
    const tail=source.includes('/')?source.split('/').slice(1).join('/'):source;
    const safeTail=tail.replace(/\d+(?:\.\d+)?\s*(?:(?:〜|～|~|-)\s*\d+(?:\.\d+)?\s*)?M(?:級|前後)?/g,' ');
    const hits=POWER.filter(power=>new RegExp(`(^|[^A-Z])${power}([^A-Z]|$)`).test(safeTail));
    if(!hits.length)return null;
    const ranks=hits.map(power=>POWER.indexOf(power));
    return Object.freeze({min:Math.min(...ranks),max:Math.max(...ranks)});
  };
  const reelRange=value=>numericRange(value,{min:500,max:30000});
  const gRange=value=>{
    const source=text(value);
    const match=source.match(/(\d+(?:\.\d+)?)\s*(?:〜|～|~|-)\s*(\d+(?:\.\d+)?)\s*g\b/i)||source.match(/(\d+(?:\.\d+)?)\s*g\b/i);
    if(!match)return null;
    const a=Number(match[1]),b=Number(match[2]??match[1]);
    return Number.isFinite(a)&&Number.isFinite(b)?Object.freeze({min:Math.min(a,b),max:Math.max(a,b)}):null;
  };
  const ftRange=value=>{
    const source=text(value);
    const match=source.match(/(\d+(?:\.\d+)?)\s*(?:〜|～|~|-)\s*(\d+(?:\.\d+)?)\s*ft\b/i)||source.match(/(\d+(?:\.\d+)?)\s*ft\b/i);
    if(!match)return null;
    const a=Number(match[1]),b=Number(match[2]??match[1]);
    return Number.isFinite(a)&&Number.isFinite(b)?Object.freeze({min:Math.min(a,b),max:Math.max(a,b)}):null;
  };
  const center=range=>range?(range.min+range.max)/2:null;
  const direction=(value,range,tolerance=0)=>{
    const n=finite(value);if(n===null||!range)return 0;
    if(n<range.min-tolerance)return -1;
    if(n>range.max+tolerance)return 1;
    return 0;
  };
  const magnitude=(value,range,step=1)=>{
    const n=finite(value);if(n===null||!range)return 0;
    const c=center(range),raw=Math.abs(n-c)/Math.max(step,0.0001);
    return raw<0.75?0:raw<1.75?1:2;
  };
  const pairFit=(rod,reel,idealSet)=>{
    if(!rod||!reel)return Object.freeze({level:2,code:'pair-missing-component',rodDirection:0,reelDirection:0});
    const rodRange=idealSet?.rod?.power_range||null;
    const reelTarget=idealSet?.reel?.size_range||null;
    const rodRank=rod?.power&&POWER.includes(String(rod.power).toUpperCase())?POWER.indexOf(String(rod.power).toUpperCase()):null;
    const rodDirection=direction(rodRank,rodRange,0);
    const reelDirection=direction(reel?.size,reelTarget,0);
    const rodMagnitude=magnitude(rodRank,rodRange,1);
    const reelMagnitude=magnitude(reel?.size,reelTarget,1000);
    if(rodDirection&&reelDirection&&rodDirection!==reelDirection){
      const severe=rodMagnitude>=2||reelMagnitude>=2;
      return Object.freeze({level:severe?2:1,code:severe?'pair-opposed-major':'pair-opposed-light',rodDirection,reelDirection});
    }
    return Object.freeze({level:0,code:(rodRange&&reelTarget)?'pair-balanced-to-target':'pair-data-unavailable',rodDirection,reelDirection});
  };
  const scoreCombination=(rodLevel,reelLevel,pairLevel)=>Math.max(rodLevel,reelLevel,pairLevel)*100+(rodLevel+reelLevel)*20+pairLevel*40;
  const directionLabel=value=>value<0?'underspec':value>0?'overspec':'balanced';
  globalThis.FISH_TARGET_TACKLE_SET_RULES=Object.freeze({
    version:'TACKLE-SET-RULES-V31',POWER,finite,text,numericRange,powerRange,reelRange,gRange,ftRange,direction,magnitude,pairFit,scoreCombination,directionLabel
  });
})();