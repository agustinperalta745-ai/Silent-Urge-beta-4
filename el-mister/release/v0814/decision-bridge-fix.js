/* ===== El Míster v0.8.14 · fix exclusivo: pausa -> situación visible =====
   La dinámica histórica sigue siendo la autoridad. Este parche solo garantiza
   que una pausa del motor viejo se muestre sobre el Canvas 0.8.9 y nunca quede
   congelada en silencio.
*/
(function(){
  function validScenario(s){return !!(s&&s.t&&Array.isArray(s.o)&&s.o.length>0)}
  function canSubNow(l){return !!(l&&l.subsUsed<5&&(l.minute===45||l.activeSubWindowMinute===l.minute||l.subWindows<3))}
  function resumeAfterRenderFailure(l,err){
    console.error('em814 decision render',err);
    try{l.scenario=null;save()}catch(e){}
    try{if(typeof toast==='function')toast('No se pudo abrir la situación. El partido continúa.')}catch(e){}
    setTimeout(()=>{try{if(S.live&&typeof em80RenderMatch==='function')em80RenderMatch();else if(typeof v06RenderMatchHub==='function')v06RenderMatchHub()}catch(e){console.error('em814 resume',e)}},80)
  }

  function renderHistoricalDecision(){
    const l=S.live,s=l?.scenario;
    if(!l)return typeof render==='function'?render():undefined;
    if(!validScenario(s))return resumeAfterRenderFailure(l,new Error('invalid historical scenario'));
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    try{
      const cls=s.kind==='keyplay'?'keyplay':s.kind==='rare'?'rare':'';
      const intensity=typeof v062MatchIntensity==='function'?v062MatchIntensity(l):50;
      const canSub=canSubNow(l);
      const label=s.kind==='rare'?'EN CANCHA':s.kind==='keyplay'?'JUGADA CLAVE':'LECTURA DEL PARTIDO';
      const pill=s.kind==='rare'?'bad':s.kind==='keyplay'?'warn':'';
      const context=typeof liveContextHtml==='function'?liveContextHtml(l):'';
      const pitch=typeof em80DecisionPitchHtml==='function'?em80DecisionPitchHtml():'';
      openModal(`<div class="liveHead"><div class="row between"><span class="minute">${l.minute}' · INTERVENCIÓN ${l.pauseCount||l.stopIndex+1}</span><span class="pill ${pill}">${label}</span></div><div class="liveScore">${l.gh} – ${l.ga}</div><div class="muted small">${club(l.home).name} · ${club(l.away).name}</div></div>${pitch}<div class="v0712Paused">La cancha se detuvo en esta situación. Tu decisión define cómo continúa la jugada.</div>${context}<div class="small muted" style="margin-bottom:10px">Intensidad del partido: <b>${intensity}/100</b></div><h2>${s.t}</h2><p>${s.d}</p>${s.o.map((o,i)=>`<button class="choice ${cls}" onclick="resolveMatchChoice(${i})"><b>${o.t}</b><span>${o.h||''}</span></button>`).join('')}<div style="height:8px"></div><button class="secondary" onclick="v062OpenSubsFromDecision()" ${canSub?'':'disabled'}>🔄 Hacer cambio</button><div class="small muted center" style="margin-top:9px">La decisión queda pendiente mientras hacés la sustitución. Después volvés a esta misma situación.</div>`);
      setTimeout(()=>{
        try{if(typeof em80DrawDecision==='function')em80DrawDecision()}catch(e){console.error('em814 decision pitch',e)}
        if(!document.querySelector('#modalRoot .choice'))resumeAfterRenderFailure(l,new Error('decision choices missing after render'));
      },30);
      return true
    }catch(e){return resumeAfterRenderFailure(l,e)}
  }

  // IMPORTANT: no build80x / em802 / em806 / em807 here. We render the scenario
  // already chosen by the restored historical makeMatchScenario().
  renderLiveDecision=renderHistoricalDecision;

  em80PauseForDecision=function(l=S.live){
    if(!l)return;
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    if(!validScenario(l.scenario)){
      try{l.scenario=makeMatchScenario(l.stopIndex)}catch(e){return resumeAfterRenderFailure(l,e)}
    }
    if(!validScenario(l.scenario))return resumeAfterRenderFailure(l,new Error('makeMatchScenario returned no visible situation'));
    try{save()}catch(e){}
    return renderHistoricalDecision()
  };

  v06RenderMatchHub=function(){
    const l=S.live;
    if(!l)return typeof render==='function'?render():undefined;
    if(validScenario(l.scenario))return renderHistoricalDecision();
    return typeof em80RenderMatch==='function'?em80RenderMatch():undefined
  };
  v063AdvanceUntilDecision=function(){return v06RenderMatchHub()};

  window.em814DecisionBridge={version:'0.8.14',visual:'0.8.9',logic:'historical',silentFreezeGuard:true};
})();
