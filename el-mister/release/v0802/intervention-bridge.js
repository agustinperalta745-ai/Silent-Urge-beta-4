/* ===== El Míster v0.8.2 · fix exclusivo del puente de intervenciones =====
   NO modifica movimiento, físicas, pases, IA ni dibujo del Motor 2D.
*/
(function(){
  function em802Esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function em802ScenarioOK(s){return !!(s&&s.t&&Array.isArray(s.o)&&s.o.length>=1)}
  function em802Fallback(l){
    if(typeof em801FallbackScenario==='function')return em801FallbackScenario(l);
    let us=typeof scoreForUser==='function'?scoreForUser(l):0,them=typeof scoreAgainst==='function'?scoreAgainst(l):0,m=l?.minute||0;
    return {kind:'tactical',t:'El partido pide una decisión',d:`Minuto ${m}. El partido está ${us}-${them}.`,o:[
      {t:'Juntar líneas y cerrar espacios',h:'El equipo se ordena y protege mejor el centro.',e:{def:.014,att:-.003}},
      {t:'Presionar más arriba',h:'Buscás recuperar la pelota cerca del área rival.',e:{att:.014,def:-.005,fat:1}},
      {t:'Atacar con pases verticales',h:'Intentás acelerar cuando aparece un espacio.',e:{att:.011,def:-.003}}
    ]}
  }
  function em802DecisionVisible(){
    let root=document.getElementById('modalRoot');
    return !!(root&&root.querySelector('.em802Decision')&&root.querySelector('.choice'))
  }
  function em802SafeClub(id){
    try{return typeof club==='function'?(club(id)?.name||String(id||'')):String(id||'')}catch(e){return String(id||'')}
  }
  function em802Context(l){
    try{return typeof liveContextHtml==='function'?liveContextHtml(l):''}catch(e){console.warn('em802 context omitted',e);return''}
  }
  function em802Pitch(){
    try{return typeof em80DecisionPitchHtml==='function'?em80DecisionPitchHtml():''}catch(e){console.warn('em802 pitch omitted',e);return''}
  }
  function em802CanSub(l){
    try{return (l.subsUsed??0)<5&&(l.minute===45||l.activeSubWindowMinute===l.minute||(l.subWindows??0)<3)}catch(e){return false}
  }
  function em802Render(sc=S.live?.scenario,l=S.live){
    if(!l)return false;
    if(!em802ScenarioOK(sc))sc=em802Fallback(l);
    if(!em802ScenarioOK(sc))return false;
    l.scenario=sc;
    try{save()}catch(e){console.warn('em802 save before decision',e)}
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){console.warn('em802 stop',e)}
    let root=document.getElementById('modalRoot');if(!root)return false;
    let kind=sc.kind==='rare'?'EN CANCHA':sc.kind==='keyplay'?'JUGADA CLAVE':sc.kind==='seq79'?'JUGADA EN CURSO':'LECTURA DEL PARTIDO';
    let pill=sc.kind==='rare'?'bad':(sc.kind==='keyplay'||sc.kind==='seq79')?'warn':'';
    let options=sc.o.map((o,i)=>`<button class="choice ${(sc.kind==='keyplay'||sc.kind==='seq79')?'keyplay':''}" onclick="resolveMatchChoice(${i})"><b>${em802Esc(o?.t||'Continuar')}</b><span>${em802Esc(o?.h||'Elegí cómo resolver esta situación.')}</span></button>`).join('');
    let subs=(typeof v062OpenSubsFromDecision==='function')?`<div style="height:8px"></div><button class="secondary" onclick="v062OpenSubsFromDecision()" ${em802CanSub(l)?'':'disabled'}>🔄 Hacer cambios en esta pausa</button>`:'';
    root.innerHTML=`<div class="modalBg"><div class="modal em802Decision"><div class="liveHead"><div class="row between"><span class="minute">${Number(l.minute)||0}' · INTERVENCIÓN DEL DT</span><span class="pill ${pill}">${kind}</span></div><div class="liveScore">${Number(l.gh)||0} – ${Number(l.ga)||0}</div><div class="muted small">${em802Esc(em802SafeClub(l.home))} · ${em802Esc(em802SafeClub(l.away))}</div></div>${em802Pitch()}${em802Context(l)}<h2>${em802Esc(sc.t)}</h2><p>${em802Esc(sc.d||'Leé la jugada y elegí cómo querés que responda el equipo.')}</p>${options}${subs}<div class="small muted center" style="margin-top:9px">La cancha queda detenida solamente mientras resolvés esta situación.</div></div></div>`;
    try{setTimeout(()=>{if(typeof em80DrawDecision==='function')em80DrawDecision()},0)}catch(e){}
    return em802DecisionVisible()
  }
  function em802Ensure(l=S.live){
    if(!l?.scenario||em802DecisionVisible())return;
    console.warn('em802 watchdog: redraw intervention');
    em802Render(l.scenario,l)
  }
  function em802CreateScenario(l){
    let sc=null;
    try{sc=typeof makeMatchScenario==='function'?makeMatchScenario(l.stopIndex):null}catch(e){console.error('em802 scenario builder',e)}
    if(!em802ScenarioOK(sc)){
      try{sc=typeof _em80ScenarioBase==='function'?_em80ScenarioBase(l.stopIndex):null}catch(e){console.error('em802 legacy scenario',e)}
    }
    return em802ScenarioOK(sc)?sc:em802Fallback(l)
  }

  renderLiveDecision=function(){
    let l=S.live;if(!l)return typeof render==='function'?render():undefined;
    if(!l.scenario)return typeof v06RenderMatchHub==='function'?v06RenderMatchHub():undefined;
    em802Render(l.scenario,l);
    setTimeout(()=>em802Ensure(l),120);
    setTimeout(()=>em802Ensure(l),650)
  };

  em80PauseForDecision=function(l=S.live){
    if(!l)return;
    if(l.scenario){renderLiveDecision();return}
    try{
      if(typeof em80Stop==='function')em80Stop();
      else{
        EM80.running=false;
        if(EM80.raf){cancelAnimationFrame(EM80.raf);EM80.raf=0}
        if(EM80.minuteTimer){clearTimeout(EM80.minuteTimer);EM80.minuteTimer=0}
      }
      l.scenario=em802CreateScenario(l);
      try{save()}catch(e){}
      renderLiveDecision()
    }catch(e){
      console.error('em802 intervention bridge',e);
      l.scenario=em802Fallback(l);
      em802Render(l.scenario,l)
    }
  };

  em80EmergencyDecision=function(l=S.live){
    if(!l)return;
    if(!l.scenario)l.scenario=em802Fallback(l);
    em802Render(l.scenario,l)
  };

  try{if(S?.live?.scenario)setTimeout(()=>renderLiveDecision(),80)}catch(e){console.error('em802 migration',e)}
})();
