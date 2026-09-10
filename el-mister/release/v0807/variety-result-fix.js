/* ===== El Míster v0.8.7 · variedad contextual + resultado protegido =====
   - Mantiene "la cancha manda": posesión y zona reales filtran las decisiones.
   - Recupera variedad de jugadas, remates y lecturas sin volver a inventar escenas.
   - Impide que callbacks tardíos de minijuegos/animaciones tapen el resultado final.
*/
(function(){
  const choice=(t,h,extra={})=>Object.assign({t,h},extra);
  const mark=(s,c,key)=>Object.assign(s,{key,em806ZoneKey:c.key,em807:true});
  const chain=k=>{try{if(typeof start79==='function')start79(k)}catch(e){}};

  function context(l=S.live){
    try{return typeof em806ZoneContext==='function'?em806ZoneContext(l):null}catch(e){return null}
  }
  function ownerName(c){return c?.owner?.name||(c?.poss==='us'?'Tu jugador':'El rival')}
  function pickFresh(l,c,items){
    l.em807UsedScenarioKeys??=[];
    const zoneKey=c?.key||'unknown';
    const fresh=items.filter(x=>!l.em807UsedScenarioKeys.includes(`${zoneKey}:${x.k}`));
    const pool=fresh.length?fresh:items;
    const hit=pool[Math.floor(Math.random()*pool.length)]||items[0];
    l.em807UsedScenarioKeys.push(`${zoneKey}:${hit.k}`);
    if(l.em807UsedScenarioKeys.length>18)l.em807UsedScenarioKeys.splice(0,l.em807UsedScenarioKeys.length-18);
    return hit.f()
  }

  function tacticalContext(l,c){
    const us=scoreForUser(l),them=scoreAgainst(l),m=l.minute||0;
    if(m>=67&&us<them&&Math.random()<.26){
      return mark({kind:'tactical',t:'Necesitás empujar el partido sin perder la forma',d:`${m}' · Estás ${us}-${them}. La situación de la cancha sigue siendo la misma, pero el equipo necesita asumir un poco más de riesgo.`,o:[
        choice('Adelantar la presión','Buscás recuperar más arriba y acelerar el siguiente ataque.',{e:{att:.017,def:-.006,fat:1},set:'pressHigh'}),
        choice('Sumar gente por delante de la pelota','Ganás presencia ofensiva, dejando menos cobertura.',{e:{att:.020,def:-.010,fat:1},set:'extraForward'}),
        choice('Atacar con paciencia','Movés al rival sin romper el bloque de golpe.',{e:{att:.010,def:.005},set:'controlledAttack'})
      ]},c,'em807_chasing');
    }
    if(m>=70&&us>them&&Math.random()<.24){
      return mark({kind:'tactical',t:'El resultado empieza a pesar',d:`${m}' · Ganás ${us}-${them}. Podés administrar la ventaja sin desconectar lo que está pasando en la cancha.`,o:[
        choice('Juntar líneas y cerrar el centro','Reducís espacios entre volantes y defensores.',{e:{att:-.006,def:.018},set:'lowBlock'}),
        choice('Dormir el partido con pelota','Bajás el ritmo y obligás al rival a correr.',{e:{att:-.002,def:.012,fat:-1},set:'possession'}),
        choice('Seguir buscando otro gol','Mantenés amenaza sin lanzarte con todo.',{e:{att:.011,def:.002},set:'controlledAttack'})
      ]},c,'em807_manage_lead');
    }
    if(m>=72&&us===them&&Math.random()<.22){
      return mark({kind:'tactical',t:'Entrás en la zona de definición del partido',d:`${m}' · Está ${us}-${them}. La próxima decisión puede cambiar cómo se juega el tramo final.`,o:[
        choice('Ir a buscarlo','Adelantás líneas y asumís más riesgo.',{e:{att:.018,def:-.009,fat:1},set:'pressHigh'}),
        choice('Atacar con equilibrio','Buscás el gol sin partir el equipo.',{e:{att:.010,def:.007},set:'controlledAttack'}),
        choice('No regalar la transición','Priorizás que una pérdida no te deje abierto.',{e:{att:-.004,def:.016},set:'lowBlock'})
      ]},c,'em807_late_tie');
    }
    return null
  }

  function userDefensive(l,c){
    const p=ownerName(c),m=l.minute;
    return pickFresh(l,c,[
      {k:'base_exit',f:()=>{chain('em807_exit');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:`${p} recibe con presión cerca de tu área`,d:`${m}' · Estás saliendo desde tu propio tercio. Primero hay que superar la primera presión.`,o:[
        choice('Encontrar al hombre libre','Resolvé la salida corta antes de que cierre la presión.',{mini:'playout',ok:'inside'}),
        choice('Jugar largo y pelear la segunda','Sacás la pelota de la zona de riesgo.',{a:'second'}),
        choice('Abrir rápido hacia el lateral','Buscás progresar por afuera sin rifarla.',{mini:'through',ok:'wide'})
      ]},c,'em807_exit_base')}},
      {k:'press_escape',f:()=>{chain('em807_press_escape');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:'El rival te encierra la salida',d:`${m}' · Tenés la pelota en campo propio y dos rivales saltan sobre el poseedor.`,o:[
        choice('Salir tocando bajo presión','Tenés que detectar el pase libre a tiempo.',{mini:'playout',ok:'inside'}),
        choice('Cambiar de frente','Buscás el sector menos cargado antes de que cierre.',{mini:'through',ok:'wide'}),
        choice('Saltar la presión con pelota larga','Buscás ganar la segunda jugada en mitad de cancha.',{a:'second'})
      ]},c,'em807_press_escape')}},
      {k:'first_pass',f:()=>{chain('em807_first_pass');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:'Recuperaste y el primer pase decide la salida',d:`${m}' · La pelota quedó en tu tercio y el rival todavía tiene gente cerca.`,o:[
        choice('Pase vertical al mediocampo','Intentás superar una línea con el primer toque.',{mini:'through',ok:'inside'}),
        choice('Apoyo corto y volver a empezar','Asegurás la posesión y reordenás al equipo.',{mini:'playout',ok:'inside'}),
        choice('Buscar al extremo de primera','Querés sacar al equipo por afuera.',{mini:'through',ok:'wide'})
      ]},c,'em807_first_pass') }}
    ])
  }

  function userMidfield(l,c){
    const p=ownerName(c),m=l.minute;
    return pickFresh(l,c,[
      {k:'base_mid',f:()=>{chain('em807_mid');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:`${p} conduce en mitad de cancha`,d:`${m}' · Todavía no estás en zona de remate. La jugada pide elegir cómo superar el mediocampo rival.`,o:[
        choice('Filtrar entre líneas','Buscás un receptor de frente.',{mini:'through',ok:'inside'}),
        choice('Abrir hacia la banda','Movés la jugada al costado para avanzar con espacio.',{a:'wide'}),
        choice('Jugar directo a la segunda pelota','Saltás una línea e intentás atacar desde la caída.',{a:'second'})
      ]},c,'em807_mid_base')}},
      {k:'transition',f:()=>{chain('em807_transition');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:'Recuperaste en el medio y el rival está volviendo',d:`${m}' · Hay una ventana para acelerar, pero todavía falta entrar en zona de definición.`,o:[
        choice('Pase filtrado antes de que se ordenen','Si encontrás el carril, la jugada puede romper la última línea.',{mini:'through',ok:'finish'}),
        choice('Abrir al extremo que arranca','Buscás ganar metros por afuera.',{a:'wide'}),
        choice('Asegurar el segundo pase','Preferís sostener el ataque y no perderla enseguida.',{mini:'playout',ok:'inside'})
      ]},c,'em807_mid_transition')}},
      {k:'closed_center',f:()=>{chain('em807_closed_center');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:'El rival te cierra el pasillo central',d:`${m}' · La pelota sigue en la mitad. Hay que crear el espacio antes de pensar en rematar.`,o:[
        choice('Cambiar la orientación','Buscás el lado débil del bloque.',{mini:'through',ok:'wide'}),
        choice('Juntar pases por dentro','Intentás atraer marcas y liberar a un compañero.',{mini:'playout',ok:'inside'}),
        choice('Buscar al delantero y la segunda jugada','Acelerás sin inventar un remate desde una zona imposible.',{a:'second'})
      ]},c,'em807_mid_closed')}},
      {k:'carry_forward',f:()=>{chain('em807_carry');return mark({kind:'seq79',stage:1,playerId:c.owner?.id,t:`${p} encuentra metros para avanzar`,d:`${m}' · El rival retrocede y el último tercio empieza a abrirse delante tuyo.`,o:[
        choice('Conducir y fijar a un rival','Avanzás hasta provocar un duelo antes del área.',{a:'duel'}),
        choice('Soltarla al costado','Buscás llegar al último tercio con amplitud.',{a:'wide'}),
        choice('Filtrar al espacio','Intentás dejar a un atacante de cara al arco.',{mini:'through',ok:'finish'})
      ]},c,'em807_mid_carry')}}
    ])
  }

  function userAttacking(l,c){
    const p=ownerName(c),m=l.minute;
    const items=[];
    if(c.depth==='box'&&c.side==='center')items.push({k:'box_finish',f:()=>{chain('em807_box_finish');return mark({kind:'seq79',stage:5,playerId:c.owner?.id,t:`${p} recibe dentro del área`,d:`${m}' · Ahora sí estás en zona de definición y la marca llega encima.`,o:[
      choice('Rematar de primera','El contacto tiene que salir antes del cierre.',{mini:'first',goal:1}),
      choice('Controlar y perfilarse','Buscás mejorar el ángulo antes de patear.',{a:'shot'}),
      choice('Pase atrás al que llega','Buscás una definición de frente.',{mini:'passback',ok:'first'})
    ]},c,'em807_box_finish')}});
    if(c.side!=='center')items.push(
      {k:'wing_duel',f:()=>{chain('em807_wing_duel');return mark({kind:'seq79',stage:3,playerId:c.owner?.id,t:`${p} encara por ${c.side==='left'?'izquierda':'derecha'} cerca del área`,d:`${m}' · Estás en el último tercio. El duelo puede terminar en centro, remate o falta.`,o:[
        choice('Ir hasta la línea de fondo','Buscás ganar el uno contra uno y centrar.',{mini:'dribble',ok:'line'}),
        choice('Enganchar hacia adentro','Querés abrir un ángulo de remate.',{mini:'dribble',ok:'shot'}),
        choice('Buscar el contacto','Protegés la pelota para provocar una falta peligrosa.',{contact:2})
      ]},c,'em807_wing_duel')}},
      {k:'wing_delivery',f:()=>{chain('em807_wing_delivery');return mark({kind:'seq79',stage:4,playerId:c.owner?.id,t:'Tenés tiempo para elegir el último pase desde la banda',d:`${m}' · Hay movimientos dentro del área y una segunda línea llegando.`,o:[
        choice('Centro al área','Elegí dónde cae el envío.',{mini:'cross',ok:'first'}),
        choice('Pase atrás','Buscás al compañero que llega de frente.',{mini:'passback',ok:'first'}),
        choice('Jugar hacia adentro','Reciclás la jugada para atacar por el centro.',{a:'inside'})
      ]},c,'em807_wing_delivery')}}
    );
    if(c.side==='center')items.push(
      {k:'shooting_window',f:()=>{chain('em807_shooting');return mark({kind:'seq79',stage:3,playerId:c.owner?.id,t:`${p} recibe de frente al arco`,d:`${m}' · Estás cerca del área rival: acá sí existe una ventana real para patear.`,o:[
        choice('Patear al arco','Intentás terminar la jugada antes del cierre.',{mini:'first',goal:1}),
        choice('Filtrar al delantero','Buscás romper la última línea con un pase.',{mini:'through',ok:'finish'}),
        choice('Abrir para el extremo','Buscás mejorar el ángulo desde un costado.',{a:'wide'})
      ]},c,'em807_shooting_window')}},
      {k:'wall_pass',f:()=>{chain('em807_wall_pass');return mark({kind:'seq79',stage:3,playerId:c.owner?.id,t:'La defensa se junta delante del área',d:`${m}' · Tenés la pelota en zona de ataque y necesitás fabricar el hueco.`,o:[
        choice('Tocar y buscar devolución','Intentás entrar por dentro con una combinación rápida.',{mini:'playout',ok:'shot'}),
        choice('Pase filtrado al espacio','Buscás dejar a un compañero para definir.',{mini:'through',ok:'finish'}),
        choice('Probar el remate','Si conectás limpio, la jugada termina en el arco.',{mini:'first',goal:1})
      ]},c,'em807_wall_pass')}}
    );
    if(c.depth==='box'&&c.side!=='center')items.push({k:'byline',f:()=>{chain('em807_byline');return mark({kind:'seq79',stage:4,playerId:c.owner?.id,t:`${p} llega muy cerca de la línea de fondo`,d:`${m}' · Estás al costado del área con compañeros entrando a zona de remate.`,o:[
      choice('Pase atrás','Buscás al que llega de frente.',{mini:'passback',ok:'first'}),
      choice('Centro fuerte','Elegí la zona del envío.',{mini:'cross',ok:'first'}),
      choice('Proteger y buscar la falta','El defensor llega lanzado.',{contact:2})
    ]},c,'em807_byline')}});
    if(!items.length)items.push({k:'entry',f:()=>{chain('em807_entry');return mark({kind:'seq79',stage:3,playerId:c.owner?.id,t:'Entrás al último tercio con la pelota controlada',d:`${m}' · Ya podés transformar la posesión en una ocasión clara.`,o:[
      choice('Buscar el remate','Intentás finalizar desde una posición posible.',{mini:'first',goal:1}),
      choice('Filtrar al delantero','Buscás dejarlo de cara al arco.',{mini:'through',ok:'finish'}),
      choice('Abrir a la banda','Querés llegar por afuera y centrar.',{a:'wide'})
    ]},c,'em807_entry')}});
    return pickFresh(l,c,items)
  }

  function opponentBuild(l,c){
    const m=l.minute;
    return pickFresh(l,c,[
      {k:'press_build',f:()=>{chain('em807_press_build');return mark({kind:'seq79',stage:1,t:'El rival intenta salir desde su campo',d:`${m}' · La pelota la tiene el rival cerca de su área. No corresponde patear: decidís cómo orientar la presión.`,o:[
        choice('Presionar arriba','Intentás robar cerca de su área.',{mini:'press',ok:'inside'}),
        choice('Tapar el pase interior','Lo obligás a salir por afuera.',{e:{def:.008,att:.006},end:'reform'}),
        choice('Esperar en mitad de cancha','Mantenés el bloque listo para recuperar.',{e:{def:.010},end:'reform'})
      ]},c,'em807_press_build')}},
      {k:'trap_side',f:()=>{chain('em807_trap_side');return mark({kind:'seq79',stage:1,t:'El rival busca el primer pase para salir',d:`${m}' · Todavía está lejos de tu arco. Podés intentar condicionar por dónde progresa.`,o:[
        choice('Saltar sobre el receptor','Buscás cortar la salida antes de que gane metros.',{mini:'press',ok:'inside'}),
        choice('Cerrar el centro y regalar la banda','Querés que avance por una zona más previsible.',{e:{def:.010,att:.004},end:'reform'}),
        choice('Retroceder y armar el bloque','No arriesgás una presión rota tan lejos de tu arco.',{e:{def:.012},end:'reform'})
      ]},c,'em807_trap_side')}}
    ])
  }

  function opponentMidfield(l,c){
    const m=l.minute;
    return pickFresh(l,c,[
      {k:'mid_block',f:()=>{chain('em807_them_mid');return mark({kind:'seq79',stage:1,t:'El rival intenta romper tu mediocampo',d:`${m}' · La pelota está en la zona central. Todavía no es una emergencia de área.`,o:[
        choice('Saltar a presionar','Intentás recuperar antes de que entre en tu campo.',{mini:'press',ok:'safe',fail:'counterdef'}),
        choice('Cerrar líneas de pase','Juntás el bloque y lo obligás a jugar hacia afuera.',{end:'reform'}),
        choice('Replegar detrás de la pelota','Priorizás no dejar espacios entre líneas.',{end:'reform'})
      ]},c,'em807_them_mid')}},
      {k:'between_lines',f:()=>{chain('em807_between_lines');return mark({kind:'seq79',stage:1,t:'Un rival recibe entre tus líneas',d:`${m}' · Está todavía fuera de la zona de remate, pero puede girar y acelerar hacia tu defensa.`,o:[
        choice('Ir al cruce','Intentás quitarle la pelota antes de que gire.',{mini:'tackle',ok:'safe',fail:'counterdef'}),
        choice('Encimarlo sin lanzarte','Lo presionás para que juegue hacia atrás.',{mini:'press',ok:'safe',fail:'counterdef'}),
        choice('Cerrar el pase hacia adelante','Replegás unos metros y protegés el centro.',{end:'reform'})
      ]},c,'em807_between_lines')}},
      {k:'wide_progression',f:()=>{chain('em807_wide_progress');return mark({kind:'seq79',stage:1,t:'El rival progresa por un costado en mitad de cancha',d:`${m}' · Todavía no llegó a tu área, pero está ganando metros por afuera.`,o:[
        choice('Presionarlo contra la línea','Intentás encerrarlo antes de que avance.',{mini:'press',ok:'safe',fail:'counterdef'}),
        choice('Que el lateral espere','No salís de zona y protegés la espalda.',{e:{def:.010},end:'reform'}),
        choice('Mandar una ayuda del volante','Cerrás el dos contra uno sin romper el centro.',{e:{def:.012,fat:1},end:'reform'})
      ]},c,'em807_wide_progress')}}
    ])
  }

  function opponentDefensive(l,c){
    const m=l.minute;
    const items=[];
    if(c.depth==='box')items.push({k:'box_emergency',f:()=>{chain('em807_box_def');return mark({kind:'seq79',stage:2,t:'El rival entra en tu área',d:`${m}' · La pelota ya está en zona de definición. La emergencia es real.`,o:[
      choice('Salir al cruce','Buscás bloquear antes del remate.',{mini:'tackle',ok:'safe',fail:'keeper'}),
      choice('Cerrar el pase al medio','Protegés la zona central del área.',{end:'reform'}),
      choice('Aguantar con el arquero','Si remata, el arquero tendrá que leer la definición.',{mini:'keeper',save:1})
    ]},c,'em807_box_emergency')}});
    if(c.side!=='center')items.push({k:'cross_danger',f:()=>{chain('em807_cross_def');return mark({kind:'seq79',stage:2,t:'El rival llega por afuera cerca de tu área',d:`${m}' · Está en posición de centro y tus defensores retroceden hacia el área.`,o:[
      choice('Salir a bloquear el centro','El lateral intenta cortar antes del envío.',{mini:'tackle',ok:'safe',fail:'keeper'}),
      choice('Cerrar el área y conceder la banda','Priorizás las zonas de remate.',{end:'reform'}),
      choice('Presionar al portador','Buscás que no pueda levantar la cabeza.',{mini:'press',ok:'safe',fail:'counterdef'})
    ]},c,'em807_cross_danger')}});
    items.push(
      {k:'approach',f:()=>{chain('em807_defend');return mark({kind:'seq79',stage:1,t:'El rival progresa hacia tu área',d:`${m}' · La pelota está en tu tercio defensivo y todavía podés frenar la jugada antes del remate.`,o:[
        choice('Cortar antes de que entre al área','Elegí el momento del cruce.',{mini:'tackle',ok:'safe',fail:'keeper'}),
        choice('Replegar y cerrar el centro','Cedés metros para recuperar la forma.',{e:{def:.012,att:-.004},end:'reform'}),
        choice('Presionar al portador','Buscás recuperar; si te supera, aumenta el peligro.',{mini:'press',ok:'safe',fail:'keeper'})
      ]},c,'em807_defend')}},
      {k:'runner',f:()=>{chain('em807_runner');return mark({kind:'seq79',stage:2,t:'Un rival ataca el espacio delante de tus centrales',d:`${m}' · La jugada ya entra en tu tercio y una mala lectura puede dejarlo de cara al arco.`,o:[
        choice('Anticipar el pase','Buscás cortar la jugada antes de que reciba.',{mini:'tackle',ok:'safe',fail:'keeper'}),
        choice('Acompañar la carrera','Retrocedés manteniendo al atacante delante tuyo.',{end:'reform'}),
        choice('Presionar al pasador','Intentás que no pueda filtrar limpio.',{mini:'press',ok:'safe',fail:'counterdef'})
      ]},c,'em807_runner')}}
    );
    return pickFresh(l,c,items)
  }

  function build807(idx,l=S.live){
    if(!l)return null;
    const c=context(l);
    if(!c)return typeof em806BuildScenario==='function'?em806BuildScenario(idx,l):null;

    // Primero conserva córners reales y situaciones personales ya detectadas por v0.8.6.
    let base=null;
    try{base=typeof em806BuildScenario==='function'?em806BuildScenario(idx,l):null}catch(e){}
    if(base&&['em806_corner','em806_corner_against','booked_defender','target_booked','tired_mid'].includes(base.key))return base;

    // Reincorpora eventos humanos ocasionales sin alterar la posición de la pelota.
    if(Math.random()<.10&&typeof makeRareEvent==='function'){
      try{
        let rare=makeRareEvent(idx);
        if(rare?.t&&Array.isArray(rare.o))return Object.assign(rare,{em806ZoneKey:c.key,em807:true})
      }catch(e){}
    }

    const tactical=tacticalContext(l,c);if(tactical)return tactical;
    if(c.poss==='us')return c.zone==='defensive'?userDefensive(l,c):c.zone==='midfield'?userMidfield(l,c):userAttacking(l,c);
    return c.zone==='defensive'?opponentDefensive(l,c):c.zone==='midfield'?opponentMidfield(l,c):opponentBuild(l,c)
  }

  // Todos los caminos de pausa usan la nueva selección variada, no solo makeMatchScenario.
  makeMatchScenario=function(idx){return build807(idx,S.live)};
  em80PauseForDecision=function(l=S.live){
    if(!l)return;
    try{if(typeof em80Stop==='function')em80Stop();l.scenario=build807(l.stopIndex,l);save();renderLiveDecision()}
    catch(e){console.error('em807 decision bridge',e);try{l.scenario=typeof em806BuildScenario==='function'?em806BuildScenario(l.stopIndex,l):null;save();renderLiveDecision()}catch(x){console.error('em807 fallback',x)}}
  };
  em80EmergencyDecision=function(l=S.live){if(!l)return;try{l.scenario=build807(l.stopIndex,l);save();renderLiveDecision()}catch(e){console.error('em807 emergency',e)}};

  // Resultado final: un callback tardío de un minijuego o animación nunca puede taparlo.
  const finishBase=finishLiveMatch;
  const resultBase=renderMatchResult;
  const postBase=renderPost;
  const finishPostBase=finishPost;
  const runBase=runNextStop;
  const renderBase=render;

  finishLiveMatch=function(){
    if(!S.live){if(S.em807ResultPending&&S.lastMatch)return resultBase();return}
    S.em807ResultPending=true;
    try{save()}catch(e){}
    const r=finishBase();
    if(S.lastMatch&&!S.live){S.em807ResultPending=true;try{save()}catch(e){};resultBase()}
    return r
  };
  renderMatchResult=function(){
    if(S.lastMatch&&!S.live){S.em807ResultPending=true;try{save()}catch(e){}}
    return resultBase()
  };
  renderPost=function(){S.em807ResultPending=false;try{save()}catch(e){};return postBase()};
  finishPost=function(){S.em807ResultPending=false;try{save()}catch(e){};return finishPostBase()};
  runNextStop=function(){
    if(!S.live&&S.em807ResultPending&&S.lastMatch)return resultBase();
    return runBase()
  };
  render=function(){
    const r=renderBase();
    if(!S.live&&S.em807ResultPending&&S.lastMatch){setTimeout(()=>{if(!S.live&&S.em807ResultPending&&S.lastMatch)resultBase()},0)}
    return r
  };

  window.em807BuildScenario=(idx=0,l=S.live)=>build807(idx,l);
})();
