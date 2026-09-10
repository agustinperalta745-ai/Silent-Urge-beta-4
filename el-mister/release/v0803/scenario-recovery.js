/* ===== El Míster v0.8.3 · recuperación contextual de intervenciones =====
   Alcance: SOLO selección/recuperación de situaciones del DT.
   NO modifica Canvas, movimiento, físicas, pases, posiciones, IA 2D ni dibujo.
*/
(function(){
  function em803OK(s){return !!(s&&s.t&&Array.isArray(s.o)&&s.o.length>=1)}
  function em803Sig(s){return String(s?.key||s?.kind||'scenario')+'|'+String(s?.t||'')}
  function em803Generic(s){
    if(!em803OK(s))return true;
    let t=String(s.t||'').toLowerCase();
    if(t==='el partido está en una zona de decisiones')return true;
    if(t==='el partido pide una reacción')return true;
    if(t==='hay que administrar la ventaja')return true;
    if(t==='el partido pide una decisión')return true;
    if(t==='el partido pide una corrección')return true;
    let os=(s.o||[]).map(o=>String(o?.t||'').toLowerCase()).join('|');
    return /atacar por las bandas y subir laterales/.test(os)&&/controlar el mediocampo y tener la pelota/.test(os)&&/acelerar con pases verticales/.test(os)
  }
  function em803History(l){l.em803ScenarioHistory??=[];return l.em803ScenarioHistory}
  function em803Recent(l,s){
    if(!em803OK(s)||s.kind==='seq79'||s.kind==='keyplay'||s.kind==='rare')return false;
    return em803History(l).slice(-3).includes(em803Sig(s))
  }
  function em803Remember(l,s){let h=em803History(l),sig=em803Sig(s);h.push(sig);if(h.length>12)h.splice(0,h.length-12)}
  function em803Try(l,fn,label){
    try{
      let s=fn();
      if(em803OK(s)&&!em803Generic(s)&&!em803Recent(l,s))return s
    }catch(e){console.warn('em803 '+label,e)}
    return null
  }
  function em803BallContext(l){
    let out={team:null,zone:null,side:null};
    try{
      let s=typeof em80State==='function'?em80State(l):null,b=s?.ball;
      out.team=b?.ownerTeam||b?.lastTeam||null;
      out.zone=out.team&&typeof em80Zone==='function'?em80Zone(out.team,b.y):null;
      out.side=b&&typeof em80Side==='function'?em80Side(b.x):null
    }catch(e){}
    return out
  }
  function em803Tired(){
    try{
      let a=typeof v06LiveLineup==='function'?v06LiveLineup():typeof bestXI==='function'?bestXI():[];
      if(!a?.length)return null;
      let energy=p=>{try{return typeof v061EnergyOf==='function'?v061EnergyOf(p):(p.fitness??75)}catch(e){return p.fitness??75}};
      let p=[...a].sort((x,y)=>energy(x)-energy(y))[0];
      return {p,e:energy(p)}
    }catch(e){return null}
  }
  function em803Connected(l){
    if(typeof start79!=='function'||typeof seq79!=='function')return null;
    let b=em803BallContext(l),flow=l.flow||{},tired=em803Tired();
    try{
      if(b.team==='us'&&b.zone==='Último tercio'){
        if(b.side&&b.side!=='centro'){start79('wide');return seq79('wide',{back:typeof back79==='function'?back79():null})}
        if(typeof v067OffensiveScenario==='function'){
          let x=v067OffensiveScenario();if(em803OK(x))return x
        }
      }
      if(b.team==='them'&&b.zone==='Último tercio'){
        start79('counterdef');return seq79('counterdef',{back:typeof back79==='function'?back79():null})
      }
      if(b.team==='us'&&b.zone==='Salida'&&(flow.oppThreat||0)>(flow.userThreat||0)+.25){
        start79('pressout');return seq79('pressout',{back:typeof back79==='function'?back79():null})
      }
      if(tired&&tired.e<58&&(l.minute||0)>=58){
        start79('tiredwing');return seq79('tiredwing',{back:typeof back79==='function'?back79():{p:tired.p,e:tired.e}})
      }
    }catch(e){console.warn('em803 connected play',e)}
    return null
  }
  function em803Pool(l){
    let us=typeof scoreForUser==='function'?scoreForUser(l):(l.isHome?l.gh:l.ga),them=typeof scoreAgainst==='function'?scoreAgainst(l):(l.isHome?l.ga:l.gh),m=l.minute||0,gap=us-them,flow=l.flow||{},ctx=l.context||{},b=em803BallContext(l),c=[],tired=em803Tired();
    let yc=flow.userCards?.[0];
    if(yc)c.push({key:'em803_booked',kind:'tactical',t:`${yc.name||'Tu defensor'} está condicionado por la amarilla`,d:`${m}' · El rival detectó la amarilla y empieza a buscar ese duelo.`,o:[{t:'Darle una cobertura cercana',h:'Un compañero queda preparado para ayudar en ese sector.',e:{def:.014,fat:1},set:'coverBooked'},{t:'Pedirle que temporice y no se tire al piso',h:'Defiende con más paciencia para evitar una segunda amarilla.',e:{def:.009,att:-.003},set:'lowBlock'},{t:'Mantener la intensidad en el duelo',h:'No cedés terreno, pero sigue existiendo riesgo disciplinario.',e:{def:.007,att:.004},set:'aggressiveBooked'}]});
    if(ctx.fullbacksHigh)c.push({key:'em803_fullback_space',kind:'tactical',t:'El rival empieza a encontrar la espalda de tus laterales',d:`${m}' · Cada pérdida deja metros libres por afuera y la cobertura está llegando tarde.`,o:[{t:'Bajar a los laterales unos metros',h:'Cerrás la espalda y resignás parte de la amplitud.',e:{att:-.005,def:.017},set:'lowBlock'},{t:'Que un volante cubra las bandas',h:'Mantenés los laterales altos con una ayuda por detrás.',e:{def:.013,fat:1},set:'coverFlanks'},{t:'Seguir atacando con ellos',h:'Conservás la amenaza exterior, aceptando el riesgo de la transición.',e:{att:.010,def:-.006},set:'fullbacksHigh'}]});
    if((flow.oppThreat||0)>(flow.userThreat||0)+.6)c.push({key:'em803_pressure',kind:'tactical',t:'Te cuesta salir de la presión rival',d:`${m}' · El rival viene recuperando rápido y tu primera salida queda encerrada.`,o:[{t:'Juntar apoyos y salir corto',h:'Buscás superar la primera presión con pases cercanos.',e:{att:.006,def:.008},set:'possession'},{t:'Saltar la presión con un pase largo',h:'Buscás al delantero para ganar la segunda pelota.',e:{att:.013,def:-.003},set:'direct'},{t:'Bajar un volante para ofrecer salida',h:'Sumás un receptor por detrás de la presión.',e:{att:.005,def:.013,fat:1},set:'holdPosition'}]});
    if((flow.userThreat||0)>(flow.oppThreat||0)+.6)c.push({key:'em803_pin',kind:'tactical',t:'Lo tenés al rival defendiendo muy cerca de su área',d:`${m}' · Tu equipo acumula gente arriba, pero falta encontrar el último pase.`,o:[{t:'Insistir con desborde y pase atrás',h:'Buscás llegar a línea de fondo para encontrar al que entra de frente.',e:{att:.015,def:-.003},set:'fullbacksHigh'},{t:'Moverla de lado a lado hasta abrir un hueco',h:'Tenés paciencia para desordenar la última línea.',e:{att:.008,def:.009},set:'possession'},{t:'Probar desde la medialuna',h:'Terminás la jugada antes de que el rival pueda salir de contra.',e:{att:.011,def:.004},set:'shootMore'}]});
    if(gap>0&&m>=62)c.push({key:'em803_lead',kind:'tactical',t:'El rival adelanta gente y empieza a dejar espacios',d:`${m}' · Ganás ${us}-${them}. Ellos arriesgan más y cada recuperación puede convertirse en una contra.`,o:[{t:'Guardar la pelota y hacerlos correr',h:'Bajás el ritmo y obligás al rival a perseguir.',e:{att:-.003,def:.014},set:'possession'},{t:'Cerrar por dentro y proteger el área',h:'Priorizás que no reciban cómodos entre líneas.',e:{att:-.007,def:.020},set:'lowBlock'},{t:'Dejar una salida rápida para la contra',h:'Defendés con orden, pero mantenés una amenaza arriba.',e:{att:.014,def:.005},set:'direct'}]});
    if(gap<0)c.push({key:'em803_chase',kind:'tactical',t:'El rival se cierra y te obliga a encontrar otra forma de entrar',d:`${m}' · Perdés ${us}-${them} y ya no te regalan espacios por el centro.`,o:[{t:'Abrir bien la cancha y cargar el área',h:'Buscás centros y segundas jugadas con más gente cerca del arco.',e:{att:.019,def:-.009,fat:1},set:'fullbacksHigh'},{t:'Presionar la salida después de cada pérdida',h:'Querés recuperar arriba antes de que puedan respirar.',e:{att:.021,def:-.010,fat:2},set:'pressHigh'},{t:'Acelerar con paredes por dentro',h:'Intentás romper el bloque sin desordenarte por completo.',e:{att:.015,def:-.003},set:'controlledAttack'}]});
    if(tired&&tired.e<66&&m>=55)c.push({key:'em803_tired',kind:'tactical',playerId:tired.p?.id,t:`${tired.p?.name||'Un titular'} empieza a llegar tarde a las jugadas`,d:`${m}' · El cansancio ya se nota en los retrocesos y las coberturas.`,o:[{t:'Bajarle el ritmo y darle una función más fija',h:'Reduce recorridos para sostenerlo algunos minutos más.',e:{att:-.004,def:.009,fat:-1},set:'holdPosition'},{t:'Que un compañero lo ayude en su sector',h:'Repartís el esfuerzo para que no quede expuesto.',e:{def:.012,fat:1},set:'coverFlanks'},{t:'Exigirle que mantenga el ritmo',h:'Conservás el plan, pero puede volver a llegar tarde.',e:{att:.006,def:-.005,fat:1}}]});
    if(b.team==='us'&&b.zone==='Progresión')c.push({key:'em803_striker',kind:'tactical',t:'Tu delantero queda demasiado aislado entre los centrales',d:`${m}' · La pelota progresa, pero cuando levantás la cabeza el 9 está solo y sin una descarga cercana.`,o:[{t:'Acercar al mediapunta',h:'Le das una opción corta para descargar y girar la jugada.',e:{att:.013,def:.002},set:'controlledAttack'},{t:'Pedir diagonales a los extremos',h:'Buscás arrastrar marcas y abrirle espacio al delantero.',e:{att:.014,def:-.002},set:'diagonal'},{t:'Jugar directo y atacar la segunda pelota',h:'Aceptás el duelo aéreo y preparás gente para recoger el rebote.',e:{att:.011,def:-.004,fat:1},set:'direct'}]});
    if(b.team==='them'&&b.zone==='Progresión')c.push({key:'em803_midfield_gap',kind:'tactical',t:'El mediocampo empieza a quedar partido',d:`${m}' · El rival encuentra pases entre tus volantes y la última línea tiene que salir demasiado lejos.`,o:[{t:'Juntar las líneas',h:'Reducís el espacio entre mediocampo y defensa.',e:{att:-.004,def:.017},set:'lowBlock'},{t:'Que el volante central salte al receptor',h:'Intentás cortar el pase antes de que puedan girar.',e:{def:.012,fat:1},set:'pressHigh'},{t:'Mantener la altura y tapar líneas de pase',h:'No retrocedés, pero priorizás cerrar receptores interiores.',e:{att:.003,def:.011},set:'coverFlanks'}]});
    if(!c.length||b.zone==null)c.push({key:'em803_shape',kind:'tactical',t:'Las líneas se estiran y el partido empieza a jugarse de ida y vuelta',d:`${m}' · Está ${us}-${them}. Cada pérdida encuentra a los dos equipos separados.`,o:[{t:'Acortar el equipo alrededor de la pelota',h:'Reducís distancias para recuperar más rápido.',e:{att:.004,def:.013},set:'controlledAttack'},{t:'Bajar el ritmo y asegurar cada pase',h:'Buscás cortar el ida y vuelta con posesión.',e:{att:.002,def:.011},set:'possession'},{t:'Aprovechar el partido abierto y atacar rápido',h:'Intentás llegar antes de que el rival vuelva a ordenarse.',e:{att:.015,def:-.006,fat:1},set:'direct'}]});
    let recent=new Set(em803History(l).slice(-4)),fresh=c.filter(x=>!recent.has(em803Sig(x)));
    return fresh.length?fresh:c
  }
  function em803Create(l){
    let sc=em803Try(l,()=>em803Connected(l),'connected');
    if(sc)return sc;
    sc=em803Try(l,()=>typeof makeMatchScenario==='function'?makeMatchScenario(l.stopIndex):null,'current builder');
    if(sc)return sc;
    for(let pair of [[typeof _79sc==='function'?_79sc:null,'v079'],[typeof _v0714ScenarioBase==='function'?_v0714ScenarioBase:null,'v0714'],[typeof _em80ScenarioBase==='function'?_em80ScenarioBase:null,'v0800']]){
      if(!pair[0])continue;sc=em803Try(l,()=>pair[0](l.stopIndex),pair[1]);if(sc)return sc
    }
    let pool=em803Pool(l);return pool[Math.floor(Math.random()*pool.length)]
  }
  function em803Show(sc,l=S.live){
    if(!l||!em803OK(sc))return false;
    l.scenario=sc;em803Remember(l,sc);
    try{save()}catch(e){}
    if(typeof em802Render==='function')return em802Render(sc,l);
    try{renderLiveDecision();return true}catch(e){console.error('em803 render',e);return false}
  }
  const em803OldPause=em80PauseForDecision;
  em80PauseForDecision=function(l=S.live){
    if(!l)return;
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    if(l.scenario&&!em803Generic(l.scenario)){
      em803Remember(l,l.scenario);return renderLiveDecision()
    }
    l.scenario=null;
    let sc=em803Create(l);
    if(em803Show(sc,l))return;
    console.warn('em803 direct render failed; using previous pause renderer with contextual scenario');
    l.scenario=sc;
    try{return renderLiveDecision()}catch(e){console.error('em803 final render',e);return em803OldPause?.(l)}
  };
  em80EmergencyDecision=function(l=S.live){
    if(!l)return;
    if(!l.scenario||em803Generic(l.scenario))l.scenario=em803Create(l);
    em803Remember(l,l.scenario);
    try{return renderLiveDecision()}catch(e){console.error('em803 emergency',e)}
  };
  try{
    if(S?.live?.scenario&&em803Generic(S.live.scenario)){
      S.live.scenario=em803Create(S.live);em803Remember(S.live,S.live.scenario);save();setTimeout(()=>renderLiveDecision(),40)
    }
  }catch(e){console.error('em803 migration',e)}
})();
