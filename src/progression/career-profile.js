(() => {
  'use strict';

  const PROFILE_VERSION = 1;
  const clamp = (v,min,max) => Math.min(max,Math.max(min,Number.isFinite(Number(v))?Number(v):min));
  const integer = (v,min=0) => Math.max(min,Math.floor(Number.isFinite(Number(v))?Number(v):min));

  const ranks = [
    {level:1,id:'rookie',label:'راننده تازه‌کار'},
    {level:2,id:'operator',label:'اپراتور مطمئن'},
    {level:3,id:'professional',label:'راننده حرفه‌ای'},
    {level:5,id:'master',label:'استاد حمل بتن'},
    {level:8,id:'elite',label:'راننده ممتاز طلوع'}
  ];

  function xpForLevel(level){ const n=Math.max(1,integer(level,1)); return 500*(n-1)*(n-1); }
  function levelFromXp(xp){ return Math.max(1,Math.floor(Math.sqrt(integer(xp)/500))+1); }
  function rankForLevel(level){ let current=ranks[0]; for(const rank of ranks){ if(level>=rank.level)current=rank; } return current; }
  function createProfile(seed={}){
    const xp=integer(seed.xp);
    const level=levelFromXp(xp);
    return {
      profileVersion:PROFILE_VERSION,
      xp,
      level,
      credits:integer(seed.credits),
      completedDeliveries:integer(seed.completedDeliveries),
      totalScoreEarned:integer(seed.totalScoreEarned),
      bestDeliveryScore:integer(seed.bestDeliveryScore),
      bestQuality:clamp(seed.bestQuality??0,0,100),
      bestHealth:clamp(seed.bestHealth??0,0,100),
      rank:rankForLevel(level).id,
      rankLabel:rankForLevel(level).label,
      updatedAt:seed.updatedAt||null
    };
  }
  function hydrate(raw){ return createProfile(raw&&raw.profileVersion===PROFILE_VERSION?raw:{}); }
  function awardDelivery(profile,input={}){
    const before=hydrate(profile);
    const scoreGain=integer(input.scoreGain);
    const quality=clamp(input.quality??0,0,100);
    const health=clamp(input.health??0,0,100);
    const timeSeconds=integer(input.remainingTime);
    const xpGain=100+Math.round(quality)+Math.round(health*.5)+Math.round(Math.min(timeSeconds,240)*.35)+Math.round(scoreGain*.05);
    const creditsGain=Math.max(50,Math.round(scoreGain*.2));
    const xp=before.xp+xpGain;
    const level=levelFromXp(xp);
    const rank=rankForLevel(level);
    const next={
      ...before,
      xp,
      level,
      credits:before.credits+creditsGain,
      completedDeliveries:before.completedDeliveries+1,
      totalScoreEarned:before.totalScoreEarned+scoreGain,
      bestDeliveryScore:Math.max(before.bestDeliveryScore,scoreGain),
      bestQuality:Math.max(before.bestQuality,quality),
      bestHealth:Math.max(before.bestHealth,health),
      rank:rank.id,
      rankLabel:rank.label,
      updatedAt:new Date().toISOString()
    };
    return {profile:next,xpGain,creditsGain,leveledUp:level>before.level,previousLevel:before.level,level};
  }

  const api=Object.freeze({PROFILE_VERSION,ranks,xpForLevel,levelFromXp,rankForLevel,createProfile,hydrate,awardDelivery});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.TolouCareerProfile=api;
})();
