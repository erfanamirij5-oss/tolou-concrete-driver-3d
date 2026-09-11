(() => {
  'use strict';

  const VERSION = 1;
  const MIXES = [
    { type:'بتن معمولی', baseTime:180, reward:1.00, difficulty:1 },
    { type:'بتن پمپی', baseTime:195, reward:1.12, difficulty:2 },
    { type:'بتن سازه‌ای', baseTime:188, reward:1.18, difficulty:2 },
    { type:'بتن کف صنعتی', baseTime:210, reward:1.24, difficulty:3 }
  ];
  const VOLUMES = [5,6,7,8,9];

  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
  const hash = (text) => {
    let h = 2166136261 >>> 0;
    for (let i=0;i<text.length;i+=1) { h ^= text.charCodeAt(i); h = Math.imul(h,16777619); }
    return h >>> 0;
  };
  const seeded = (seed) => {
    let x = seed >>> 0 || 1;
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  };

  function generate({destination, missionIndex=0, careerLevel=1, seed='tolou'}={}) {
    if (!destination || !destination.id) throw new Error('destination-required');
    const rnd = seeded(hash(`${VERSION}:${seed}:${missionIndex}:${destination.id}:${careerLevel}`));
    const mix = MIXES[Math.floor(rnd()*MIXES.length) % MIXES.length];
    const volume = VOLUMES[Math.floor(rnd()*VOLUMES.length) % VOLUMES.length];
    const levelPressure = clamp((Math.max(1,careerLevel)-1)*0.012,0,0.14);
    const distancePressure = clamp(Math.hypot(Number(destination.x)||0,Number(destination.z)||0)/420,0,0.20);
    const variance = (rnd()-.5)*0.10;
    const difficultyFactor = 1 + (mix.difficulty-1)*0.08 + levelPressure + distancePressure + variance;
    const timeLimit = Math.round(clamp(mix.baseTime / difficultyFactor,135,240));
    const rewardMultiplier = Number(clamp(mix.reward + (volume-5)*0.025 + levelPressure*0.9,1,1.55).toFixed(2));
    const difficulty = difficultyFactor < 1.12 ? 'NORMAL' : difficultyFactor < 1.25 ? 'HARD' : 'EXPERT';
    const id = `ord-v${VERSION}-${destination.id}-${missionIndex}-${hash(`${seed}:${missionIndex}:${destination.id}`)}`;
    return Object.freeze({
      version:VERSION,
      id,
      destinationId:destination.id,
      destinationName:destination.name,
      mixType:mix.type,
      volume,
      timeLimit,
      rewardMultiplier,
      difficulty,
      seed:String(seed),
      missionIndex:Math.max(0,Math.floor(missionIndex)),
      careerLevel:Math.max(1,Math.floor(careerLevel))
    });
  }

  function validate(order,destinationIds=[]) {
    if (!order || order.version!==VERSION) return {ok:false,reason:'unsupported-order-version'};
    if (!order.id || !order.destinationId || !MIXES.some(m=>m.type===order.mixType)) return {ok:false,reason:'invalid-order'};
    if (destinationIds.length && !destinationIds.includes(order.destinationId)) return {ok:false,reason:'unknown-destination'};
    if (!Number.isFinite(order.volume) || order.volume<1 || !Number.isFinite(order.timeLimit) || order.timeLimit<=0) return {ok:false,reason:'invalid-numbers'};
    return {ok:true};
  }

  const api = Object.freeze({ VERSION, MIXES:Object.freeze(MIXES.slice()), generate, validate });
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  if (typeof window!=='undefined') window.TolouOrderGenerator=api;
})();
