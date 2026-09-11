(() => {
  'use strict';

  const persistence = window.TolouPersistence;
  const AUTOSAVE_SLOT = 'autosave';
  const RESULT_SLOT = 'last-session-result';
  const startButton = document.getElementById('startBtn');
  const restartButton = document.getElementById('restartBtn');
  const resultDialog = document.getElementById('resultDialog');
  const resultScore = document.getElementById('resultScore');
  const resultText = document.getElementById('resultText');
  if (!persistence) return;

  let bypassNextStart = false;
  let resultRecordedForOpen = false;

  async function hasRecoverableAutosave() {
    try {
      const loaded = await persistence.load(AUTOSAVE_SLOT);
      return Boolean(loaded?.state || loaded);
    } catch (_err) {
      return false;
    }
  }

  async function guardNewGame(event) {
    if (bypassNextStart) {
      bypassNextStart = false;
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();

    const hasSave = await hasRecoverableAutosave();
    if (hasSave) {
      const accepted = window.confirm('یک بازی ذخیره‌شده فعال وجود دارد. شروع بازی جدید، Autosave فعلی را جایگزین می‌کند. ادامه می‌دهی؟');
      if (!accepted) return;
    }

    bypassNextStart = true;
    event.currentTarget.click();
  }

  startButton?.addEventListener('click', guardNewGame, true);
  restartButton?.addEventListener('click', guardNewGame, true);

  async function recordTerminalResult() {
    if (!resultDialog?.open || resultRecordedForOpen) return;
    resultRecordedForOpen = true;
    try {
      await persistence.save({
        slot: RESULT_SLOT,
        state: {
          version: 1,
          timestamp: new Date().toISOString(),
          scoreText: String(resultScore?.textContent || '0'),
          summary: String(resultText?.textContent || ''),
          autosavePolicy: 'preserve-last-recoverable-checkpoint'
        }
      });
    } catch (err) {
      console.error('Terminal result save failed', err);
    }
  }

  if (resultDialog) {
    const observer = new MutationObserver(() => {
      if (resultDialog.open) recordTerminalResult();
      else resultRecordedForOpen = false;
    });
    observer.observe(resultDialog, { attributes: true, attributeFilter: ['open'] });
  }

  window.TolouSessionLifecycle = Object.freeze({
    AUTOSAVE_SLOT,
    RESULT_SLOT,
    policy: 'preserve-last-recoverable-checkpoint'
  });
})();
