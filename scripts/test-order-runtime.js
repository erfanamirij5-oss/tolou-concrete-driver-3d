'use strict';

const assert = require('node:assert/strict');
const orders = require('../src/missions/order-generator.js');
const runtime = require('../src/missions/order-runtime.js');

const destination = { id:'homes', name:'مجتمع آفتاب', x:-88, z:126, r:18, type:'بتن معمولی', volume:6, time:180 };
const order = orders.generate({ destination, missionIndex:3, careerLevel:4, seed:'runtime-test' });
const mission = runtime.composeMission(destination, order);

assert.equal(mission.id, destination.id);
assert.equal(mission.type, order.mixType);
assert.equal(mission.volume, order.volume);
assert.equal(mission.time, order.timeLimit);
assert.equal(mission.order.id, order.id);

const saved = runtime.serialize(order);
const restored = runtime.restore(destination, saved, orders);
assert.ok(restored);
assert.equal(restored.order.id, order.id);
assert.equal(restored.type, order.mixType);
assert.equal(restored.volume, order.volume);
assert.equal(restored.time, order.timeLimit);

const bad = { ...saved, destinationId:'tower' };
assert.equal(runtime.restore(destination, bad, orders), null);
assert.equal(runtime.deliveryScore({ baseScore:1000, rewardMultiplier:1.25 }), 1250);

console.log('order runtime tests passed');
