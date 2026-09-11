const assert=require('node:assert/strict');
const career=require('../src/progression/career-profile.js');

const fresh=career.createProfile();
assert.equal(fresh.level,1);
assert.equal(fresh.xp,0);
assert.equal(fresh.credits,0);

const award=career.awardDelivery(fresh,{scoreGain:1500,quality:92,health:96,remainingTime:80});
assert.ok(award.xpGain>0);
assert.ok(award.creditsGain>=50);
assert.equal(award.profile.completedDeliveries,1);
assert.equal(award.profile.bestDeliveryScore,1500);
assert.equal(award.profile.bestQuality,92);
assert.equal(award.profile.bestHealth,96);

const restored=career.hydrate({...award.profile,level:999,rank:'bad'});
assert.equal(restored.level,career.levelFromXp(restored.xp));
assert.notEqual(restored.rank,'bad');

assert.equal(career.levelFromXp(0),1);
assert.equal(career.levelFromXp(500),2);
assert.equal(career.levelFromXp(2000),3);
console.log('progression tests passed');
