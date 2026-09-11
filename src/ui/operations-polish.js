(() => {
  'use strict';

  const hud = document.getElementById('hud');
  const stageEl = document.getElementById('missionStage');
  const titleEl = document.getElementById('missionTitle');
  const progressEl = document.getElementById('missionProgress');
  if (!hud || !stageEl || !titleEl || !progressEl || !window.BABYLON) return;

  const panel = document.createElement('aside');
  panel.className = 'operation-panel hidden';
  panel.innerHTML = '<span id="operationLabel">عملیات</span><strong id="operationValue">0%</strong><small id="operationHint">در حال آماده‌سازی…</small>';
  hud.appendChild(panel);

  const labelEl = panel.querySelector('#operationLabel');
  const valueEl = panel.querySelector('#operationValue');
  const hintEl = panel.querySelector('#operationHint');

  let scene = null;
  let truck = null;
  let loadingFlow = null;
  let deliveryFlow = null;
  let deliveryChute = null;
  let created = false;

  function makeMaterial(name, color, alpha = 1) {
    const m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = color;
    m.emissiveColor = color.scale(0.12);
    m.specularColor = BABYLON.Color3.Black();
    m.alpha = alpha;
    return m;
  }

  function ensureSceneObjects() {
    if (created) return true;
    scene = BABYLON.EngineStore.LastCreatedScene;
    if (!scene) return false;
    truck = scene.getTransformNodeByName('truck');
    if (!truck) return false;

    const concreteMat = makeMaterial('operationConcreteMat', new BABYLON.Color3(0.43, 0.45, 0.42), 0.94);
    const chuteMat = makeMaterial('operationChuteMat', new BABYLON.Color3(0.76, 0.78, 0.74), 1);

    loadingFlow = BABYLON.MeshBuilder.CreateCylinder('loadingConcreteFlow', { diameter: 0.48, height: 5.8, tessellation: 14 }, scene);
    loadingFlow.position.set(-147, 4.2, -184);
    loadingFlow.material = concreteMat;
    loadingFlow.setEnabled(false);

    deliveryChute = BABYLON.MeshBuilder.CreateBox('deliveryChute', { width: 0.7, height: 0.28, depth: 3.1 }, scene);
    deliveryChute.parent = truck;
    deliveryChute.position.set(0, 1.22, -3.65);
    deliveryChute.rotation.x = -0.34;
    deliveryChute.material = chuteMat;
    deliveryChute.setEnabled(false);

    deliveryFlow = BABYLON.MeshBuilder.CreateCylinder('deliveryConcreteFlow', { diameter: 0.42, height: 1.7, tessellation: 14 }, scene);
    deliveryFlow.parent = truck;
    deliveryFlow.position.set(0, 0.32, -4.9);
    deliveryFlow.rotation.x = -0.28;
    deliveryFlow.material = concreteMat;
    deliveryFlow.setEnabled(false);

    created = true;
    return true;
  }

  function currentOperation() {
    const stage = stageEl.textContent || '';
    const title = titleEl.textContent || '';
    if (stage.includes('در حال بارگیری') || title.includes('بچینگ در حال بارگیری')) return 'loading';
    if (stage.includes('مرحله ۳') || title.includes('تخلیه بتن')) return 'delivery';
    return 'none';
  }

  function progressPercent() {
    const inlineWidth = progressEl.style.width || '0%';
    const n = Number.parseFloat(inlineWidth);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  }

  function setVisualState(op, progress, time) {
    panel.classList.toggle('hidden', op === 'none');
    if (!created) return;

    const pulse = 0.9 + Math.sin(time / 120) * 0.08;
    loadingFlow.setEnabled(op === 'loading');
    deliveryFlow.setEnabled(op === 'delivery');
    deliveryChute.setEnabled(op === 'delivery');

    if (op === 'loading') {
      labelEl.textContent = 'بارگیری بتن';
      valueEl.textContent = `${Math.round(progress)}%`;
      hintEl.textContent = progress < 100 ? 'بتن در حال ورود به دیگ است' : 'بارگیری کامل شد';
      loadingFlow.scaling.x = pulse;
      loadingFlow.scaling.z = pulse;
      loadingFlow.scaling.y = 0.8 + progress / 500;
    } else if (op === 'delivery') {
      labelEl.textContent = 'تخلیه بتن';
      valueEl.textContent = `${Math.round(progress)}%`;
      hintEl.textContent = progress < 100 ? 'شوت باز است؛ تخلیه ادامه دارد' : 'تخلیه تکمیل شد';
      deliveryFlow.scaling.x = pulse;
      deliveryFlow.scaling.z = pulse;
      deliveryFlow.scaling.y = 0.72 + progress / 420;
      deliveryChute.rotation.x = -0.34 - Math.sin(time / 280) * 0.015;
    }
  }

  function operationActive() {
    return currentOperation() !== 'none';
  }

  window.addEventListener('keydown', (event) => {
    if (!operationActive()) return;
    if (['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  function frame(time) {
    ensureSceneObjects();
    const op = currentOperation();
    setVisualState(op, progressPercent(), time);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
