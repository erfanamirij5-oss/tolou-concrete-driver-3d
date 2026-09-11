'use strict';

const assert = require('assert');

const calls = [];
const storage = new Map();

global.window = {
  tolouDesktop: {
    async save({ slot, data }) {
      const delay = data.seq === 1 ? 30 : 0;
      await new Promise(resolve => setTimeout(resolve, delay));
      calls.push(`save:${slot}:${data.seq}`);
      storage.set(slot, data);
      return { ok:true };
    },
    async load(slot) {
      calls.push(`load:${slot}`);
      return storage.has(slot) ? { ok:true, data:storage.get(slot) } : null;
    },
    async listSaves() { return [...storage.keys()].map(slot => ({ slot })); },
    async deleteSave(slot) { calls.push(`remove:${slot}`); storage.delete(slot); return { ok:true }; }
  }
};

require('../src/platform/persistence.js');

(async () => {
  const persistence = window.TolouPersistence;
  assert.ok(persistence, 'persistence API should be exposed');

  const first = persistence.save({ slot:'autosave', state:{ seq:1 } });
  const second = persistence.save({ slot:'autosave', state:{ seq:2 } });
  await Promise.all([first, second]);

  assert.deepStrictEqual(
    calls.slice(0,2),
    ['save:autosave:1','save:autosave:2'],
    'same-slot saves must preserve request order'
  );

  const third = persistence.save({ slot:'autosave', state:{ seq:3 } });
  const loadedPromise = persistence.load('autosave');
  await third;
  const loaded = await loadedPromise;
  assert.strictEqual(loaded.state.seq, 3, 'load must wait for pending save in same slot');

  const fourth = persistence.save({ slot:'autosave', state:{ seq:4 } });
  const remove = persistence.remove('autosave');
  await Promise.all([fourth, remove]);
  const afterRemove = await persistence.load('autosave');
  assert.strictEqual(afterRemove, null, 'remove must run after pending save for same slot');

  console.log('persistence hardening tests passed');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
