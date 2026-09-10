/* ===== El Míster v0.8.9 · verdad visual de la jugada =====
   Alcance deliberadamente mínimo:
   - NO cambia el Motor 2D, decisiones, minijuegos, goles, reloj ni cierre de partido.
   - Una intervención congela y dibuja el estado REAL que ya tenía el Motor 2D.
   - Se desactiva el viejo "staging" que movía jugadores/pelota para fabricar escenas.
   - Sólo reinicios reales (penal, córner y tiro libre) pueden preparar una colocación específica.
*/
(function(){
  function em809SceneType(sc){
    try{
      return (typeof window.em804SceneType==='function') ? window.em804SceneType(sc) : null;
    }catch(e){
      console.warn('em809 scene type',e);
      return null;
    }
  }

  function em809IsRealRestart(sc){
    if(!sc)return false;
    /* Las decisiones creadas por la lógica de zona ya nacen de la posición real de la pelota. */
    if(sc.em806ZoneKey)return false;
    const type=em809SceneType(sc);
    return type==='penalty'||type==='corner'||type==='freekick';
  }

  function em809DrawDecisionTruth(){
    const l=(typeof S!=='undefined'&&S)?S.live:null;
    const canvas=document.getElementById('em80DecisionCanvas');
    if(!canvas||!l)return;

    const sc=l.scenario;
    if(sc&&em809IsRealRestart(sc)&&typeof window.em804StageScenario==='function'){
      /* Penal/córner/tiro libre sí son una nueva puesta en juego y necesitan su posición reglamentaria. */
      try{window.em804StageScenario(sc,l)}catch(e){console.warn('em809 restart stage',e)}
    }else{
      /* Muy importante: acá NO se tocan x/y, dueño de pelota, trayectorias ni posiciones. */
      l.em804Scene=null;
      l.em804SceneStamp=null;
    }

    if(typeof em80Draw==='function')em80Draw(canvas,l);
  }

  /* v0.8.4 había envuelto esta función y teletransportaba la escena antes de dibujarla.
     Al sobrescribir únicamente este hook, el resto del motor permanece intacto. */
  em80DrawDecision=em809DrawDecisionTruth;

  window.em809AnimationTruth={
    drawDecision:em809DrawDecisionTruth,
    isRealRestart:em809IsRealRestart,
    version:'0.8.9'
  };
})();
