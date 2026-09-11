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

  const adapter = window.tolouDesktop ? new ElectronPersistenceAdapter() : new BrowserPersistenceAdapter();

  window.TolouPersistence = Object.freeze({
    backend: window.tolouDesktop ? 'electron' : 'browser',
    save: (payload) => adapter.save(payload),
    load: (slot) => adapter.load(slot),
    list: () => adapter.list(),
    remove: (slot) => adapter.remove(slot),
    create: () => adapter
  });
})();
