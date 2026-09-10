/* ===== El Míster v0.8.11 · simulación 0.8.9 + dinámica de partido pre-pantalla =====
   La cancha/Canvas 0.8.9 es solamente la representación visual.
   La autoridad sobre goles, pausas, situaciones, decisiones y minijuegos vuelve
   a las funciones capturadas justo antes de cargar v0.7.12.
*/
(function(){
  const L=window.EM811_LEGACY||{};
  const use=(name,setter)=>{try{if(typeof L[name]==='function')setter(L[name]);else console.error('em811 missing legacy function',name)}catch(e){console.error('em811 restore '+name,e)}};

  // Motor lógico original: estas funciones deciden QUÉ ocurre.
  use('simulateSegment',f=>simulateSegment=f);
  use('v062ShouldPause',f=>v062ShouldPause=f);
  use('makeMatchScenario',f=>makeMatchScenario=f);
  use('makeKeyPlay',f=>makeKeyPlay=f);
  use('makeRareEvent',f=>makeRareEvent=f);
  use('resolveMatchChoice',f=>resolveMatchChoice=f);
  use('v062Difficulty',f=>v062Difficulty=f);
  use('v062DifficultyHtml',f=>v062DifficultyHtml=f);
  use('v062FinishMiniDecision',f=>v062FinishMiniDecision=f);

  // Minijuegos exactos de la base previa a la pantalla nueva.
  use('v067ShotAim',f=>v067ShotAim=f);
  use('v067StopShot',f=>v067StopShot=f);
  use('intro79',f=>intro79=f);
  use('launch79mini',f=>launch79mini=f);
  use('track79start',f=>track79start=f);
  use('anim79track',f=>anim79track=f);
  use('stop79track',f=>stop79track=f);
  use('lane79start',f=>lane79start=f);
  use('render79lane',f=>render79lane=f);
  use('pick79lane',f=>pick79lane=f);
  use('mem79start',f=>mem79start=f);
  use('pick79mem',f=>pick79mem=f);
  use('keeper79start',f=>keeper79start=f);
  use('pick79keeper',f=>pick79keeper=f);
  use('mini79done',f=>mini79done=f);

  // El Canvas puede rematar para que el partido se vea vivo, pero NO puede inventar goles.
  // Los goles reales llegan por simulateSegment/decisiones/minijuegos y los wrappers visuales
  // v0.8.4/v0.8.5 son los que muestran la pelota entrando.
  if(typeof em80FinishFlight==='function'){
    const visualFinishBase=em80FinishFlight;
    em80FinishFlight=function(now,l=S.live){
      try{
        const f=em80State(l)?.ball?.flight;
        if(f?.kind==='shot'&&f.outcome==='goal'&&!l?.em804PlayingGoal&&!l?.em805GoalVisualActive){
          f.outcome=Math.random()<.58?'save':'wide';
        }
      }catch(e){console.warn('em811 visual shot guard',e)}
      return visualFinishBase(now,l)
    };
  }

  // La pausa nace exclusivamente del sistema anterior; nunca del generador del Motor 2D.
  em80PauseForDecision=function(l=S.live){
    if(!l)return;
    try{em80Stop()}catch(e){}
    if(!l.scenario){
      try{l.scenario=makeMatchScenario(l.stopIndex)}catch(e){console.error('em811 legacy scenario',e);return}
    }
    try{save()}catch(e){}
    return renderLiveDecision()
  };

  // Reloj visual nuevo + simulación lógica vieja. Cada minuto visible ejecuta exactamente
  // el mismo simulateSegment() que existía antes de la cancha nueva.
  em80MinuteTick=function(token){
    if(token!==EM80.token||!EM80.running||!S.live)return;
    const l=S.live,from=Number(l.minute)||0,to=Math.min(90,from+1);
    try{simulateSegment(to)}catch(e){console.error('em811 legacy segment',e);try{em80Stop()}catch(x){};return}
    if(!S.live)return;

    try{em80UpdateHud(l)}catch(e){}

    // Consecuencias grandes que ya existían antes: gol/lesión/acción específica, etc.
    if(l.v067PendingImpact){
      try{em80Stop()}catch(e){}
      return typeof v067ShowPendingImpact==='function'?v067ShowPendingImpact():undefined
    }

    // Si simulateSegment produjo un gol, v0.8.5 lo muestra en la cancha y después retoma.
    if(l.em805GoalVisualActive||(Array.isArray(l.em805GoalQueue)&&l.em805GoalQueue.length)){
      EM80.minuteTimer=0;
      return
    }

    if(to===45&&!l.halftimeShown){
      l.halftimeShown=true;try{save()}catch(e){};try{em80Stop()}catch(e){}
      return typeof v063RenderHalftime==='function'?v063RenderHalftime():undefined
    }

    if(to<90&&v062ShouldPause(l)){
      return em80PauseForDecision(l)
    }

    if(to>=90){
      try{em80Stop()}catch(e){}
      return finishRegulation()
    }

    try{save()}catch(e){}
    EM80.minuteTimer=setTimeout(()=>em80MinuteTick(token),700)
  };

  // Cualquier ruta heredada que intente "avanzar hasta la próxima decisión" entra al
  // Canvas 0.8.9. Desde ahí el tick de arriba conserva todas las circunstancias viejas.
  v063AdvanceUntilDecision=function(){
    if(!S.live)return typeof render==='function'?render():undefined;
    if(S.live.scenario)return renderLiveDecision();
    return em80RenderMatch()
  };

  // Segundo tiempo: misma pantalla nueva, misma lógica vieja.
  v063ResumeSecondHalf=function(){
    if(!S.live)return;
    try{closeModal()}catch(e){}
    return em80RenderMatch()
  };
  v061ResumeSecondHalf=v063ResumeSecondHalf;

  // Limpiar contadores del generador de decisiones 2D: ya no tienen autoridad.
  try{
    if(S?.live?.v0800?.decision){
      S.live.v0800.decision.disabledByLegacyDynamics=true;
      save()
    }
  }catch(e){}

  window.em811LegacyDynamicsBridge={version:'0.8.11',logic:'pre-v0.7.12',visual:'v0.8.9'};
})();
