(() => {
  'use strict';

  const PREFIX = 'tolou-save:';

  class BrowserPersistenceAdapter {
    async save(slot, data) {
      localStorage.setItem(`${PREFIX}${slot}`, JSON.stringify(data));
      return { ok: true, slot, backend: 'localStorage' };
    }

    async load(slot) {
      const raw = localStorage.getItem(`${PREFIX}${slot}`);
      if (!raw) return { ok: false, slot, reason: 'not-found' };
      try {
        return { ok: true, slot, source: 'primary', data: JSON.parse(raw), backend: 'localStorage' };
      } catch {
        return { ok: false, slot, reason: 'corrupt', backend: 'localStorage' };
      }
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
    async save(slot, data) {
      return window.tolouDesktop.save({ slot, data });
    }

    async load(slot) {
      return window.tolouDesktop.load(slot);
    }

    async list() {
      return window.tolouDesktop.listSaves();
    }

    async remove(slot) {
      return window.tolouDesktop.deleteSave(slot);
    }
  }

  window.TolouPersistence = Object.freeze({
    backend: window.tolouDesktop ? 'electron' : 'browser',
    create() {
      return window.tolouDesktop ? new ElectronPersistenceAdapter() : new BrowserPersistenceAdapter();
    }
  });
})();
