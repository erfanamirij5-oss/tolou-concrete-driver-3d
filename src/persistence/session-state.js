(() => {
  'use strict';

  const SAVE_VERSION = 1;
  const PHASES = new Set(['AT_DEPOT','LOADING','TO_SITE','DELIVERING','RETURNING']);

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, finite(value, min)));

  function createSnapshot(runtime) {
    return {
      saveVersion: SAVE_VERSION,
      gameVersion: runtime.gameVersion || '0.2.0',
      timestamp: new Date().toISOString(),
      player: { name: String(runtime.playerName || 'راننده طلوع').slice(0, 40) },
      truck: {
        position: { x: finite(runtime.truck.position.x), y: finite(runtime.truck.position.y), z: finite(runtime.truck.position.z) },
        rotation: { x: finite(runtime.truck.rotation.x), y: finite(runtime.truck.rotation.y), z: finite(runtime.truck.rotation.z) },
        speed: finite(runtime.state.speed),
        steeringAngle: finite(runtime.state.steer),
        health: clamp(runtime.state.health, 0, 100)
      },
      mission: {
        missionIndex: Math.max(0, Math.floor(finite(runtime.state.missionIndex))),
        missionId: runtime.state.mission?.id || null,
        phase: PHASES.has(runtime.state.phase) ? runtime.state.phase : 'AT_DEPOT',
        remainingTime: Math.max(0, finite(runtime.state.time)),
        actionProgress: Math.max(0, finite(runtime.state.actionHold)),
        score: Math.max(0, Math.floor(finite(runtime.state.score))),
        deliveries: Math.max(0, Math.floor(finite(runtime.state.deliveries))),
        collisions: Math.max(0, Math.floor(finite(runtime.state.collisions)))
      },
      concrete: {
        loaded: Boolean(runtime.state.loaded),
        mixType: runtime.state.mission?.type || null,
        loadedVolume: Math.max(0, finite(runtime.state.volume)),
        quality: clamp(runtime.state.quality, 0, 100),
        freshness: clamp(runtime.state.freshness ?? runtime.state.quality, 0, 100),
        slumpEstimate: Math.max(0, finite(runtime.state.slumpEstimate, 100)),
        elapsedDeliveryTime: Math.max(0, finite(runtime.state.elapsedDeliveryTime)),
        overspeedSeconds: Math.max(0, finite(runtime.state.overspeedSeconds))
      },
      settings: { cameraMode: Math.max(0, Math.floor(finite(runtime.state.cameraMode))) }
    };
  }

  function validate(snapshot, destinations) {
    if (!snapshot || snapshot.saveVersion !== SAVE_VERSION) return { ok:false, reason:'unsupported-save-version' };
    if (!snapshot.truck || !snapshot.mission || !snapshot.concrete) return { ok:false, reason:'missing-sections' };
    const missionIndex = Math.floor(finite(snapshot.mission.missionIndex, -1));
    const mission = destinations[missionIndex % destinations.length];
    if (missionIndex < 0 || !mission || mission.id !== snapshot.mission.missionId) return { ok:false, reason:'unknown-mission' };
    if (!PHASES.has(snapshot.mission.phase)) return { ok:false, reason:'invalid-phase' };
    const p = snapshot.truck.position || {};
    const r = snapshot.truck.rotation || {};
    if (![p.x,p.y,p.z,r.x,r.y,r.z].every(v => Number.isFinite(Number(v)))) return { ok:false, reason:'invalid-transform' };
    if (!Number.isFinite(Number(snapshot.concrete.quality))) return { ok:false, reason:'invalid-concrete-quality' };
    return { ok:true };
  }

  window.TolouSessionState = Object.freeze({ SAVE_VERSION, createSnapshot, validate });
})();
