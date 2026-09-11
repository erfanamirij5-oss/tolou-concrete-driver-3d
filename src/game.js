(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ui = {
    canvas: $('renderCanvas'), loading: $('loading'), menu: $('menu'), hud: $('hud'),
    start: $('startBtn'), restart: $('restartBtn'), playerName: $('playerName'),
    timer: $('timer'), quality: $('quality'), health: $('health'), score: $('score'), speed: $('speed'),
    stage: $('missionStage'), title: $('missionTitle'), text: $('missionText'), progress: $('missionProgress'),
    actionBox: $('actionBox'), actionBtn: $('actionBtn'), actionHint: $('actionHint'),
    dispatcher: $('dispatcher'), dispatcherText: $('dispatcherText'),
    result: $('resultDialog'), resultScore: $('resultScore'), resultText: $('resultText')
  };

  if (!window.BABYLON || !BABYLON.Engine.isSupported()) {
    ui.loading.textContent = 'WebGL/Babylon.js در این مرورگر قابل اجرا نیست.';
    return;
  }

  const engine = new BABYLON.Engine(ui.canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.72, 0.86, 0.92, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogStart = 150;
  scene.fogEnd = 420;
  scene.fogColor = new BABYLON.Color3(0.72, 0.86, 0.92);

  const camera = new BABYLON.FreeCamera('followCam', new BABYLON.Vector3(0, 9, -14), scene);
  camera.minZ = 0.1;
  camera.fov = 0.88;
  camera.inputs.clear();

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.25, 1, 0.15), scene);
  hemi.intensity = 0.95;
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, 0.3), scene);
  sun.position = new BABYLON.Vector3(80, 140, -80);
  sun.intensity = 0.6;

  const C = {
    ground: new BABYLON.Color3(0.56, 0.49, 0.36),
    road: new BABYLON.Color3(0.19, 0.22, 0.23),
    concrete: new BABYLON.Color3(0.58, 0.61, 0.61),
    amber: new BABYLON.Color3(1.0, 0.66, 0.22),
    blue: new BABYLON.Color3(0.05, 0.18, 0.25),
    green: new BABYLON.Color3(0.28, 0.75, 0.54),
    red: new BABYLON.Color3(0.82, 0.23, 0.18),
    white: new BABYLON.Color3(0.92, 0.93, 0.91)
  };

  const mat = (name, color, emissive = null) => {
    const m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = color;
    if (emissive) m.emissiveColor = emissive;
    m.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
    return m;
  };

  const mats = {
    ground: mat('groundMat', C.ground), road: mat('roadMat', C.road), concrete: mat('concreteMat', C.concrete),
    amber: mat('amberMat', C.amber), blue: mat('blueMat', C.blue), green: mat('greenMat', C.green),
    red: mat('redMat', C.red), white: mat('whiteMat', C.white), dark: mat('darkMat', new BABYLON.Color3(0.08,0.09,0.1))
  };

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 500, height: 500 }, scene);
  ground.material = mats.ground;

  function box(name, pos, scale, material, parent = null) {
    const m = BABYLON.MeshBuilder.CreateBox(name, { width: scale.x, height: scale.y, depth: scale.z }, scene);
    m.position.copyFrom(pos); m.material = material; if (parent) m.parent = parent; return m;
  }
  function cyl(name, pos, diameter, height, material, parent = null, rotZ = 0) {
    const m = BABYLON.MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 20 }, scene);
    m.position.copyFrom(pos); m.material = material; if (parent) m.parent = parent; m.rotation.z = rotZ; return m;
  }

  function road(x, z, w, d) { return box('road', new BABYLON.Vector3(x, 0.08, z), new BABYLON.Vector3(w, 0.16, d), mats.road); }
  road(0, 0, 28, 430); road(0, 0, 430, 28); road(-150, -110, 28, 210); road(145, 110, 28, 210);
  road(-75, -170, 170, 28); road(75, 170, 170, 28);

  function building(x, z, w, h, d, colorMat = mats.concrete) {
    return box('building', new BABYLON.Vector3(x,h/2,z), new BABYLON.Vector3(w,h,d), colorMat);
  }
  for (let i=0;i<20;i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (48 + (i%3)*22);
    const z = -180 + i*19;
    building(x,z,22,12+(i%4)*7,20, i%5===0?mats.white:mats.concrete);
  }

  const depot = { x:-150, z:-182, r:16 };
  building(-174,-184,32,16,30,mats.blue);
  box('batchTower', new BABYLON.Vector3(-147,17,-184), new BABYLON.Vector3(13,34,13), mats.concrete);
  cyl('silo1', new BABYLON.Vector3(-165,20,-160), 12, 36, mats.white);
  cyl('silo2', new BABYLON.Vector3(-149,20,-160), 12, 36, mats.white);
  box('hopper', new BABYLON.Vector3(-147,7,-184), new BABYLON.Vector3(17,2,15), mats.amber);

  const destinations = [
    { id:'homes', name:'مجتمع آفتاب', type:'بتن معمولی', x:-88, z:126, r:18, volume:6, time:180 },
    { id:'tower', name:'برج سپید', type:'بتن پمپی', x:82, z:177, r:18, volume:8, time:200 },
    { id:'bridge', name:'پل شرقی', type:'بتن سازه‌ای', x:168, z:-72, r:20, volume:7, time:190 },
    { id:'yard', name:'سوله صنعتی', type:'بتن کف صنعتی', x:94, z:-166, r:20, volume:9, time:215 },
    { id:'school', name:'پروژه مدرسه', type:'بتن معمولی', x:-172, z:56, r:18, volume:5, time:170 }
  ];
  destinations.forEach((d,i)=>{
    const m = i%2 ? mats.white : mats.concrete;
    building(d.x + 20, d.z + 12, 24, 14 + i*4, 24, m);
  });

  function makeZone(name, x, z, radius, material) {
    const ring = BABYLON.MeshBuilder.CreateTorus(name, { diameter: radius*1.7, thickness: 0.65, tessellation: 40 }, scene);
    ring.rotation.x = Math.PI/2; ring.position.set(x,0.42,z); ring.material = material; return ring;
  }
  makeZone('depotZone', depot.x, depot.z, depot.r, mats.amber);
  const siteZones = destinations.map(d => makeZone(`zone_${d.id}`, d.x,d.z,d.r,mats.green));
  siteZones.forEach(z => z.setEnabled(false));

  const truck = new BABYLON.TransformNode('truck', scene);
  box('chassis', new BABYLON.Vector3(0,1.1,0), new BABYLON.Vector3(3.1,0.7,7.2), mats.dark, truck);
  box('cab', new BABYLON.Vector3(0,2.25,2.25), new BABYLON.Vector3(3,2.7,2.5), mats.white, truck);
  box('windshield', new BABYLON.Vector3(0,2.6,3.52), new BABYLON.Vector3(2.45,1.15,0.08), mats.blue, truck);
  const drum = cyl('drum', new BABYLON.Vector3(0,2.25,-0.85), 2.7, 4.4, mats.white, truck, Math.PI/2);
  drum.rotation.x = Math.PI/2; drum.rotation.z = Math.PI/2;
  const stripe = cyl('stripe', new BABYLON.Vector3(0,2.25,-0.85), 2.78, 0.62, mats.amber, truck, Math.PI/2);
  stripe.rotation.x = Math.PI/2; stripe.rotation.z = Math.PI/2;
  const wheelOffsets = [[-1.6,0.8,2.1],[1.6,0.8,2.1],[-1.6,0.8,-1.7],[1.6,0.8,-1.7],[-1.6,0.8,-2.7],[1.6,0.8,-2.7]];
  wheelOffsets.forEach((p,i)=>{ const w=cyl(`wheel${i}`,new BABYLON.Vector3(...p),1.05,0.55,mats.dark,truck,Math.PI/2); w.rotation.z=Math.PI/2; });

  const arrow = BABYLON.MeshBuilder.CreateCylinder('navArrow',{diameterTop:0,diameterBottom:2.2,height:4,tessellation:4},scene);
  arrow.material = mats.amber; arrow.rotation.z = Math.PI; arrow.position.y = 7;

  const state = {
    running:false, phase:'AT_DEPOT', missionIndex:0, mission:null, time:180, score:0, deliveries:0,
    quality:100, health:100, loaded:false, volume:0, speed:0, steer:0, cameraMode:0,
    actionHold:0, collisions:0, lastDispatch:0
  };
  const input = { up:false, down:false, left:false, right:false, brake:false };

  function resetTruck() {
    truck.position.set(-150,0.1,-202); truck.rotation.set(0,0,0); state.speed=0; state.steer=0;
  }
  resetTruck();

  function selectMission() {
    state.mission = destinations[state.missionIndex % destinations.length];
    state.time = state.mission.time;
    state.quality = 100; state.loaded = false; state.volume = 0; state.actionHold = 0;
    siteZones.forEach((z,i)=>z.setEnabled(i === state.missionIndex % destinations.length));
    updateNavTarget(depot.x,depot.z);
  }
  selectMission();

  function distanceTo(x,z) { return Math.hypot(truck.position.x-x, truck.position.z-z); }
  function nearDepot(){ return distanceTo(depot.x,depot.z) <= depot.r; }
  function nearSite(){ return state.mission && distanceTo(state.mission.x,state.mission.z) <= state.mission.r; }
  function kmh(){ return Math.abs(state.speed) * 5.4; }
  function updateNavTarget(x,z){ arrow.position.x=x; arrow.position.z=z; }

  function dispatch(msg) {
    ui.dispatcherText.textContent = msg; ui.dispatcher.classList.remove('hidden');
    clearTimeout(dispatch._t); dispatch._t = setTimeout(()=>ui.dispatcher.classList.add('hidden'),3500);
  }

  function setMissionUI(stage,title,text,pct=0) {
    ui.stage.textContent=stage; ui.title.textContent=title; ui.text.textContent=text; ui.progress.style.width=`${Math.max(0,Math.min(100,pct))}%`;
  }

  function actionAvailable() {
    if (!state.running) return false;
    if (state.phase==='AT_DEPOT') return nearDepot() && kmh()<4;
    if (state.phase==='TO_SITE') return nearSite() && kmh()<4;
    if (state.phase==='RETURNING') return nearDepot() && kmh()<4;
    return false;
  }

  function doAction() {
    if (!actionAvailable()) return;
    if (state.phase==='AT_DEPOT') {
      state.phase='LOADING'; state.actionHold=0; state.speed=0; dispatch(`سفارش ${state.mission.volume} مترمکعب ${state.mission.type}. بارگیری شروع شد.`);
    } else if (state.phase==='TO_SITE') {
      state.phase='DELIVERING'; state.actionHold=0; state.speed=0;
    } else if (state.phase==='RETURNING') {
      state.deliveries++; state.missionIndex=(state.missionIndex+1)%destinations.length; selectMission(); state.phase='AT_DEPOT';
      dispatch('برگشتی کارخانه. سفارش بعدی آماده است.');
    }
  }

  function completeLoading() {
    state.phase='TO_SITE'; state.loaded=true; state.volume=state.mission.volume;
    updateNavTarget(state.mission.x,state.mission.z); dispatch(`بار آماده است؛ برو به ${state.mission.name}.`);
  }
  function completeDelivery() {
    const timeBonus=Math.max(0,Math.round(state.time*4));
    const qualityBonus=Math.round(state.quality*8);
    const healthBonus=Math.round(state.health*3);
    const deliveryScore=500+timeBonus+qualityBonus+healthBonus;
    state.score+=deliveryScore; state.loaded=false; state.volume=0; state.phase='RETURNING'; state.actionHold=0;
    updateNavTarget(depot.x,depot.z); dispatch(`تحویل ثبت شد: +${deliveryScore} امتیاز. حالا برگرد کارخانه.`);
  }

  function endShift(reason='زمان شیفت تمام شد') {
    state.running=false; state.speed=0; ui.hud.classList.add('hidden');
    ui.resultScore.textContent=state.score.toLocaleString('fa-IR');
    ui.resultText.textContent=`${reason}. تحویل موفق: ${state.deliveries} · برخورد: ${state.collisions} · سلامت نهایی: ${Math.round(state.health)}٪`;
    if (ui.result.showModal) ui.result.showModal();
  }

  function clampWorld() {
    const lim=224; let hit=false;
    if (truck.position.x>lim){truck.position.x=lim;hit=true} if(truck.position.x<-lim){truck.position.x=-lim;hit=true}
    if (truck.position.z>lim){truck.position.z=lim;hit=true} if(truck.position.z<-lim){truck.position.z=-lim;hit=true}
    if(hit) collisionPenalty();
  }

  let collisionCooldown=0;
  function collisionPenalty() {
    if(collisionCooldown>0) return; collisionCooldown=1.1; state.health=Math.max(0,state.health-7); state.score=Math.max(0,state.score-80); state.collisions++;
    state.speed*=-0.18; dispatch('برخورد! سلامت خودرو و امتیاز کم شد.');
    if(state.health<=0) endShift('کامیون از سرویس خارج شد');
  }

  function truckPhysics(dt) {
    const accel = input.up ? 7.2 : 0;
    const reverse = input.down ? 5.2 : 0;
    const drag = 1.8;
    if (accel) state.speed += accel*dt;
    if (reverse) state.speed -= reverse*dt;
    if (!input.up && !input.down) state.speed -= Math.sign(state.speed)*Math.min(Math.abs(state.speed),drag*dt);
    if (input.brake) state.speed *= Math.max(0,1-5*dt);
    state.speed=Math.max(-5,Math.min(13,state.speed));
    const steerTarget=(input.left?1:0)+(input.right?-1:0);
    state.steer += (steerTarget-state.steer)*Math.min(1,5*dt);
    if (Math.abs(state.speed)>0.15) truck.rotation.y += state.steer*(0.38+0.028*Math.abs(state.speed))*dt*Math.sign(state.speed);
    const fwd=new BABYLON.Vector3(Math.sin(truck.rotation.y),0,Math.cos(truck.rotation.y));
    truck.position.addInPlace(fwd.scale(state.speed*dt));
    drum.rotation.y += (state.loaded?1.8:0.5)*dt;
    stripe.rotation.y = drum.rotation.y;
    clampWorld();
  }

  function cameraUpdate(dt) {
    const fwd=new BABYLON.Vector3(Math.sin(truck.rotation.y),0,Math.cos(truck.rotation.y));
    const right=new BABYLON.Vector3(fwd.z,0,-fwd.x);
    let desired,target;
    if(state.cameraMode===0){ desired=truck.position.subtract(fwd.scale(13)).add(new BABYLON.Vector3(0,7.5,0)); target=truck.position.add(fwd.scale(7)).add(new BABYLON.Vector3(0,2.1,0)); }
    else { desired=truck.position.add(fwd.scale(2.7)).add(right.scale(-0.35)).add(new BABYLON.Vector3(0,3.2,0)); target=truck.position.add(fwd.scale(24)).add(new BABYLON.Vector3(0,2.6,0)); }
    camera.position=BABYLON.Vector3.Lerp(camera.position,desired,Math.min(1,5*dt)); camera.setTarget(target);
  }

  function updateMission(dt) {
    if (!state.running) return;
    state.time -= dt;
    if(state.loaded){ state.quality=Math.max(0,state.quality-dt*0.11-(kmh()>65?dt*0.025:0)); }
    if(state.time<=0){ endShift('زمان مأموریت تمام شد'); return; }
    if(state.quality<=18){ endShift('کیفیت بتن به حد مردودی رسید'); return; }

    if(state.phase==='AT_DEPOT') {
      setMissionUI('مرحله ۱ از ۴','بارگیری در کارخانه',`زیر بچینگ توقف کن. سفارش: ${state.mission.volume} m³ ${state.mission.type}`,0);
      updateNavTarget(depot.x,depot.z);
    } else if(state.phase==='LOADING') {
      state.actionHold+=dt; const p=Math.min(100,state.actionHold/3.2*100); setMissionUI('در حال بارگیری','بچینگ در حال بارگیری است','حرکت نکن؛ بارگیری تا تکمیل ادامه دارد.',p); if(p>=100)completeLoading();
    } else if(state.phase==='TO_SITE') {
      const dist=Math.round(distanceTo(state.mission.x,state.mission.z)); setMissionUI('مرحله ۲ از ۴',`حرکت به ${state.mission.name}`,`فاصله تقریبی ${dist} متر · بتن را با کیفیت مناسب برسان.`,Math.max(0,100-dist/3));
      if(state.time<45 && performance.now()/1000-state.lastDispatch>12){state.lastDispatch=performance.now()/1000;dispatch('راننده! کمتر از ۴۵ ثانیه وقت داری؛ معطل نکن!');}
    } else if(state.phase==='DELIVERING') {
      state.actionHold+=dt; const p=Math.min(100,state.actionHold/3.6*100); setMissionUI('مرحله ۳ از ۴','تخلیه بتن','پارک ثبت شد؛ در حال تخلیه.',p); if(p>=100)completeDelivery();
    } else if(state.phase==='RETURNING') {
      const dist=Math.round(distanceTo(depot.x,depot.z)); setMissionUI('مرحله ۴ از ۴','بازگشت به کارخانه',`برای سفارش بعدی برگرد. فاصله ${dist} متر.`,Math.max(0,100-dist/3));
    }
  }

  function updateHUD(){
    ui.timer.textContent=`${String(Math.max(0,Math.floor(state.time/60))).padStart(2,'0')}:${String(Math.max(0,Math.floor(state.time%60))).padStart(2,'0')}`;
    ui.quality.textContent=`${Math.round(state.quality)}%`; ui.health.textContent=`${Math.round(state.health)}%`; ui.score.textContent=state.score.toLocaleString('fa-IR'); ui.speed.textContent=Math.round(kmh());
    const available=actionAvailable(); ui.actionBtn.disabled=!available; ui.actionBtn.style.opacity=available?'1':'.5';
    if(state.phase==='AT_DEPOT') ui.actionHint.textContent=available?'برای شروع بارگیری E را بزن':'وارد محدوده بچینگ شو و توقف کن';
    else if(state.phase==='TO_SITE') ui.actionHint.textContent=available?'پارک انجام شد؛ E برای تخلیه':'داخل حلقه سبز پروژه توقف کن';
    else if(state.phase==='RETURNING') ui.actionHint.textContent=available?'E برای سفارش بعدی':'به کارخانه برگرد';
    else ui.actionHint.textContent='عملیات در حال انجام است…';
  }

  function startGame(){
    if(ui.result.open) ui.result.close(); resetTruck(); state.running=true; state.phase='AT_DEPOT'; state.missionIndex=0; state.score=0; state.deliveries=0; state.health=100; state.collisions=0; state.lastDispatch=0; selectMission();
    ui.menu.classList.add('hidden'); ui.hud.classList.remove('hidden'); dispatch(`شیفت شروع شد. ${ui.playerName.value || 'راننده'}، اول بار بزن.`);
  }

  const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'brake'};
  addEventListener('keydown',e=>{
    if(keyMap[e.code]){input[keyMap[e.code]]=true;e.preventDefault();}
    if(e.repeat)return;
    if(e.code==='KeyE')doAction();
    if(e.code==='KeyC')state.cameraMode=(state.cameraMode+1)%2;
    if(e.code==='KeyR'){resetTruck();state.health=Math.max(0,state.health-2);}
  });
  addEventListener('keyup',e=>{if(keyMap[e.code]){input[keyMap[e.code]]=false;e.preventDefault();}});
  addEventListener('blur',()=>Object.keys(input).forEach(k=>input[k]=false));
  ui.actionBtn.addEventListener('click',doAction); ui.start.addEventListener('click',startGame); ui.restart.addEventListener('click',startGame);

  let last=performance.now();
  engine.runRenderLoop(()=>{
    const now=performance.now(); const dt=Math.min(0.05,(now-last)/1000); last=now; collisionCooldown=Math.max(0,collisionCooldown-dt);
    if(state.running){truckPhysics(dt);updateMission(dt);updateHUD();}
    cameraUpdate(dt); arrow.rotation.y+=dt*1.8; arrow.position.y=6.7+Math.sin(now/350)*0.6; scene.render();
  });
  addEventListener('resize',()=>engine.resize());
  ui.loading.classList.add('hidden');
})();
