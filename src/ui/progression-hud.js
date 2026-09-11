(() => {
  'use strict';

  const core=window.TolouCareerProfile;
  const persistence=window.TolouPersistence;
  const stage=document.getElementById('missionStage');
  const score=document.getElementById('score');
  const quality=document.getElementById('quality');
  const health=document.getElementById('health');
  const timer=document.getElementById('timer');
  const topbar=document.querySelector('.topbar');
  if(!core||!persistence||!stage||!score||!quality||!health||!timer||!topbar)return;

  const PROFILE_SLOT='career-profile';
  let profile=core.createProfile();
  let ready=false;
  let previousStage='';
  let previousScore=0;
  let saving=Promise.resolve();

  const card=document.createElement('div');
  card.className='stat career-stat';
  card.innerHTML='<span>رانک / اعتبار</span><strong id="careerLevel">Lv 1</strong><small id="careerCredits">0 CR</small>';
  topbar.appendChild(card);
  const levelEl=card.querySelector('#careerLevel');
  const creditsEl=card.querySelector('#careerCredits');

  const style=document.createElement('style');
  style.textContent='.career-stat{min-width:125px}.career-stat small{font-size:10px;color:#8ce0bf;margin-top:2px}.career-toast{position:fixed;left:50%;top:88px;transform:translateX(-50%);z-index:8;background:#102b39ed;border:1px solid #ffc06466;border-radius:12px;padding:10px 16px;color:#fff;font-size:13px;box-shadow:0 10px 30px #0005;pointer-events:none}@media(max-width:760px){.career-stat{display:none}.career-toast{top:64px;max-width:86vw}}';
  document.head.appendChild(style);

  function numberText(el){ return Number(String(el.textContent||'0').replace(/[^0-9.-]/g,''))||0; }
  function timerSeconds(){ const p=(timer.textContent||'0:0').split(':').map(Number); return (p[0]||0)*60+(p[1]||0); }
  function render(){ levelEl.textContent=`Lv ${profile.level}`; creditsEl.textContent=`${profile.credits.toLocaleString('fa-IR')} CR · ${profile.rankLabel}`; }
  function toast(text){ const el=document.createElement('div'); el.className='career-toast'; el.textContent=text; document.body.appendChild(el); setTimeout(()=>el.remove(),3200); }
  function persist(){ const snapshot={...profile,updatedAt:new Date().toISOString()}; saving=saving.catch(()=>{}).then(()=>persistence.save({slot:PROFILE_SLOT,state:snapshot})); return saving; }

  async function load(){
    try{ const loaded=await persistence.load(PROFILE_SLOT); profile=core.hydrate(loaded?.state||loaded); }
    catch(_err){ profile=core.createProfile(); }
    ready=true; previousStage=stage.textContent||''; previousScore=numberText(score); render();
  }

  function tick(){
    const currentStage=stage.textContent||'';
    const currentScore=numberText(score);
    if(ready&&previousStage.includes('مرحله ۳')&&currentStage.includes('مرحله ۴')){
      const award=core.awardDelivery(profile,{scoreGain:Math.max(0,currentScore-previousScore),quality:numberText(quality),health:numberText(health),remainingTime:timerSeconds()});
      profile=award.profile; render(); persist();
      const levelText=award.leveledUp?` · ارتقا به سطح ${award.level}`:'';
      toast(`+${award.xpGain} XP · +${award.creditsGain} CR${levelText}`);
    }
    previousStage=currentStage; previousScore=currentScore;
    requestAnimationFrame(tick);
  }

  load().finally(()=>requestAnimationFrame(tick));
})();
