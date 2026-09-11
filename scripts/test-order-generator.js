'use strict';
const assert = require('assert');
const orders = require('../src/missions/order-generator.js');

const destination = { id:'tower', name:'برج سپید', x:82, z:177 };
const a = orders.generate({destination, missionIndex:4, careerLevel:3, seed:'profile-1'});
const b = orders.generate({destination, missionIndex:4, careerLevel:3, seed:'profile-1'});
assert.deepStrictEqual(a,b,'same inputs must generate identical contract');
assert.strictEqual(orders.validate(a,['tower']).ok,true);
assert.ok(a.volume>=5 && a.volume<=9);
assert.ok(a.timeLimit>=135 && a.timeLimit<=240);
assert.ok(a.rewardMultiplier>=1 && a.rewardMultiplier<=1.55);

const different = orders.generate({destination, missionIndex:5, careerLevel:3, seed:'profile-1'});
assert.notStrictEqual(different.id,a.id,'mission sequence must change order identity');

const high = orders.generate({destination, missionIndex:4, careerLevel:12, seed:'profile-1'});
assert.ok(high.rewardMultiplier>=a.rewardMultiplier,'career pressure should not reduce reward multiplier');

assert.strictEqual(orders.validate({...a,version:99},['tower']).ok,false);
assert.strictEqual(orders.validate({...a,destinationId:'missing'},['tower']).ok,false);
console.log('order-generator tests passed');
