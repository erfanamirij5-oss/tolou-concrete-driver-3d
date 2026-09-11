'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const MAX_SAVE_BYTES = 2 * 1024 * 1024;
const SLOT_RE = /^[a-z0-9][a-z0-9-_]{0,31}$/i;

function assertSlot(slot) {
  if (typeof slot !== 'string' || !SLOT_RE.test(slot)) {
    throw new Error('Invalid save slot name');
  }
  return slot;
}

function assertPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Save payload must be an object');
  }
  const slot = assertSlot(payload.slot);
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    throw new Error('Save data must be an object');
  }
  const serialized = JSON.stringify(payload.data, null, 2);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_SAVE_BYTES) {
    throw new Error('Save payload exceeds size limit');
  }
  return { slot, serialized };
}

function savePaths(userDataPath, slot) {
  const dir = path.join(userDataPath, 'saves');
  return {
    dir,
    primary: path.join(dir, `${slot}.json`),
    backup: path.join(dir, `${slot}.backup.json`),
    temp: path.join(dir, `${slot}.${process.pid}.${Date.now()}.tmp`)
  };
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function saveSlot(userDataPath, payload) {
  const { slot, serialized } = assertPayload(payload);
  const p = savePaths(userDataPath, slot);
  await fs.mkdir(p.dir, { recursive: true });

  await fs.writeFile(p.temp, serialized, { encoding: 'utf8', flag: 'wx' });

  try {
    if (await exists(p.primary)) {
      await fs.rm(p.backup, { force: true });
      await fs.rename(p.primary, p.backup);
    }
    await fs.rename(p.temp, p.primary);
  } catch (error) {
    await fs.rm(p.temp, { force: true }).catch(() => {});
    if (!(await exists(p.primary)) && await exists(p.backup)) {
      await fs.rename(p.backup, p.primary).catch(() => {});
    }
    throw error;
  }

  return { ok: true, slot, savedAt: new Date().toISOString() };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  if (Buffer.byteLength(raw, 'utf8') > MAX_SAVE_BYTES) throw new Error('Save file exceeds size limit');
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid save root');
  return data;
}

async function loadSlot(userDataPath, slotInput) {
  const slot = assertSlot(slotInput);
  const p = savePaths(userDataPath, slot);

  try {
    const data = await readJson(p.primary);
    return { ok: true, slot, source: 'primary', data };
  } catch (primaryError) {
    try {
      const data = await readJson(p.backup);
      return { ok: true, slot, source: 'backup', recovered: true, data };
    } catch {
      if (!(await exists(p.primary)) && !(await exists(p.backup))) {
        return { ok: false, slot, reason: 'not-found' };
      }
      return { ok: false, slot, reason: 'corrupt', message: primaryError.message };
    }
  }
}

async function listSlots(userDataPath) {
  const dir = path.join(userDataPath, 'saves');
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const slots = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name.endsWith('.backup.json')) continue;
      const slot = entry.name.slice(0, -5);
      if (!SLOT_RE.test(slot)) continue;
      const stat = await fs.stat(path.join(dir, entry.name));
      slots.push({ slot, modifiedAt: stat.mtime.toISOString(), size: stat.size });
    }
    return slots.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
}

async function deleteSlot(userDataPath, slotInput) {
  const slot = assertSlot(slotInput);
  const p = savePaths(userDataPath, slot);
  await Promise.all([
    fs.rm(p.primary, { force: true }),
    fs.rm(p.backup, { force: true })
  ]);
  return { ok: true, slot };
}

module.exports = {
  saveSlot,
  loadSlot,
  listSlots,
  deleteSlot
};
