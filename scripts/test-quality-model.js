'use strict';

const assert=require('node:assert/strict');
global.window={};
require('../src/concrete/quality-model.js');

const q=window.TolouConcreteQuality;
assert.ok(q,'quality model should be exposed');

const fresh=q.createState('بتن پمپی');
assert.equal(fresh.quality,100);
assert.equal(fresh.freshness,100);
assert.ok(fresh.slumpEstimate>100);

const afterMinute=q.step(fresh,{dt:60,speedKmh:40,mixType:'بتن پمپی',loaded:true});
assert.ok(afterMinute.quality<100,'quality should decay while loaded');
assert.ok(afterMinute.freshness<100,'freshness should decay while loaded');
assert.ok(afterMinute.slumpEstimate<fresh.slumpEstimate,'slump estimate should decline');

const normal=q.step(fresh,{dt:120,speedKmh:40,mixType:'بتن معمولی',loaded:true});
const fast=q.step(fresh,{dt:120,speedKmh:80,mixType:'بتن معمولی',loaded:true});
assert.ok(fast.quality<normal.quality,'overspeed should increase quality loss');
assert.ok(fast.overspeedSeconds>0,'overspeed duration should be tracked');

const paused=q.step(fresh,{dt:300,speedKmh:0,mixType:'بتن معمولی',loaded:false});
assert.deepEqual(paused,fresh,'unloaded/offline-equivalent state must not decay');

const oldSave=q.hydrate({quality:84},'بتن معمولی');
assert.equal(oldSave.quality,84,'old saves with only quality should remain compatible');
assert.equal(oldSave.elapsedDeliveryTime,0);

console.log('Concrete quality model tests passed.');
