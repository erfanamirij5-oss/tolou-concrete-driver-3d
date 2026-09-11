(() => {
  'use strict';

  const VERSION = 1;

  function composeMission(destination, order) {
    if (!destination || !order) throw new Error('destination-and-order-required');
    if (String(destination.id) !== String(order.destinationId)) throw new Error('order-destination-mismatch');
    return Object.freeze({
      ...destination,
      type: order.mixType,
      volume: order.volume,
      time: order.timeLimit,
      order: Object.freeze({ ...order })
    });
  }

  function serialize(order) {
    if (!order) return null;
    return {
      version: order.version,
      id: order.id,
      destinationId: order.destinationId,
      destinationName: order.destinationName,
      mixType: order.mixType,
      volume: order.volume,
      timeLimit: order.timeLimit,
      rewardMultiplier: order.rewardMultiplier,
      difficulty: order.difficulty,
      seed: order.seed,
      missionIndex: order.missionIndex,
      careerLevel: order.careerLevel
    };
  }

  function restore(destination, savedOrder, orderGenerator) {
    if (!savedOrder || !orderGenerator) return null;
    const check = orderGenerator.validate(savedOrder, [destination?.id].filter(Boolean));
    if (!check.ok) return null;
    return composeMission(destination, Object.freeze({ ...savedOrder }));
  }

  function deliveryScore({ baseScore, rewardMultiplier }) {
    const base = Math.max(0, Number(baseScore) || 0);
    const multiplier = Math.max(1, Number(rewardMultiplier) || 1);
    return Math.round(base * multiplier);
  }

  const api = Object.freeze({ VERSION, composeMission, serialize, restore, deliveryScore });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TolouOrderRuntime = api;
})();
