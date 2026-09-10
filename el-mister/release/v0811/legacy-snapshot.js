/* ===== v0.8.11 · snapshot de la dinámica exacta anterior a la pantalla nueva ===== */
(function(){
  const names=[
    'simulateSegment','v062ShouldPause','makeMatchScenario','makeKeyPlay','makeRareEvent','resolveMatchChoice',
    'v062Difficulty','v062DifficultyHtml','v062FinishMiniDecision',
    'v067ShotAim','v067StopShot','intro79','launch79mini','track79start','anim79track','stop79track',
    'lane79start','render79lane','pick79lane','mem79start','pick79mem','keeper79start','pick79keeper','mini79done'
  ];
  const bag={};
  for(const n of names){
    try{
      const f=eval(n);
      if(typeof f==='function')bag[n]=f;
    }catch(e){console.warn('em811 capture missing',n)}
  }
  window.EM811_LEGACY=bag;
})();
