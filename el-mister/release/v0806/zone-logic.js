/* ===== El Míster v0.8.6 · la cancha manda =====
   La posición/posesión REAL del Motor 2D define qué decisiones pueden aparecer.
   No mueve la escena para justificar una situación inventada.
   También formaliza laterales, saques de arco, córners y saque del medio.
*/
(function(){
  const C=v=>Math.max(0,Math.min(100,v));
  function ctx(l=S.live){
    let s=em80State(l),b=s?.ball||{},poss=b.ownerTeam||b.lastTeam||'us',y=Number(b.y??50),x=Number(b.x??EM80_W/2);
    let zone=y>=66?'defensive':y<=34?'attacking':'midfield';
    let depth=zone==='attacking'?(y<=17?'box':y<=28?'edge':'entry'):zone==='defensive'?(y>=84?'box':y>=72?'edge':'exit'):'middle';
    let side=x<EM80_W*.30?'left':x>EM80_W*.70?'right':'center';
    let owner=b.ownerTeam?em80P(b.ownerTeam,b.ownerIdx,l):null;
    return {poss,zone,depth,side,x,y,owner,ball:b,state:s,key:`${poss}_${zone}`}
  }
  function startChain(k){try{if(typeof start79==='function')start79(k)}catch(e){}}
  function playerName(c){return c.owner?.name|| (c.poss==='us'?'Tu jugador':'El rival')}
  function userPlayer(pos,skill){try{return typeof p79==='function'?p79(pos,skill):null}catch(e){return null}}
  function personnel(l,c){
    try{
      let yc=l.flow?.userCards?.[0];
      if(yc&&c.zone==='defensive'&&Math.random()<.16)return {kind:'tactical',key:'booked_defender',playerId:yc.playerId,t:`${yc.name} está condicionado por la amarilla`,d:`${l.minute}' · La jugada está cerca de tu área y el rival busca su sector.`,o:[{t:'Darle cobertura',h:'Un compañero queda atento a ese sector.',e:{def:.014,fat:1},set:'coverBooked'},{t:'Pedirle que no salte a cortar',h:'Defiende más atrás y evita otra entrada al límite.',e:{def:.009,att:-.003},set:'lowBlock'},{t:'Mantenerlo agresivo',h:'No cedés terreno, pero una mala entrada puede complicarte.',e:{def:.007,att:.004},set:'aggressiveBooked'}],em806ZoneKey:c.key};
      let oc=l.flow?.oppCards?.[0];
      if(oc&&c.poss==='us'&&c.zone==='attacking'&&Math.random()<.14)return {kind:'tactical',key:'target_booked',t:`${oc.name} está amonestado y sufre el duelo`,d:`${l.minute}' · Tenés la pelota cerca del área rival y podés cargar su sector.`,o:[{t:'Atacarlo en el uno contra uno',h:'Lo obligás a defender condicionado.',e:{att:.016,def:-.003},set:'targetBooked'},{t:'Buscar la diagonal a su espalda',h:'Intentás hacerlo correr hacia su arco.',e:{att:.013,def:.002},set:'diagonal'},{t:'Seguir la jugada por donde se abra',h:'No forzás el ataque sobre un solo sector.',e:{att:.005,def:.005}}],em806ZoneKey:c.key};
      let tired=typeof visibleTiredPlayer==='function'?visibleTiredPlayer():null;
      if(tired&&typeof playerCareerMetrics==='function'&&playerCareerMetrics(tired).physical<64&&Math.random()<.10)return {kind:'tactical',key:'tired_mid',playerId:tired.id,t:`${tired.name} está llegando tarde a las jugadas`,d:`${l.minute}' · El cansancio ya modifica sus recorridos.`,o:[{t:'Protegerlo bajando el ritmo',h:'Reducís desgaste y controlás más la pelota.',e:{att:-.004,def:.007,fat:-1},set:'manageEnergy'},{t:'Cambiar su función',h:'Le pedís que guarde posición y corra menos.',e:{def:.010,att:-.003},set:'holdPosition'},{t:'Exigirle unos minutos más',h:'Mantenés el plan, pero puede llegar tarde a otra cobertura.',e:{att:.006,def:-.004,fat:1}}],em806ZoneKey:c.key};
    }catch(e){}
    return null
  }
  function usBuild(l,c){
    startChain('em806_build');let p=playerName(c);
    return {kind:'seq79',key:'em806_build',stage:1,playerId:c.owner?.id,t:`${p} recibe cerca de tu área`,d:`${l.minute}' · La pelota está en tu tercio defensivo. Primero hay que superar la presión y salir limpio.`,o:[{t:'Salir con dos pases cortos',h:'Encontrá al compañero libre antes de que salte la presión.',mini:'playout',ok:'inside'},{t:'Jugar largo al delantero',h:'Sacás la pelota de la zona de riesgo y peleás la segunda pelota.',a:'second'},{t:'Abrir hacia el lateral libre',h:'Buscás salir por afuera sin rifarla.',mini:'through',ok:'wide'}],em806ZoneKey:c.key}
  }
  function usMid(l,c){
    startChain('em806_mid');let p=playerName(c);
    return {kind:'seq79',key:'em806_mid',stage:1,playerId:c.owner?.id,t:`${p} tiene la pelota en mitad de cancha`,d:`${l.minute}' · Todavía no estás en zona de remate. La decisión es cómo progresar y superar el mediocampo rival.`,o:[{t:'Filtrar entre líneas',h:'Buscás encontrar un receptor de frente antes de entrar al último tercio.',mini:'through',ok:'inside'},{t:'Abrir hacia la banda',h:'Movés la jugada al costado para avanzar con espacio.',a:'wide'},{t:'Asegurar la posesión',h:'Juntás pases y esperás que aparezca un hueco.',end:'keep'}],em806ZoneKey:c.key}
  }
  function usAttack(l,c){
    startChain('em806_attack');let p=playerName(c);
    if(c.side!=='center'&&c.y<=16)return {kind:'seq79',key:'em806_byline',stage:4,playerId:c.owner?.id,t:`${p} llega a la línea de fondo`,d:`${l.minute}' · La pelota está junto al área rival y hay compañeros entrando.`,o:[{t:'Pase atrás',h:'Buscás al que llega de frente.',mini:'passback',ok:'first'},{t:'Centro al área',h:'Elegí la zona donde va a caer el envío.',mini:'cross',ok:'first'},{t:'Frenar y buscar la falta',h:'El defensor llega lanzado y podés proteger la pelota.',contact:2}],em806ZoneKey:c.key};
    if(c.side!=='center')return {kind:'seq79',key:'em806_wide_attack',stage:3,playerId:c.owner?.id,t:`${p} encara cerca del área por ${c.side==='left'?'izquierda':'derecha'}`,d:`${l.minute}' · Ya estás en el último tercio: ahora sí podés generar una acción de gol.`,o:[{t:'Encara hacia la línea de fondo',h:'Buscás ganar el duelo y quedar en posición de centro.',mini:'dribble',ok:'line'},{t:'Engancha hacia adentro',h:'Buscás abrir un ángulo de remate.',mini:'dribble',ok:'shot'},{t:'Proteger y buscar el contacto',h:'Intentás provocar una falta cerca del área.',contact:2}],em806ZoneKey:c.key};
    if(c.y<=18)return {kind:'seq79',key:'em806_box',stage:5,playerId:c.owner?.id,t:`${p} recibe dentro del área rival`,d:`${l.minute}' · Está en zona de definición y la defensa recupera metros.`,o:[{t:'Rematar de primera',h:'No dejás acomodar al arquero.',mini:'first',goal:1},{t:'Controlar y perfilarse',h:'Ganás ángulo, pero vuelve la marca.',a:'shot'},{t:'Pase al medio',h:'Buscás a un compañero mejor ubicado.',mini:'passback',ok:'first'}],em806ZoneKey:c.key};
    return {kind:'seq79',key:'em806_edge',stage:3,playerId:c.owner?.id,t:`${p} recibe de frente cerca del área rival`,d:`${l.minute}' · La pelota está en zona donde un remate, un pase filtrado o una falta pueden terminar en ocasión clara.`,o:[{t:'Buscar el remate',h:'Intentás terminar la jugada antes de que cierre la defensa.',mini:'first',goal:1},{t:'Filtrar para el delantero',h:'Buscás romper la última línea.',mini:'through',ok:'finish'},{t:'Proteger y buscar la falta',h:'El defensor tiene que decidir muy cerca del área.',contact:2}],em806ZoneKey:c.key}
  }
  function themDef(l,c){
    startChain('em806_defend');
    if(c.y>=86)return {kind:'seq79',key:'em806_keeper_danger',stage:2,t:'El rival entra en tu área',d:`${l.minute}' · La pelota ya está en zona de definición. Tu defensa y tu arquero tienen que resolver la emergencia.`,o:[{t:'Salir al cruce',h:'Un defensor intenta bloquear antes del remate.',mini:'tackle',ok:'safe',fail:'keeper'},{t:'Cerrar el centro del área',h:'Priorizás quitarle el pase al medio.',end:'reform'},{t:'Aguantar con el arquero',h:'Si consigue rematar, el arquero tendrá que leer la definición.',mini:'keeper',save:1}],em806ZoneKey:c.key};
    return {kind:'seq79',key:'em806_defend',stage:1,t:'El rival progresa hacia tu área',d:`${l.minute}' · La pelota está en tu tercio defensivo. La prioridad es impedir que llegue limpio a zona de remate.`,o:[{t:'Cortar antes de que entre al área',h:'Elegí el momento del cruce.',mini:'tackle',ok:'safe',fail:'keeper'},{t:'Replegar y cerrar el centro',h:'Cedés unos metros para recuperar la forma.',end:'reform',e:{def:.012,att:-.004}},{t:'Presionar al portador',h:'Buscás recuperar, pero si te supera puede quedar mano a mano.',mini:'press',ok:'safe',fail:'keeper'}],em806ZoneKey:c.key}
  }
  function themMid(l,c){
    startChain('em806_them_mid');
    return {kind:'seq79',key:'em806_them_mid',stage:1,t:'El rival intenta romper tu mediocampo',d:`${l.minute}' · La pelota está en la zona central. Todavía no es una emergencia de área: tenés que decidir cómo frenar la progresión.`,o:[{t:'Saltar a presionar',h:'Intentás recuperar antes de que el rival entre en tu campo.',mini:'press',ok:'safe',fail:'counterdef'},{t:'Cerrar líneas de pase',h:'Juntás el bloque y obligás al rival a jugar hacia afuera.',end:'reform'},{t:'Replegar detrás de la pelota',h:'Priorizás no dejar espacios entre líneas.',end:'reform'}],em806ZoneKey:c.key}
  }
  function themBuild(l,c){
    startChain('em806_press_build');
    return {kind:'seq79',key:'em806_press_build',stage:1,t:'El rival intenta salir desde su campo',d:`${l.minute}' · La pelota está cerca del área rival, pero la tiene el rival: no corresponde una opción de remate. Podés decidir cómo presionar su salida.`,o:[{t:'Presionar arriba',h:'Intentás robar cerca de su área.',mini:'press',ok:'inside'},{t:'Tapar el pase interior',h:'Lo obligás a salir por un costado.',e:{def:.008,att:.006},end:'reform'},{t:'Esperar en mitad de cancha',h:'No rompés el bloque y preparás la recuperación.',e:{def:.010},end:'reform'}],em806ZoneKey:c.key}
  }
  function build(idx,l=S.live){
    let c=ctx(l),p=personnel(l,c);if(p)return p;
    if(c.poss==='us')return c.zone==='defensive'?usBuild(l,c):c.zone==='midfield'?usMid(l,c):usAttack(l,c);
    return c.zone==='defensive'?themDef(l,c):c.zone==='midfield'?themMid(l,c):themBuild(l,c)
  }
  function stagePlayer(team,roles,l=S.live){let a=em80Players(team,l).filter(p=>p.active!==false),p=a.find(x=>roles.includes(x.pos));return p||a[0]}
  function own(team,p,x,y,l=S.live){let s=em80State(l);if(!s||!p)return; p.x=Math.max(2.8,Math.min(EM80_W-2.8,x));p.y=Math.max(2.5,Math.min(97.5,y));p.tx=p.x;p.ty=p.y;p.vx=0;p.vy=0;s.ball={x:p.x,y:p.y+em80Dir(team)*.65,vx:0,vy:0,ownerTeam:team,ownerIdx:p.idx,lastTeam:team,flight:null}}
  function moveForStage(k,l=S.live){
    if(!l)return;let s=em80State(l),cur=ctx(l),side=cur.x<EM80_W/2?EM80_W*.17:EM80_W*.83,p;
    if(['inside','shot'].includes(k)){p=stagePlayer('us',['MCO','MC','DC'],l);own('us',p,EM80_W*.5,k==='shot'?20:29,l)}
    else if(['wide','duel'].includes(k)){p=stagePlayer('us',['EI','ED','LI','LD'],l);own('us',p,side,k==='duel'?23:30,l)}
    else if(k==='line'){p=stagePlayer('us',['EI','ED','LI','LD'],l);own('us',p,side,10,l)}
    else if(['finish','first'].includes(k)){p=stagePlayer('us',['DC','MCO','EI','ED'],l);own('us',p,EM80_W*.5,k==='finish'?15:13,l)}
    else if(k==='second'){p=stagePlayer('us',['MC','MCD','MCO'],l);own('us',p,EM80_W*.5,49,l)}
    else if(k==='pressout'){p=stagePlayer('us',['DFC','MCD','MC'],l);own('us',p,EM80_W*.5,78,l)}
    else if(['counterdef','keeper'].includes(k)){p=stagePlayer('them',['DC','MCO','EI','ED'],l);own('them',p,EM80_W*.5,k==='keeper'?87:76,l)}
    else if(k==='safe'){p=stagePlayer('us',['MCD','MC','DFC'],l);own('us',p,EM80_W*.5,61,l)}
    try{save()}catch(e){}
  }

  if(typeof go79==='function'){
    const baseGo=go79;
    go79=function(k){try{moveForStage(k,S.live)}catch(e){console.warn('em806 stage consequence',e)}return baseGo(k)}
  }

  if(typeof mini79done==='function'){
    const baseMiniDone=mini79done;
    mini79done=function(ok,title,text,goal=false,keeper=false){
      try{let g=_79mini,l=S.live;if(l&&g&&!ok&&!goal&&!keeper&&!g.o?.fail&&['dribble','through','cross','passback','first','playout'].includes(g.kind)){let c=ctx(l),d=stagePlayer('them',['DFC','LI','LD','MCD','MC'],l);if(d)own('them',d,c.x,c.y,l)}}catch(e){}
      return baseMiniDone(ok,title,text,goal,keeper)
    }
  }

  const baseShouldPause=em80ShouldPause;
  em80ShouldPause=function(l=S.live){let s=em80State(l);if(!s||s.ball?.flight||!s.ball?.ownerTeam||performance.now()<Number(s.restartUntil||0))return false;if(l?.em806PendingSetPiece)return true;return baseShouldPause(l)};

  makeMatchScenario=function(idx){return build(idx,S.live)};
  em80DrawDecision=function(){let c=document.getElementById('em80DecisionCanvas');if(c&&S.live)em80Draw(c,S.live)};

  const baseRenderDecision=renderLiveDecision;
  renderLiveDecision=function(){let l=S.live;if(l?.scenario&&!l.scenario.em806ZoneKey&&!['injury','crowd','locker'].includes(l.scenario.key)){try{l.scenario=build(l.stopIndex,l);save()}catch(e){}}return baseRenderDecision()};

  em80PauseForDecision=function(l=S.live){if(!l)return;try{em80Stop();l.scenario=build(l.stopIndex,l);save();renderLiveDecision()}catch(e){console.error('em806 decision bridge',e);try{l.scenario=usMid(l,ctx(l));save();renderLiveDecision()}catch(x){console.error('em806 fallback',x)}}};
  em80EmergencyDecision=function(l=S.live){if(!l)return;try{l.scenario=build(l.stopIndex,l);save();renderLiveDecision()}catch(e){console.error('em806 emergency',e)}};

  function restartOwner(team,type,l,meta={}){
    let s=em80State(l),arr=em80Players(team,l).filter(p=>p.active!==false),p,x,y;
    if(type==='throwIn'){
      let side=meta.side==='left'?3:EM80_W-3,y0=Math.max(8,Math.min(92,Number(meta.y||50)));p=arr.find(q=>['LI','LD','EI','ED','MI','MD'].includes(q.pos))||arr[0];x=side;y=y0;own(team,p,x,y,l);s.restartUntil=performance.now()+900;s.nextBrainAt=s.restartUntil+220;s.lastRestart={type,team,x,y};em80Comment(`${team==='us'?'Tu equipo':'El rival'} repone con un lateral.`,l);return true
    }
    if(type==='corner'){
      let top=team==='us',side=meta.side==='left'?3:EM80_W-3;p=arr.find(q=>['EI','ED','LI','LD','MCO'].includes(q.pos))||arr[0];x=side;y=top?3:97;own(team,p,x,y,l);s.restartUntil=performance.now()+1400;s.nextBrainAt=s.restartUntil+250;s.lastRestart={type,team,x,y};l.em806PendingSetPiece={type:'corner',team,side:meta.side||'right'};em80Comment(`${team==='us'?'Córner a favor':'Córner para el rival'}. La pelota va al banderín.`,l);return true
    }
    return false
  }
  const baseRestart=em80Restart;
  em80Restart=function(team,type='goalKick',l=S.live,meta={}){if(type==='throwIn'||type==='corner'){if(restartOwner(team,type,l,meta))return}let r=baseRestart(team,type,l);try{let s=em80State(l);s.lastRestart={type,team}}catch(e){}return r};

  function cornerScenario(l,c,pending){
    startChain('em806_corner');
    if(pending.team==='us')return {kind:'seq79',key:'em806_corner',stage:1,t:'Córner a favor',d:`${l.minute}' · La pelota salió por la línea de fondo tocada por un rival. Ahora sí hay pelota parada desde el banderín.`,o:[{t:'Centro al primer palo',h:'Buscás anticipar a la defensa.',mini:'cross',ok:'first'},{t:'Centro al segundo palo',h:'Buscás una llegada por detrás.',mini:'cross',ok:'first'},{t:'Jugar corto',h:'Conservás la posesión y buscás otro ángulo.',a:'wide'}],em806ZoneKey:c.key};
    return {kind:'seq79',key:'em806_corner_against',stage:1,t:'Córner para el rival',d:`${l.minute}' · La pelota salió por tu línea de fondo tocada por uno de los tuyos. Hay que defender el área.`,o:[{t:'Marcar en zona',h:'Protegés el área chica y las principales zonas de remate.',end:'reform'},{t:'Marca hombre a hombre',h:'Cada defensor toma una referencia.',e:{def:.009,fat:1},end:'reform'},{t:'Dejar uno para la contra',h:'Defendés con uno menos dentro del área, pero conservás salida.',e:{att:.006,def:-.003},end:'reform'}],em806ZoneKey:c.key}
  }
  const baseBuild=build;
  build=function(idx,l=S.live){let c=ctx(l),sp=l?.em806PendingSetPiece;if(sp?.type==='corner'){l.em806PendingSetPiece=null;return cornerScenario(l,c,sp)}return baseBuild(idx,l)};
  makeMatchScenario=function(idx){return build(idx,S.live)};

  const baseFinishFlight=em80FinishFlight;
  em80FinishFlight=function(now,l=S.live){
    let s=em80State(l),b=s?.ball,f=b?.flight;if(!f)return;
    let t=Math.max(0,Math.min(1,(now-f.started)/f.duration));
    if(t<1)return baseFinishFlight(now,l);
    let tx=Number(f.to?.x??b.x),ty=Number(f.to?.y??b.y),last=f.lastTouchTeam||f.team||b.lastTeam||'us';
    let sideOut=tx<=1||tx>=EM80_W-1,endOut=ty<=1.25||ty>=98.75,inGoalMouth=Math.abs(tx-EM80_W/2)<=EM80_GOAL_HALF;
    if(endOut&&f.outcome==='goal'&&inGoalMouth)return baseFinishFlight(now,l);
    if(sideOut){b.flight=null;b.x=Math.max(0,Math.min(EM80_W,tx));b.y=Math.max(2,Math.min(98,ty));let team=em80Opp(last),side=tx<EM80_W/2?'left':'right';em80Restart(team,'throwIn',l,{side,y:b.y});return}
    if(endOut&&!inGoalMouth){b.flight=null;b.x=Math.max(1,Math.min(EM80_W-1,tx));b.y=ty<50?1:99;let attacking=ty<50?'us':'them',defending=em80Opp(attacking);if(last===attacking){em80Comment(`${attacking==='us'?'Tu remate':'El remate rival'} se va por la línea de fondo. Saque de arco.`,l);em80Restart(defending,'goalKick',l);return}em80Restart(attacking,'corner',l,{side:tx<EM80_W/2?'left':'right'});return}
    return baseFinishFlight(now,l)
  };

  window.em806ZoneContext=ctx;
  window.em806BuildScenario=(idx=0,l=S.live)=>build(idx,l);
  window.em806MoveForStage=moveForStage;
})();
