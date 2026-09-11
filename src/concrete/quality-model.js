(() => {
  'use strict';

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(value))?Number(value):min));

  const PROFILES=Object.freeze({
    'بتن معمولی':{initialSlump:110,slumpLossPerMinute:0.42,timeDecayPerMinute:0.55,speedThreshold:62,speedPenaltyPerMinute:0.18},
    'بتن پمپی':{initialSlump:155,slumpLossPerMinute:0.34,timeDecayPerMinute:0.48,speedThreshold:58,speedPenaltyPerMinute:0.16},
    'بتن سازه‌ای':{initialSlump:95,slumpLossPerMinute:0.46,timeDecayPerMinute:0.58,speedThreshold:60,speedPenaltyPerMinute:0.19},
    'بتن کف صنعتی':{initialSlump:80,slumpLossPerMinute:0.50,timeDecayPerMinute:0.61,speedThreshold:55,speedPenaltyPerMinute:0.20},
    default:{initialSlump:100,slumpLossPerMinute:0.44,timeDecayPerMinute:0.56,speedThreshold:60,speedPenaltyPerMinute:0.18}
  });

  function profileFor(mixType){return PROFILES[mixType]||PROFILES.default;}

  function createState(mixType){
    const p=profileFor(mixType);
    return {elapsedDeliveryTime:0,freshness:100,slumpEstimate:p.initialSlump,quality:100,overspeedSeconds:0};
  }

  function step(current,{dt=0,speedKmh=0,mixType=null,loaded=false}={}){
    const p=profileFor(mixType);
    if(!loaded)return {...current};
    const seconds=Math.max(0,Number(dt)||0);
    const next={...current};
    next.elapsedDeliveryTime=Math.max(0,(Number(next.elapsedDeliveryTime)||0)+seconds);
    if(speedKmh>p.speedThreshold)next.overspeedSeconds=Math.max(0,(Number(next.overspeedSeconds)||0)+seconds);

    const minutes=next.elapsedDeliveryTime/60;
    const overspeedMinutes=(Number(next.overspeedSeconds)||0)/60;
    next.freshness=clamp(100-minutes*p.timeDecayPerMinute*1.65-overspeedMinutes*p.speedPenaltyPerMinute*2.2,0,100);
    next.slumpEstimate=clamp(p.initialSlump-minutes*p.slumpLossPerMinute-overspeedMinutes*p.speedPenaltyPerMinute*3.5,0,p.initialSlump);

    const slumpRatio=p.initialSlump>0?next.slumpEstimate/p.initialSlump:1;
    const slumpComponent=clamp(slumpRatio*100,0,100);
    next.quality=clamp(next.freshness*.72+slumpComponent*.28,0,100);
    return next;
  }

  function hydrate(saved,mixType){
    const base=createState(mixType);
    if(!saved||typeof saved!=='object')return base;
    return {
      elapsedDeliveryTime:Math.max(0,Number(saved.elapsedDeliveryTime)||0),
      freshness:clamp(saved.freshness??base.freshness,0,100),
      slumpEstimate:Math.max(0,Number(saved.slumpEstimate??base.slumpEstimate)||0),
      quality:clamp(saved.quality??base.quality,0,100),
      overspeedSeconds:Math.max(0,Number(saved.overspeedSeconds)||0)
    };
  }

  window.TolouConcreteQuality=Object.freeze({PROFILES,profileFor,createState,step,hydrate});
})();
