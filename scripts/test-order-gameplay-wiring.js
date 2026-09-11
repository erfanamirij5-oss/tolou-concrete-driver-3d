'use strict';

const assert = require('assert');
const fs = require('fs');

const game = fs.readFileSync('src/game.js','utf8');
const session = fs.readFileSync('src/persistence/session-state.js','utf8');

assert.ok(game.includes('TolouOrderGenerator'), 'game must consume Orders Engine');
assert.ok(game.includes('TolouOrderRuntime'), 'game must consume Order Runtime adapter');
assert.ok(game.includes('orderGenerator.generate({destination,missionIndex:state.missionIndex'), 'mission selection must generate an order contract');
assert.ok(game.includes('orderRuntime.composeMission(destination,order)'), 'generated order must compose the runtime mission');
assert.ok(game.includes('orderRuntime.restore(destination,savedOrder,orderGenerator)'), 'saved order must restore through runtime adapter');
assert.ok(game.includes('state.missionIndex+=1'), 'mission index must advance without wrapping so order variety can continue');
assert.ok(game.includes('orderRuntime.deliveryScore({baseScore,rewardMultiplier:state.mission.order?.rewardMultiplier})'), 'delivery scoring must apply order reward multiplier');
assert.ok(game.includes('getOrder:()=>state.mission?.order'), 'runtime telemetry must expose the active order read-only');
assert.ok(session.includes("order: runtime.state.mission?.order ? { ...runtime.state.mission.order } : null"), 'save snapshot must persist active order contract');
assert.ok(session.includes("reason:'order-destination-mismatch'"), 'save validation must reject mismatched order destination');

console.log('order gameplay wiring checks passed');
