(() => {
  'use strict';

  const hud=document.getElementById('hud');
  if(!hud)return;

  const panel=document.createElement('aside');
  panel.className='quality-panel';
  panel.innerHTML='<div><span>تازگی</span><strong id="freshnessValue">100%</strong></div><div><span>اسلامپ برآوردی</span><strong id="slumpValue">— mm</strong></div><div><span>زمان حمل</span><strong id="deliveryAgeValue">00:00</strong></div>';
  hud.appendChild(panel);

  const freshness=document.getElementById('freshnessValue');
  const slump=document.getElementById('slumpValue');
  const age=document.getElementById('deliveryAgeValue');

  function formatTime(seconds){
    const s=Math.max(0,Math.floor(Number(seconds)||0));
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  }

  function frame(){
    const telemetry=window.TolouGameTelemetry?.getConcrete?.();
    if(telemetry){
      freshness.textContent=`${Math.round(telemetry.freshness)}%`;
      slump.textContent=`${Math.round(telemetry.slumpEstimate)} mm`;
      age.textContent=formatTime(telemetry.elapsedDeliveryTime);
      panel.classList.toggle('quality-active',Boolean(telemetry.loaded));
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
