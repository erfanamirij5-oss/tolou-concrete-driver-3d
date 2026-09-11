(() => {
  'use strict';

  const PREFIX = 'tolou-save:';

  class BrowserPersistenceAdapter {
    async save(payload) {
      const { slot, state } = payload || {};
      if (!slot || !state) throw new Error('Invalid save payload');
      localStorage.setItem(`${PREFIX}${slot}`, JSON.stringify(state));
      return { ok: true, slot, backend: 'localStorage' };
    }

    async load(slot) {
      const raw = localStorage.getItem(`${PREFIX}${slot}`);
      if (!raw) return null;
      try { return { slot, state: JSON.parse(raw), source: 'primary', backend: 'localStorage' }; }
      catch { return null; }
    }

    async list() {
      const slots = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) slots.push({ slot: key.slice(PREFIX.length) });
      }
      return slots;
    }

    async remove(slot) {
      localStorage.removeItem(`${PREFIX}${slot}`);
      return { ok: true, slot, backend: 'localStorage' };
    }
  }

  class ElectronPersistenceAdapter {
    async save(payload) {
      const { slot, state } = payload || {};
      if (!slot || !state) throw new Error('Invalid save payload');
      return window.tolouDesktop.save({ slot, data: state });
    }

    async load(slot) {
      const result = await window.tolouDesktop.load(slot);
      if (!result || result.ok === false) return null;
      return { slot, state: result.data ?? result.state ?? result, source: result.source || 'primary', backend: 'electron' };
    }

    async list() { return window.tolouDesktop.listSaves(); }
    async remove(slot) { return window.tolouDesktop.deleteSave(slot); }
  }

  class SerializedPersistence {
    constructor(adapter) {
      this.adapter = adapter;
      this.queues = new Map();
    }

    enqueue(slot, task) {
      if (!slot) return Promise.reject(new Error('slot-required'));
      const previous = this.queues.get(slot) || Promise.resolve();
      const next = previous.catch(() => {}).then(task);
      const tracked = next.finally(() => {
        if (this.queues.get(slot) === tracked) this.queues.delete(slot);
      });
      this.queues.set(slot, tracked);
      return tracked;
    }

    async waitFor(slot) {
      const pending = this.queues.get(slot);
      if (pending) await pending.catch(() => {});
    }

    save(payload) {
      const slot = payload?.slot;
      return this.enqueue(slot, () => this.adapter.save(payload));
    }

    async load(slot) {
      await this.waitFor(slot);
      return this.adapter.load(slot);
    }

    async list() {
      await Promise.all([...this.queues.values()].map(p => p.catch(() => {})));
      return this.adapter.list();
    }

    remove(slot) {
      return this.enqueue(slot, () => this.adapter.remove(slot));
    }
  }

  const adapter = window.tolouDesktop ? new ElectronPersistenceAdapter() : new BrowserPersistenceAdapter();
  const persistence = new SerializedPersistence(adapter);

  window.TolouPersistence = Object.freeze({
    backend: window.tolouDesktop ? 'electron' : 'browser',
    save: (payload) => persistence.save(payload),
    load: (slot) => persistence.load(slot),
    list: () => persistence.list(),
    remove: (slot) => persistence.remove(slot),
    create: () => new SerializedPersistence(window.tolouDesktop ? new ElectronPersistenceAdapter() : new BrowserPersistenceAdapter())
  });
})();
