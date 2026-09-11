(() => {
  'use strict';

  const canvas=document.getElementById('miniMapCanvas');
  const distanceEl=document.getElementById('gpsDistance');
  const targetEl=document.getElementById('gpsTarget');
  const bearingEl=document.getElementById('gpsBearing');
  if(!canvas)return;

  const ctx=canvas.getContext('2d');
  const WORLD_HALF=250;
  const roads=[
    {x:0,z:0,w:28,d:430},{x:0,z:0,w:430,d:28},{x:-150,z:-110,w:28,d:210},
    {x:145,z:110,w:28,d:210},{x:-75,z:-170,w:170,d:28},{x:75,z:170,w:170,d:28}
  ];
  const destinations=[
    {name:'مجتمع آفتاب',x:-88,z:126},{name:'برج سپید',x:82,z:177},{name:'پل شرقی',x:168,z:-72},
    {name:'سوله صنعتی',x:94,z:-166},{name:'پروژه مدرسه',x:-172,z:56}
  ];
  const depot={name:'کارخانه',x:-150,z:-182};

  function scene(){ return window.BABYLON?.EngineStore?.LastCreatedScene || null; }
  function worldToMap(x,z,w,h){ return {x:(x+WORLD_HALF)/(WORLD_HALF*2)*w,y:(WORLD_HALF-z)/(WORLD_HALF*2)*h}; }
  function directionName(rad){
    const deg=(rad*180/Math.PI+360)%360;
    const names=['شمال','شمال‌شرق','شرق','جنوب‌شرق','جنوب','جنوب‌غرب','غرب','شمال‌غرب'];
    return names[Math.round(deg/45)%8];
  }
  function closestNamedTarget(x,z){
    const all=[depot,...destinations];
    let best=all[0],bestD=Infinity;
    for(const p of all){const d=Math.hypot(p.x-x,p.z-z);if(d<bestD){bestD=d;best=p;}}
    return best;
  }

  function draw(){
    const s=scene();
    const truck=s?.getTransformNodeByName?.('truck');
    const arrow=s?.getMeshByName?.('navArrow');
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(160,Math.round(rect.width*dpr)),h=Math.max(160,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(10,27,37,.92)';ctx.fillRect(0,0,w,h);

    ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1*dpr;
    for(let i=1;i<5;i++){const p=i*w/5;ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(w,p);ctx.stroke();}

    ctx.fillStyle='rgba(255,255,255,.15)';
    for(const r of roads){const a=worldToMap(r.x-r.w/2,r.z+r.d/2,w,h),b=worldToMap(r.x+r.w/2,r.z-r.d/2,w,h);ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);}

    const dp=worldToMap(depot.x,depot.z,w,h);
    ctx.fillStyle='#ffc064';ctx.beginPath();ctx.arc(dp.x,dp.y,4.5*dpr,0,Math.PI*2);ctx.fill();
    for(const dest of destinations){const p=worldToMap(dest.x,dest.z,w,h);ctx.fillStyle='#8ce0bf';ctx.beginPath();ctx.arc(p.x,p.y,3.5*dpr,0,Math.PI*2);ctx.fill();}

    if(truck){
      const tp=worldToMap(truck.position.x,truck.position.z,w,h);
      const yaw=truck.rotation.y||0;
      ctx.save();ctx.translate(tp.x,tp.y);ctx.rotate(yaw);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(0,-8*dpr);ctx.lineTo(5*dpr,6*dpr);ctx.lineTo(0,3*dpr);ctx.lineTo(-5*dpr,6*dpr);ctx.closePath();ctx.fill();ctx.restore();

      if(arrow){
        const target={x:arrow.position.x,z:arrow.position.z};
        const ap=worldToMap(target.x,target.z,w,h);
        ctx.strokeStyle='#ffc064';ctx.lineWidth=2*dpr;ctx.setLineDash([4*dpr,4*dpr]);ctx.beginPath();ctx.moveTo(tp.x,tp.y);ctx.lineTo(ap.x,ap.y);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#ffc064';ctx.beginPath();ctx.arc(ap.x,ap.y,6*dpr,0,Math.PI*2);ctx.fill();

        const dx=target.x-truck.position.x,dz=target.z-truck.position.z;
        const dist=Math.round(Math.hypot(dx,dz));
        const bearing=Math.atan2(dx,dz);
        const named=closestNamedTarget(target.x,target.z);
        if(distanceEl)distanceEl.textContent=`${dist.toLocaleString('fa-IR')} m`;
        if(targetEl)targetEl.textContent=named.name;
        if(bearingEl)bearingEl.textContent=directionName(bearing);
      }
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
