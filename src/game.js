(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ui = {
    canvas:$('renderCanvas'), loading:$('loading'), menu:$('menu'), hud:$('hud'), start:$('startBtn'), continueBtn:$('continueBtn'), restart:$('restartBtn'), playerName:$('playerName'), saveInfo:$('saveInfo'),
    timer:$('timer'), quality:$('quality'), health:$('health'), score:$('score'), speed:$('speed'), stage:$('missionStage'), title:$('missionTitle'), text:$('missionText'), progress:$('missionProgress'),
    actionBtn:$('actionBtn'), actionHint:$('actionHint'), dispatcher:$('dispatcher'), dispatcherText:$('dispatcherText'), result:$('resultDialog'), resultScore:$('resultScore'), resultText:$('resultText'),
    pause:$('pauseDialog'), pauseStatus:$('pauseStatus'), resume:$('resumeBtn'), save:$('saveBtn'), mainMenu:$('mainMenuBtn'), exit:$('exitBtn')
  };

  const persistence = window.TolouPersistence;
  const sessionCodec = window.TolouSessionState;
  const AUTOSAVE_SLOT = 'autosave';
  let gameVersion = '0.2.0';
  let paused = false;
  let saveInFlight = null;

  if (!window.BABYLON || !BABYLON.Engine.isSupported()) {
    ui.loading.textContent = 'WebGL/Babylon.js در این سیستم قابل اجرا نیست.';
    return;
  }

  const engine = new BABYLON.Engine(ui.canvas, true, { preserveDrawingBuffer:true, stencil:true, antialias:true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(.72,.86,.92,1);
  scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogStart = 150;
  scene.fogEnd = 420;
  scene.fogColor = new BABYLON.Color3(.72,.86,.92);

  const camera = new BABYLON.FreeCamera('followCam', new BABYLON.Vector3(0,9,-14), scene);
  camera.minZ = .1;
  camera.fov = .88;
  camera.inputs.clear();

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(.25,1,.15), scene); hemi.intensity=.95;
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-.4,-1,.3), scene); sun.position.set(80,140,-80); sun.intensity=.6;

  const mat = (name,color) => { const m=new BABYLON.StandardMaterial(name,scene); m.diffuseColor=color; m.specularColor=new BABYLON.Color3(.08,.08,.08); return m; };
  const mats = {
    ground:mat('groundMat',new BABYLON.Color3(.56,.49,.36)), road:mat('roadMat',new BABYLON.Color3(.19,.22,.23)), concrete:mat('concreteMat',new BABYLON.Color3(.58,.61,.61)),
    amber:mat('amberMat',new BABYLON.Color3(1,.66,.22)), blue:mat('blueMat',new BABYLON.Color3(.05,.18,.25)), green:mat('greenMat',new BABYLON.Color3(.28,.75,.54)),
    white:mat('whiteMat',new BABYLON.Color3(.92,.93,.91)), dark:mat('darkMat',new BABYLON.Color3(.08,.09,.1))
  };

  const colliders=[];
  function addBoxCollider(x,z,w,d,label='structure',padding=.25){
    colliders.push({type:'box',x,z,halfX:w/2+padding,halfZ:d/2+padding,label});
  }
  function addCircleCollider(x,z,r,label='structure',padding=.2){
    colliders.push({type:'circle',x,z,r:r+padding,label});
  }

  function box(name,pos,scale,material,parent=null){ const m=BABYLON.MeshBuilder.CreateBox(name,{width:scale.x,height:scale.y,depth:scale.z},scene); m.position.copyFrom(pos); m.material=material; if(parent)m.parent=parent; return m; }
  function cyl(name,pos,diameter,height,material,parent=null){ const m=BABYLON.MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:20},scene); m.position.copyFrom(pos); m.material=material; if(parent)m.parent=parent; return m; }
  const ground=BABYLON.MeshBuilder.CreateGround('ground',{width:500,height:500},scene); ground.material=mats.ground;
  const road=(x,z,w,d)=>box('road',new BABYLON.Vector3(x,.08,z),new BABYLON.Vector3(w,.16,d),mats.road);
  road(0,0,28,430); road(0,0,430,28); road(-150,-110,28,210); road(145,110,28,210); road(-75,-170,170,28); road(75,170,170,28);
  const building=(x,z,w,h,d,material=mats.concrete,label='building')=>{
    addBoxCollider(x,z,w,d,label,.3);
    return box('building',new BABYLON.Vector3(x,h/2,z),new BABYLON.Vector3(w,h,d),material);
  };
  for(let i=0;i<20;i++){ const side=i%2?1:-1; building(side*(48+(i%3)*22),-180+i*19,22,12+(i%4)*7,20,i%5===0?mats.white:mats.concrete,`city-${i}`); }

  const depot={x:-150,z:-182,r:16};
  building(-174,-184,32,16,30,mats.blue,'depot-building');
  box('batchTower',new BABYLON.Vector3(-147,17,-184),new BABYLON.Vector3(13,34,13),mats.concrete);
  cyl('silo1',new BABYLON.Vector3(-165,20,-160),12,36,mats.white);
  cyl('silo2',new BABYLON.Vector3(-149,20,-160),12,36,mats.white);
  addCircleCollider(-165,-160,6,'silo-1',.35);
  addCircleCollider(-149,-160,6,'silo-2',.35);
  box('hopper',new BABYLON.Vector3(-147,7,-184),new BABYLON.Vector3(17,2,15),mats.amber);

  const destinations=[
    {id:'homes',name:'مجتمع آفتاب',type:'بتن معمولی',x:-88,z:126,r:18,volume:6,time:180},
    {id:'tower',name:'برج سپید',type:'بتن پمپی',x:82,z:177,r:18,volume:8,time:200},
    {id:'bridge',name:'پل شرقی',type:'بتن سازه‌ای',x:168,z:-72,r:20,volume:7,time:190},
    {id:'yard',name:'سوله صنعتی',type:'بتن کف صنعتی',x:94,z:-166,r:20,volume:9,time:215},
    {id:'school',name:'پروژه مدرسه',type:'بتن معمولی',x:-172,z:56,r:18,volume:5,time:170}
  ];
  destinations.forEach((d,i)=>building(d.x+20,d.z+12,24,14+i*4,24,i%2?mats.white:mats.concrete,`site-${d.id}`));
  function makeZone(name,x,z,r,material){ const ring=BABYLON.MeshBuilder.CreateTorus(name,{diameter:r*1.7,thickness:.65,tessellation:40},scene); ring.rotation.x=Math.PI/2; ring.position.set(x,.42,z); ring.material=material; return ring; }
  makeZone('depotZone',depot.x,depot.z,depot.r,mats.amber);
  const siteZones=destinations.map(d=>makeZone(`zone_${d.id}`,d.x,d.z,d.r,mats.green)); siteZones.forEach(z=>z.setEnabled(false));

  const truck=new BABYLON.TransformNode('truck',scene);
  box('chassis',new BABYLON.Vector3(0,1.1,0),new BABYLON.Vector3(3.1,.7,7.2),mats.dark,truck);
  box('cab',new BABYLON.Vector3(0,2.25,2.25),new BABYLON.Vector3(3,2.7,2.5),mats.white,truck);
  box('windshield',new BABYLON.Vector3(0,2.6,3.52),new BABYLON.Vector3(2.45,1.15,.08),mats.blue,truck);
  const drum=cyl('drum',new BABYLON.Vector3(0,2.25,-.85),2.7,4.4,mats.white,truck); drum.rotation.x=Math.PI/2; drum.rotation.z=Math.PI/2;
  const stripe=cyl('stripe',new BABYLON.Vector3(0,2.25,-.85),2.78,.62,mats.amber,truck); stripe.rotation.x=Math.PI/2; stripe.rotation.z=Math.PI/2;

  const wheels=[];
  const wheelOffsets=[[-1.6,.8,2.1],[1.6,.8,2.1],[-1.6,.8,-1.7],[1.6,.8,-1.7],[-1.6,.8,-2.7],[1.6,.8,-2.7]];
  wheelOffsets.forEach((p,i)=>{ const pivot=new BABYLON.TransformNode(`wheelPivot${i}`,scene); pivot.parent=truck; pivot.position.set(p[0],p[1],p[2]); const w=cyl(`wheel${i}`,BABYLON.Vector3.Zero(),1.05,.55,mats.dark,pivot); w.rotation.z=Math.PI/2; wheels.push({pivot,mesh:w,front:i<2}); });

  const arrow=BABYLON.MeshBuilder.CreateCylinder('navArrow',{diameterTop:0,diameterBottom:2.2,height:4,tessellation:4},scene); arrow.material=mats.amber; arrow.rotation.z=Math.PI; arrow.position.y=7;

  const PHYSICS={
    empty:{maxForward:13.2,maxReverse:4.8,accel:5.9,reverseAccel:3.9,brake:9.4,rolling:1.05,drag:.012,steerRate:2.8,maxSteer:.52},
    loaded:{maxForward:11.4,maxReverse:4.1,accel:4.0,reverseAccel:3.0,brake:7.2,rolling:.9,drag:.014,steerRate:2.1,maxSteer:.43},
    handbrake:14.5,
    wheelBase:4.65,
    steerAtSpeedFloor:.34,
    wheelRadius:.525,
    lowSpeedDeadband:.025
  };

  const COLLISION={
    probeRadius:1.65,
    frontOffset:2.25,
    rearOffset:-1.85,
    minDamage:3,
    maxDamage:12,
    minScoreLoss:45,
    maxScoreLoss:180
  };

  const state={running:false,phase:'AT_DEPOT',missionIndex:0,mission:null,time:180,score:0,deliveries:0,quality:100,health:100,loaded:false,volume:0,speed:0,steer:0,cameraMode:0,actionHold:0,collisions:0,lastDispatch:0};
  const input={up:false,down:false,left:false,right:false,brake:false};
  let wheelSpin=0;

  function resetTruck(){ truck.position.set(-150,.1,-202); truck.rotation.set(0,0,0); state.speed=0; state.steer=0; wheelSpin=0; }
  function updateNavTarget(x,z){ arrow.position.x=x; arrow.position.z=z; }
  function applyMissionVisuals(){ siteZones.forEach((z,i)=>z.setEnabled(i===state.missionIndex%destinations.length)); if(state.phase==='TO_SITE'||state.phase==='DELIVERING')updateNavTarget(state.mission.x,state.mission.z); else updateNavTarget(depot.x,depot.z); }
  function selectMission(){ state.mission=destinations[state.missionIndex%destinations.length]; state.time=state.mission.time; state.quality=100; state.loaded=false; state.volume=0; state.actionHold=0; applyMissionVisuals(); }
  resetTruck(); selectMission();

  const distanceTo=(x,z)=>Math.hypot(truck.position.x-x,truck.position.z-z);
  const nearDepot=()=>distanceTo(depot.x,depot.z)<=depot.r;
  const nearSite=()=>state.mission&&distanceTo(state.mission.x,state.mission.z)<=state.mission.r;
  const kmh=()=>Math.abs(state.speed)*5.4;
  function dispatch(msg){ ui.dispatcherText.textContent=msg; ui.dispatcher.classList.remove('hidden'); clearTimeout(dispatch._t); dispatch._t=setTimeout(()=>ui.dispatcher.classList.add('hidden'),3500); }
  function setMissionUI(stage,title,text,pct=0){ ui.stage.textContent=stage; ui.title.textContent=title; ui.text.textContent=text; ui.progress.style.width=`${Math.max(0,Math.min(100,pct))}%`; }

  function runtimeForSave(){ return {gameVersion,playerName:ui.playerName.value,truck,state}; }
  async function saveGame(reason='manual'){
    if(!persistence||!sessionCodec||!state.mission)return false;
    const snapshot=sessionCodec.createSnapshot(runtimeForSave()); snapshot.reason=reason;
    saveInFlight=persistence.save({slot:AUTOSAVE_SLOT,state:snapshot});
    try{ await saveInFlight; ui.saveInfo.textContent=`ذخیره شد · ${new Date(snapshot.timestamp).toLocaleTimeString('fa-IR')}`; return true; }
    catch(err){ console.error('Save failed',err); if(ui.pauseStatus)ui.pauseStatus.textContent='ذخیره بازی ناموفق بود.'; return false; }
    finally{ saveInFlight=null; }
  }
  async function refreshContinue(){
    try{ const loaded=await persistence.load(AUTOSAVE_SLOT); const snapshot=loaded?.state||loaded; if(!snapshot)return; const check=sessionCodec.validate(snapshot,destinations); if(!check.ok)return; ui.continueBtn.classList.remove('hidden'); ui.saveInfo.textContent=`ذخیره موجود · ${snapshot.mission?.phase||''} · امتیاز ${snapshot.mission?.score||0}`; }catch(_err){}
  }
  function restoreSnapshot(snapshot){
    const check=sessionCodec.validate(snapshot,destinations); if(!check.ok)throw new Error(check.reason);
    state.missionIndex=snapshot.mission.missionIndex; state.mission=destinations[state.missionIndex%destinations.length]; state.phase=snapshot.mission.phase; state.time=snapshot.mission.remainingTime; state.actionHold=snapshot.mission.actionProgress||0; state.score=snapshot.mission.score; state.deliveries=snapshot.mission.deliveries; state.collisions=snapshot.mission.collisions; state.quality=snapshot.concrete.quality; state.loaded=snapshot.concrete.loaded; state.volume=snapshot.concrete.loadedVolume; state.health=snapshot.truck.health; state.speed=snapshot.truck.speed; state.steer=snapshot.truck.steeringAngle; state.cameraMode=snapshot.settings?.cameraMode||0;
    truck.position.set(snapshot.truck.position.x,snapshot.truck.position.y,snapshot.truck.position.z); truck.rotation.set(snapshot.truck.rotation.x,snapshot.truck.rotation.y,snapshot.truck.rotation.z); ui.playerName.value=snapshot.player?.name||'راننده طلوع'; state.running=true; paused=false; applyMissionVisuals(); ui.menu.classList.add('hidden'); ui.hud.classList.remove('hidden'); updateHUD(); dispatch('ذخیره بازی بازیابی شد؛ از همان نقطه ادامه بده.');
  }
  async function continueGame(){ try{ const loaded=await persistence.load(AUTOSAVE_SLOT); const snapshot=loaded?.state||loaded; if(!snapshot)throw new Error('no-save'); restoreSnapshot(snapshot); }catch(err){ console.error(err); ui.saveInfo.textContent='ذخیره قابل بازیابی نیست.'; } }

  function actionAvailable(){ if(!state.running||paused)return false; if(state.phase==='AT_DEPOT')return nearDepot()&&kmh()<4; if(state.phase==='TO_SITE')return nearSite()&&kmh()<4; if(state.phase==='RETURNING')return nearDepot()&&kmh()<4; return false; }
  async function doAction(){
    if(!actionAvailable())return;
    if(state.phase==='AT_DEPOT'){ state.phase='LOADING'; state.actionHold=0; state.speed=0; dispatch(`سفارش ${state.mission.volume} مترمکعب ${state.mission.type}. بارگیری شروع شد.`); await saveGame('loading-start'); }
    else if(state.phase==='TO_SITE'){ state.phase='DELIVERING'; state.actionHold=0; state.speed=0; await saveGame('delivery-start'); }
    else if(state.phase==='RETURNING'){ state.deliveries++; state.missionIndex=(state.missionIndex+1)%destinations.length; selectMission(); state.phase='AT_DEPOT'; dispatch('برگشتی کارخانه. سفارش بعدی آماده است.'); await saveGame('returned-to-depot'); }
  }
  async function completeLoading(){ state.phase='TO_SITE'; state.loaded=true; state.volume=state.mission.volume; applyMissionVisuals(); dispatch(`بار آماده است؛ برو به ${state.mission.name}.`); await saveGame('loading-complete'); }
  async function completeDelivery(){ const deliveryScore=500+Math.max(0,Math.round(state.time*4))+Math.round(state.quality*8)+Math.round(state.health*3); state.score+=deliveryScore; state.loaded=false; state.volume=0; state.phase='RETURNING'; state.actionHold=0; applyMissionVisuals(); dispatch(`تحویل ثبت شد: +${deliveryScore} امتیاز. حالا برگرد کارخانه.`); await saveGame('delivery-complete'); }
  function endShift(reason='زمان شیفت تمام شد'){ state.running=false; state.speed=0; ui.hud.classList.add('hidden'); ui.resultScore.textContent=state.score.toLocaleString('fa-IR'); ui.resultText.textContent=`${reason}. تحویل موفق: ${state.deliveries} · برخورد: ${state.collisions} · سلامت نهایی: ${Math.round(state.health)}٪`; if(ui.result.showModal)ui.result.showModal(); }

  function setPaused(value){ if(!state.running)return; paused=value; Object.keys(input).forEach(k=>input[k]=false); if(paused){ state.speed=0; if(!ui.pause.open)ui.pause.showModal(); } else if(ui.pause.open)ui.pause.close(); }
  async function pauseAndSave(){ setPaused(true); ui.pauseStatus.textContent='در حال ذخیره…'; const ok=await saveGame('manual'); ui.pauseStatus.textContent=ok?'بازی با موفقیت ذخیره شد.':'ذخیره بازی ناموفق بود.'; }
  async function saveAndMenu(){ setPaused(true); await saveGame('main-menu'); if(ui.pause.open)ui.pause.close(); state.running=false; ui.hud.classList.add('hidden'); ui.menu.classList.remove('hidden'); await refreshContinue(); }

  function clampWorld(){ const lim=224; let hit=false; if(truck.position.x>lim){truck.position.x=lim;hit=true} if(truck.position.x<-lim){truck.position.x=-lim;hit=true} if(truck.position.z>lim){truck.position.z=lim;hit=true} if(truck.position.z<-lim){truck.position.z=-lim;hit=true} if(hit)collisionPenalty(1,'مرز نقشه'); }
  let collisionCooldown=0;

  function circleHitsBox(px,pz,r,c){
    const nx=Math.max(c.x-c.halfX,Math.min(px,c.x+c.halfX));
    const nz=Math.max(c.z-c.halfZ,Math.min(pz,c.z+c.halfZ));
    const dx=px-nx, dz=pz-nz;
    return dx*dx+dz*dz < r*r;
  }
  function circleHitsCircle(px,pz,r,c){
    const dx=px-c.x, dz=pz-c.z;
    const rr=r+c.r;
    return dx*dx+dz*dz < rr*rr;
  }
  function colliderAt(px,pz,r){
    for(const c of colliders){
      if(c.type==='box' ? circleHitsBox(px,pz,r,c) : circleHitsCircle(px,pz,r,c)) return c;
    }
    return null;
  }
  function truckCollision(){
    const s=Math.sin(truck.rotation.y), c=Math.cos(truck.rotation.y);
    const probes=[
      {x:truck.position.x+s*COLLISION.frontOffset,z:truck.position.z+c*COLLISION.frontOffset},
      {x:truck.position.x+s*COLLISION.rearOffset,z:truck.position.z+c*COLLISION.rearOffset}
    ];
    for(const p of probes){
      const hit=colliderAt(p.x,p.z,COLLISION.probeRadius);
      if(hit)return hit;
    }
    return null;
  }
  function collisionPenalty(severity=1,label='مانع'){
    if(collisionCooldown>0)return;
    collisionCooldown=1.0;
    const t=Math.max(0,Math.min(1,severity));
    const damage=Math.round(COLLISION.minDamage+(COLLISION.maxDamage-COLLISION.minDamage)*t);
    const scoreLoss=Math.round(COLLISION.minScoreLoss+(COLLISION.maxScoreLoss-COLLISION.minScoreLoss)*t);
    state.health=Math.max(0,state.health-damage);
    state.score=Math.max(0,state.score-scoreLoss);
    state.collisions++;
    state.speed*=-.08;
    dispatch(`برخورد با ${label}! ${damage}٪ آسیب و ${scoreLoss} امتیاز جریمه.`);
    if(state.health<=0)endShift('کامیون از سرویس خارج شد');
  }

  function approach(value,target,maxDelta){ if(value<target)return Math.min(value+maxDelta,target); if(value>target)return Math.max(value-maxDelta,target); return value; }
  function currentPhysics(){ return state.loaded ? PHYSICS.loaded : PHYSICS.empty; }
  function truckPhysics(dt){
    const p=currentPhysics();
    const throttle=input.up;
    const reverse=input.down;
    const speedRatio=Math.min(1,Math.abs(state.speed)/Math.max(1,p.maxForward));

    if(throttle){
      if(state.speed<-.15) state.speed=approach(state.speed,0,p.brake*dt);
      else state.speed+=p.accel*(1-.55*speedRatio)*dt;
    } else if(reverse){
      if(state.speed>.15) state.speed=approach(state.speed,0,p.brake*dt);
      else state.speed-=p.reverseAccel*(1-.35*Math.min(1,Math.abs(state.speed)/p.maxReverse))*dt;
    } else {
      const resistance=p.rolling+p.drag*state.speed*state.speed;
      state.speed=approach(state.speed,0,resistance*dt);
    }

    if(input.brake) state.speed=approach(state.speed,0,PHYSICS.handbrake*dt);
    state.speed=Math.max(-p.maxReverse,Math.min(p.maxForward,state.speed));
    if(Math.abs(state.speed)<PHYSICS.lowSpeedDeadband)state.speed=0;

    const steerInput=(input.left?1:0)+(input.right?-1:0);
    const steerLimit=p.maxSteer*(1-(1-PHYSICS.steerAtSpeedFloor)*Math.min(1,kmh()/70));
    const steerTarget=steerInput*steerLimit;
    state.steer=approach(state.steer,steerTarget,p.steerRate*dt);
    if(!steerInput) state.steer=approach(state.steer,0,p.steerRate*1.25*dt);

    const previousPosition=truck.position.clone();
    const previousYaw=truck.rotation.y;
    const impactSpeed=Math.abs(state.speed);

    if(Math.abs(state.speed)>.03){
      const yawRate=(state.speed/PHYSICS.wheelBase)*Math.tan(state.steer);
      truck.rotation.y+=yawRate*dt;
    }

    const fwd=new BABYLON.Vector3(Math.sin(truck.rotation.y),0,Math.cos(truck.rotation.y));
    truck.position.addInPlace(fwd.scale(state.speed*dt));

    const hit=truckCollision();
    if(hit){
      truck.position.copyFrom(previousPosition);
      truck.rotation.y=previousYaw;
      const severity=Math.min(1,impactSpeed/currentPhysics().maxForward);
      collisionPenalty(severity,hit.label);
    }

    wheelSpin+=state.speed*dt/PHYSICS.wheelRadius;
    wheels.forEach(w=>{ w.mesh.rotation.x=wheelSpin; if(w.front)w.pivot.rotation.y=-state.steer; });
    drum.rotation.y+=(state.loaded?1.65:.45)*dt;
    stripe.rotation.y=drum.rotation.y;
    clampWorld();
  }

  function cameraUpdate(dt){
    const fwd=new BABYLON.Vector3(Math.sin(truck.rotation.y),0,Math.cos(truck.rotation.y));
    const right=new BABYLON.Vector3(fwd.z,0,-fwd.x);
    let desired,target;
    if(state.cameraMode===0){
      const speedPush=Math.min(3,kmh()/35);
      desired=truck.position.subtract(fwd.scale(13+speedPush)).add(new BABYLON.Vector3(0,7.5+.3*speedPush,0));
      target=truck.position.add(fwd.scale(7+speedPush)).add(new BABYLON.Vector3(0,2.1,0));
    } else {
      desired=truck.position.add(fwd.scale(2.7)).add(right.scale(-.35)).add(new BABYLON.Vector3(0,3.2,0));
      target=truck.position.add(fwd.scale(24)).add(new BABYLON.Vector3(0,2.6,0));
    }
    const smoothing=1-Math.exp(-5*dt);
    camera.position=BABYLON.Vector3.Lerp(camera.position,desired,smoothing);
    camera.setTarget(target);
  }

  function updateMission(dt){
    if(!state.running||paused)return;
    state.time-=dt;
    if(state.loaded)state.quality=Math.max(0,state.quality-dt*.11-(kmh()>65?dt*.025:0));
    if(state.time<=0){endShift('زمان مأموریت تمام شد');return;}
    if(state.quality<=18){endShift('کیفیت بتن به حد مردودی رسید');return;}
    if(state.phase==='AT_DEPOT')setMissionUI('مرحله ۱ از ۴','بارگیری در کارخانه',`زیر بچینگ توقف کن. سفارش: ${state.mission.volume} m³ ${state.mission.type}`,0);
    else if(state.phase==='LOADING'){ state.actionHold+=dt; const p=Math.min(100,state.actionHold/3.2*100); setMissionUI('در حال بارگیری','بچینگ در حال بارگیری است','حرکت نکن؛ بارگیری تا تکمیل ادامه دارد.',p); if(p>=100)completeLoading(); }
    else if(state.phase==='TO_SITE'){ const dist=Math.round(distanceTo(state.mission.x,state.mission.z)); setMissionUI('مرحله ۲ از ۴',`حرکت به ${state.mission.name}`,`فاصله تقریبی ${dist} متر · بتن را با کیفیت مناسب برسان.`,Math.max(0,100-dist/3)); if(state.time<45&&performance.now()/1000-state.lastDispatch>12){state.lastDispatch=performance.now()/1000;dispatch('راننده! کمتر از ۴۵ ثانیه وقت داری؛ معطل نکن!');} }
    else if(state.phase==='DELIVERING'){ state.actionHold+=dt; const p=Math.min(100,state.actionHold/3.6*100); setMissionUI('مرحله ۳ از ۴','تخلیه بتن','پارک ثبت شد؛ در حال تخلیه.',p); if(p>=100)completeDelivery(); }
    else if(state.phase==='RETURNING'){ const dist=Math.round(distanceTo(depot.x,depot.z)); setMissionUI('مرحله ۴ از ۴','بازگشت به کارخانه',`برای سفارش بعدی برگرد. فاصله ${dist} متر.`,Math.max(0,100-dist/3)); }
  }

  function updateHUD(){
    ui.timer.textContent=`${String(Math.max(0,Math.floor(state.time/60))).padStart(2,'0')}:${String(Math.max(0,Math.floor(state.time%60))).padStart(2,'0')}`;
    ui.quality.textContent=`${Math.round(state.quality)}%`; ui.health.textContent=`${Math.round(state.health)}%`; ui.score.textContent=state.score.toLocaleString('fa-IR'); ui.speed.textContent=Math.round(kmh());
    const available=actionAvailable(); ui.actionBtn.disabled=!available; ui.actionBtn.style.opacity=available?'1':'.5';
    if(state.phase==='AT_DEPOT')ui.actionHint.textContent=available?'برای شروع بارگیری E را بزن':'وارد محدوده بچینگ شو و توقف کن';
    else if(state.phase==='TO_SITE')ui.actionHint.textContent=available?'پارک انجام شد؛ E برای تخلیه':'داخل حلقه سبز پروژه توقف کن';
    else if(state.phase==='RETURNING')ui.actionHint.textContent=available?'E برای سفارش بعدی':'به کارخانه برگرد';
    else ui.actionHint.textContent='عملیات در حال انجام است…';
  }

  async function startGame(){ if(ui.result.open)ui.result.close(); resetTruck(); state.running=true; paused=false; state.phase='AT_DEPOT'; state.missionIndex=0; state.score=0; state.deliveries=0; state.health=100; state.collisions=0; state.lastDispatch=0; selectMission(); ui.menu.classList.add('hidden'); ui.hud.classList.remove('hidden'); dispatch(`شیفت شروع شد. ${ui.playerName.value||'راننده طلوع'}، اول بار بزن.`); await saveGame('new-game'); }

  const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'brake'};
  addEventListener('keydown',e=>{ if(keyMap[e.code]&&!paused){input[keyMap[e.code]]=true;e.preventDefault();} if(e.repeat)return; if(e.code==='KeyP'||e.code==='Escape'){if(state.running)setPaused(!paused);e.preventDefault();return;} if(paused)return; if(e.code==='KeyE')doAction(); if(e.code==='KeyC')state.cameraMode=(state.cameraMode+1)%2; if(e.code==='KeyR'){resetTruck();state.health=Math.max(0,state.health-2);} });
  addEventListener('keyup',e=>{ if(keyMap[e.code]){input[keyMap[e.code]]=false;e.preventDefault();} });
  addEventListener('blur',()=>Object.keys(input).forEach(k=>input[k]=false));

  ui.actionBtn.addEventListener('click',doAction); ui.start.addEventListener('click',startGame); ui.continueBtn.addEventListener('click',continueGame); ui.restart.addEventListener('click',startGame); ui.resume.addEventListener('click',()=>setPaused(false)); ui.save.addEventListener('click',pauseAndSave); ui.mainMenu.addEventListener('click',saveAndMenu);

  if(window.tolouDesktop){
    ui.exit.classList.remove('hidden');
    window.tolouDesktop.getAppInfo().then(info=>{if(info?.appVersion)gameVersion=info.appVersion;});
    ui.exit.addEventListener('click',async()=>{setPaused(true);await saveGame('exit');window.tolouDesktop.confirmClose?.();});
    window.tolouDesktop.onCloseRequested?.(async()=>{if(state.running){setPaused(true);await saveGame('window-close');}window.tolouDesktop.confirmClose?.();});
  }

  let last=performance.now(),autosaveClock=0;
  engine.runRenderLoop(()=>{
    const now=performance.now(); const dt=Math.min(.05,(now-last)/1000); last=now; collisionCooldown=Math.max(0,collisionCooldown-dt);
    if(state.running&&!paused){ truckPhysics(dt); updateMission(dt); updateHUD(); autosaveClock+=dt; if(autosaveClock>=30){autosaveClock=0;saveGame('periodic');} }
    cameraUpdate(dt); arrow.rotation.y+=dt*1.8; arrow.position.y=6.7+Math.sin(now/350)*.6; scene.render();
  });

  addEventListener('resize',()=>engine.resize());
  refreshContinue();
  ui.loading.classList.add('hidden');
})();
