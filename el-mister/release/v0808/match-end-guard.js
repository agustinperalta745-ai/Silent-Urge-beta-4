/* ===== El Míster v0.8.8 · cierre de partido con silbatazo y guardia anti-final prematuro =====
   - Un partido normal no puede finalizar antes de llegar realmente a 90'.
   - Evita dobles cierres disparados por callbacks viejos de decisiones/minijuegos.
   - Al llegar al final se congela el Motor 2D y se muestra un cierre visible antes del resultado.
*/
(function(){
  const finish808Base=finishLiveMatch;
  const regulation808Base=finishRegulation;

  function em808Score(l){
    try{return `${Number(l?.gh)||0} – ${Number(l?.ga)||0}`}catch(e){return '—'}
  }
  function em808CanActuallyEnd(l){
    if(!l)return false;
    if(l.pens)return true;
    const minute=Number(l.minute)||0;
    // En tiempo reglamentario el único cierre válido es desde 90'.
    // En prórroga simulateSegment deja el reloj en 120'.
    return minute>=90;
  }
  function em808ResumeAfterBlockedFinish(l){
    if(!l||S.live!==l)return;
    l.em808Finishing=false;
    try{save()}catch(e){}
    setTimeout(()=>{
      if(S.live===l&&!l.scenario){
        try{runNextStop()}catch(e){console.error('em808 resume after blocked finish',e)}
      }
    },80)
  }

  finishLiveMatch=function(){
    const l=S.live;
    // Si el partido ya fue cerrado, dejamos actuar al protector de resultado de v0.8.7.
    if(!l)return finish808Base();

    // Guardia principal: ningún callback viejo puede mandar al postpartido antes de 90'.
    if(!em808CanActuallyEnd(l)){
      console.warn('em808 blocked premature finish at',l.minute);
      em808ResumeAfterBlockedFinish(l);
      return;
    }

    // Un solo cierre por partido aunque queden callbacks pendientes.
    if(l.em808Finishing)return;
    l.em808Finishing=true;
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    try{save()}catch(e){}

    // En penales/prórroga también se muestra el cierre, pero nunca antes de resolverlos.
    const extra=(Number(l.minute)||0)>90;
    const title=extra?'FINAL TRAS LA PRÓRROGA':'FINAL DEL PARTIDO';
    const text=extra?`Se terminó. Marcador: ${em808Score(l)}.`:`El árbitro marca el final a los ${Number(l.minute)||90}'. Marcador: ${em808Score(l)}.`;

    const complete=()=>{
      if(!S.live||S.live!==l)return;
      try{finish808Base()}catch(e){
        console.error('em808 finish base',e);
        l.em808Finishing=false;
        try{save()}catch(x){}
      }
    };

    // No saltar directamente de la cancha al postpartido: primero hay cierre visible.
    try{
      showConsequence({
        type:'info',icon:'🏁',title,text,effects:['Partido terminado'],duration:1700,onDone:complete
      });
    }catch(e){complete()}
  };

  finishRegulation=function(){
    const l=S.live;
    if(!l)return;
    // Refuerzo por si alguna ruta heredada intenta terminar el encuentro antes de tiempo.
    if((Number(l.minute)||0)<90){
      console.warn('em808 blocked premature regulation at',l.minute);
      return em808ResumeAfterBlockedFinish(l);
    }
    return regulation808Base();
  };

  // Migración segura para partidas que quedaron guardadas durante una transición de pantalla.
  try{
    if(S?.live){
      S.live.em808Finishing=false;
      save();
    }
  }catch(e){console.warn('em808 migration',e)}

  window.em808MatchEndGuard=true;
})();
